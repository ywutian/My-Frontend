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

  // 定义置信度阈值
  const CONFIDENCE_THRESHOLD = 0.9; // 90% 置信度

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

  const startRecording = useCallback(async (onTranscriptReceived) => {
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
        model: 'nova-2', // 使用更新的模型
        interim_results: true,
        punctuate: true,
        endpointing: true,
        encoding: 'linear16',
        sample_rate: audioContextRef.current.sampleRate,
        numerals: true, 
        filler_words: true,  
        keywords: true,
      };

      console.log('Initializing Deepgram live connection...');
      deepgramRef.current = deepgram.listen.live(options);

      // 设置事件监听器
      deepgramRef.current.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened successfully');
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

        // 检查置信度
        const confidence = transcript.confidence;
        
        // 构建转录数据
        const transcriptSegment = {
          id: Date.now(),
          words: transcript.words,
          text: transcript.words.map(w => w.punctuated_word || w.word).join(' '),
          confidence: confidence,
          startTime: transcript.words[0]?.start,
          endTime: transcript.words[transcript.words.length - 1]?.end,
          isFinal: data.is_final
        };

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

        // 总是调用回调，让上层决定是否需要翻译
        onTranscriptReceived(transcriptData);
      });

      // 音频处理逻辑
      let audioProcessingCount = 0;
      let lastLogTime = Date.now();
      const LOG_INTERVAL = 5000; // 每5秒输出一次统计信息

      const BUFFER_DURATION = 700;     
      const SILENCE_THRESHOLD = 0.005;  
      const MIN_SAMPLES_FOR_PROCESSING = 16384; 

      processorRef.current.onaudioprocess = (e) => {
        if (!deepgramRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        audioProcessingCount++;

        // 每5秒输出一次音频处理统计
        const currentTime = Date.now();
        if (currentTime - lastLogTime >= LOG_INTERVAL) {
          console.log('音频处理统计:', {
            处理次数: audioProcessingCount,
            缓冲区大小: audioBufferRef.current.length,
            距离上次发送: `${currentTime - lastSendTimeRef.current}ms`,
            每秒处理次数: (audioProcessingCount / (LOG_INTERVAL / 1000)).toFixed(2)
          });
          audioProcessingCount = 0;
          lastLogTime = currentTime;
        }

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

        if (!hasSound) {
          console.log('检测到静音，跳过处理');
          return;
        }

        // 优化的数据处理
        const processedData = convertFloat32ToInt16(inputData);
        audioBufferRef.current.push(...processedData);

        // 更保守的数据发送策略
        const timeSinceLastSend = currentTime - lastSendTimeRef.current;
        const hasEnoughSamples = audioBufferRef.current.length >= MIN_SAMPLES_FOR_PROCESSING;
        const hasEnoughTime = timeSinceLastSend >= BUFFER_DURATION;

        // console.log('发送条件检查:', {
        //   缓冲区大小: audioBufferRef.current.length,
        //   最小样本数要求: MIN_SAMPLES_FOR_PROCESSING,
        //   距离上次发送: `${timeSinceLastSend}ms`,
        //   时间间隔要求: BUFFER_DURATION,
        //   满足样本条件: hasEnoughSamples,
        //   满足时间条件: hasEnoughTime
        // });

        const shouldSendData = hasEnoughTime && hasEnoughSamples;

        if (shouldSendData && audioBufferRef.current.length > 0) {
          try {
            const bufferToSend = new Int16Array(audioBufferRef.current);
            console.log('发送音频数据:', {
              数据大小: bufferToSend.length,
              距离上次发送: `${timeSinceLastSend}ms`,
              发送时间: new Date().toISOString()
            });

            deepgramRef.current.send(bufferToSend);
            
            // 立即清空缓冲区
            audioBufferRef.current = [];
            lastSendTimeRef.current = currentTime;
          } catch (sendError) {
            console.error('发送音频数据失败:', sendError);
          }
        }
      };

      // 在创建音频处理器时也添加日志
      console.log('音频处理器配置:', {
        缓冲时间: `${BUFFER_DURATION}ms`,
        最小样本数: MIN_SAMPLES_FOR_PROCESSING,
        静音阈值: SILENCE_THRESHOLD
      });

      console.log('Recording setup completed successfully');

    } catch (error) {
      console.error('Setup error:', error);
      setError(`Setup error: ${error.message}`);
      cleanup();
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    cleanup();
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
    stopRecording
  };
} 