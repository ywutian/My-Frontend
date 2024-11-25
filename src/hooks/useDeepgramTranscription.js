import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { useState, useRef, useCallback } from 'react';

export function useDeepgramTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const deepgramRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const audioBufferRef = useRef([]);
  const lastSendTimeRef = useRef(0);
  const transcriptBufferRef = useRef('');
  const lastCompleteTranscriptRef = useRef('');
  const TRANSCRIPT_STABILITY_THRESHOLD = 3; 

  const stableTranscriptRef = useRef('');     
  const transcriptHistoryRef = useRef([]);    
  const stabilityCounterRef = useRef(0);      
  const HISTORY_SIZE = 5;                     
  const STABILITY_THRESHOLD = 3;              

  // 新增：用于管理句子的 ref
  const currentSentenceRef = useRef({
    text: '',
    words: [],
    startTime: null,
    confidence: 0
  });

  // 添加新的状态管理
  const timelineWordsRef = useRef(new Map()); // 存储时间轴上的词: key是时间戳, value是词对象
  const CONFIDENCE_THRESHOLDS = {
    HIGH: 0.60,
    MEDIUM: 0.40,
    LOW: 0.20
  };

  const cleanup = useCallback(() => {
    console.log('Cleaning up resources...');
    if (deepgramRef.current) {
      console.log('Closing Deepgram connection...');
      deepgramRef.current.finish();
      deepgramRef.current = null;
    }
    if (streamRef.current) {
      console.log('Stopping media stream...');
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      console.log('Disconnecting audio processor...');
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      console.log('Closing audio context...');
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioBufferRef.current = [];
    lastSendTimeRef.current = 0;
    setIsRecording(false);
    console.log('Cleanup completed');
  }, []);

  const startRecording = useCallback(async (onTranscriptReceived, onNewTranscriptForTranslation = null) => {
    try {
      console.log('Starting recording process...');
      
      const deepgramApiKey = process.env.REACT_APP_DEEPGRAM_API_KEY;
      if (!deepgramApiKey) {
        throw new Error('Deepgram API key is not set');
      }
      console.log('API key validated');

      console.log('Creating Deepgram client...');
      const deepgram = createClient(deepgramApiKey);

      console.log('Requesting microphone access...');
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false,
        });
        console.log('Microphone access granted');
      } catch (mediaError) {
        throw new Error(`Microphone access denied: ${mediaError.message}`);
      }

      // 创建音频上下文
      console.log('Creating audio context...');
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);

      // 创建音频处理器
      console.log('Setting up audio processor...');
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      // 创建实时转录项目
      const options = {
        language: 'en',
        smart_format: true,
        model: 'nova',
        interim_results: true,
        punctuate: true,
        endpointing: true,
        encoding: 'linear16',
        sample_rate: audioContextRef.current.sampleRate
      };

      console.log('Initializing Deepgram live connection...');
      deepgramRef.current = deepgram.listen.live(options);

      // 设置事件监听器
      deepgramRef.current.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened successfully');
        console.log('Connection state:', deepgramRef.current.getReadyState());
        setIsRecording(true);
      });

      deepgramRef.current.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        console.log('Final connection state:', deepgramRef.current?.getReadyState());
        cleanup();
      });

      deepgramRef.current.on(LiveTranscriptionEvents.Error, (error) => {
        console.error('Deepgram error:', error);
        console.log('Connection state at error:', deepgramRef.current?.getReadyState());
        setError(`Deepgram error: ${error.message}`);
        cleanup();
      });

      deepgramRef.current.on(LiveTranscriptionEvents.Warning, (warning) => {
        console.warn('Deepgram warning:', warning);
      });

      deepgramRef.current.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data?.channel?.alternatives?.[0];
        if (!transcript?.words?.length) return;

        // 处理新的词序列
        const processWords = (words) => {
          words.forEach(word => {
            const timeKey = word.start.toFixed(2); // 使用开始时间作为key
            const existingWord = timelineWordsRef.current.get(timeKey);

            // 判断是否需要更新这个时间点的词
            const shouldUpdate = !existingWord || 
              word.confidence > CONFIDENCE_THRESHOLDS.LOW || 
              data.is_final;

            if (shouldUpdate) {
              timelineWordsRef.current.set(timeKey, {
                ...word,
                isConfirmed: data.is_final
              });
            }
          });

          // 构建当前的转录状态
          const sortedWords = Array.from(timelineWordsRef.current.entries())
            .sort(([timeA], [timeB]) => parseFloat(timeA) - parseFloat(timeB))
            .map(([_, word]) => word);

          // 准备转录数据
          const transcriptSegment = {
            id: Date.now(),
            words: sortedWords,
            text: sortedWords.map(w => w.punctuated_word || w.word).join(' '),
            confidence: sortedWords.reduce((acc, w) => acc + w.confidence, 0) / sortedWords.length,
            startTime: sortedWords[0]?.start,
            endTime: sortedWords[sortedWords.length - 1]?.end,
            isFinal: data.is_final
          };

          return transcriptSegment;
        };

        const transcriptSegment = processWords(transcript.words);

        // 准备完整的转录数据
        const transcriptData = {
          ...data,
          channel: {
            ...data.channel,
            alternatives: [{
              ...transcript,
              processedTranscript: transcriptSegment
            }]
          }
        };

        // 调用转录回调
        onTranscriptReceived(transcriptData);

        // 处理翻译（如果启用）
        if (onNewTranscriptForTranslation && data.is_final) {
          onNewTranscriptForTranslation({
            id: transcriptSegment.id,
            text: transcriptSegment.text,
            confidence: transcriptSegment.confidence,
            startTime: transcriptSegment.startTime,
            endTime: transcriptSegment.endTime,
            words: transcriptSegment.words,
            onTranslationComplete: (id, translation) => {
              // 翻译完成后的回调
              onTranscriptReceived({
                ...transcriptData,
                translation,
                id
              });
            }
          });
        }
      });

      // 音频处理逻辑
      let audioProcessingCount = 0;
      const BUFFER_DURATION = 250; // 降低缓冲区时长从500ms到250ms
      const SILENCE_THRESHOLD = 0.005; // 降低静音检测阈值，使其更敏感
      const MIN_SAMPLES_FOR_PROCESSING = 2048; // 最小处理样本数

      processorRef.current.onaudioprocess = (e) => {
        if (!deepgramRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        audioProcessingCount++;

        // 优化的静音检测 - 使用分段检测
        const chunkSize = 1024;
        let hasSound = false;
        for (let i = 0; i < inputData.length; i += chunkSize) {
          const chunk = inputData.slice(i, i + chunkSize);
          const rms = Math.sqrt(chunk.reduce((sum, sample) => sum + sample * sample, 0) / chunk.length);
          if (rms > SILENCE_THRESHOLD) {
            hasSound = true;
            break;
          }
        }

        if (!hasSound) return;

        // 优化的数据处理
        const processedData = convertFloat32ToInt16(inputData);
        audioBufferRef.current.push(...processedData);

        // 更积极的数据发送策略
        const currentTime = Date.now();
        const shouldSendData = 
          currentTime - lastSendTimeRef.current >= BUFFER_DURATION || 
          audioBufferRef.current.length >= MIN_SAMPLES_FOR_PROCESSING;

        if (shouldSendData && audioBufferRef.current.length > 0) {
          try {
            const bufferToSend = new Int16Array(audioBufferRef.current);
            deepgramRef.current.send(bufferToSend);
            
            // 立即清空缓冲区
            audioBufferRef.current = [];
            lastSendTimeRef.current = currentTime;
          } catch (sendError) {
            console.error('Error sending audio data:', sendError);
          }
        }
      };

      console.log('Recording setup completed successfully');

    } catch (error) {
      console.error('Setup error:', error);
      setError(`Setup error: ${error.message}`);
      cleanup();
    }
  }, [cleanup]);

  const convertFloat32ToInt16 = (float32Array) => {
    try {
      const int16Array = new Int16Array(float32Array.length);
      for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return int16Array;
    } catch (error) {
      console.error('Error converting audio format:', error);
      throw error;
    }
  };

  return {
    isRecording,
    error,
    startRecording,
    stopRecording: cleanup
  };
} 