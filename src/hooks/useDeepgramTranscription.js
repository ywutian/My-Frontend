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
        const isFinal = data?.is_final;
        const speechFinal = data?.speech_final;
        
        if (!transcript) return;

        // 处理当前转录段落
        const processTranscriptSegment = () => {
          const { text, words, confidence } = transcript;
          
          // 如果是新的语音段落开始
          if (speechFinal || words[0]?.start > (currentSentenceRef.current.words[currentSentenceRef.current.words.length - 1]?.end || 0) + 1) {
            // 完成当前句子
            if (currentSentenceRef.current.text) {
              const completedSentence = {
                id: Date.now(),
                text: currentSentenceRef.current.text,
                words: currentSentenceRef.current.words,
                confidence: currentSentenceRef.current.confidence,
                startTime: currentSentenceRef.current.startTime,
                endTime: currentSentenceRef.current.words[currentSentenceRef.current.words.length - 1]?.end,
                isFinal: true
              };

              // 重置当前句子
              currentSentenceRef.current = {
                text: text,
                words: words,
                startTime: words[0]?.start,
                confidence: confidence
              };

              return completedSentence;
            }
          }

          // 更新当前句子
          if (!currentSentenceRef.current.startTime) {
            currentSentenceRef.current.startTime = words[0]?.start;
          }
          
          currentSentenceRef.current.text = text;
          currentSentenceRef.current.words = words;
          currentSentenceRef.current.confidence = confidence;

          return {
            id: Date.now(),
            text: currentSentenceRef.current.text,
            words: currentSentenceRef.current.words,
            confidence: currentSentenceRef.current.confidence,
            startTime: currentSentenceRef.current.startTime,
            isFinal: false
          };
        };

        const transcriptSegment = processTranscriptSegment();

        // 准备发送给回调的数据
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

        // 调用主要的转录回调
        onTranscriptReceived(transcriptData);

        // 如果是最终结果且启用了翻译，调用翻译回调
        if (onNewTranscriptForTranslation) {
          onNewTranscriptForTranslation({
            id: transcriptSegment.id,
            text: transcriptSegment.text,
            confidence: transcriptSegment.confidence,
            startTime: transcriptSegment.startTime,
            endTime: transcriptSegment.endTime,
            onTranslationComplete: (id, translation) => {
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
      const BUFFER_DURATION = 500; // 缓冲区时长（毫秒）
      const SILENCE_THRESHOLD = 0.01; // 静音检测阈值

      processorRef.current.onaudioprocess = (e) => {
        if (!deepgramRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        audioProcessingCount++;

        // 改进的静音检测
        const rms = Math.sqrt(inputData.reduce((sum, sample) => sum + sample * sample, 0) / inputData.length);
        if (rms < SILENCE_THRESHOLD) {
          return;
        }

        // 将数据添加到缓冲区
        audioBufferRef.current.push(...convertFloat32ToInt16(inputData));

        // 检查是否需要发送数据
        const currentTime = Date.now();
        if (currentTime - lastSendTimeRef.current >= BUFFER_DURATION && audioBufferRef.current.length > 0) {
          try {
            const bufferToSend = new Int16Array(audioBufferRef.current);
            
            if (audioProcessingCount % 10 === 0) {
              console.log(`Sending buffered audio: length=${bufferToSend.length}, timestamp=${currentTime}`);
            }

            deepgramRef.current.send(bufferToSend);
            
            // 清空缓冲区并更新发送时间
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