import { useState, useCallback, useRef } from 'react';

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const lastTranslationRef = useRef({ text: '', timestamp: 0 });
  const translationQueueRef = useRef([]);
  const isProcessingRef = useRef(false);
  const lastTranslatedIndexRef = useRef(-1);
  const THROTTLE_TIME = 300;

  const addToTranslationQueue = useCallback((segment) => {
    translationQueueRef.current.push({
      ...segment,
      translated: false,
      timestamp: Date.now()
    });

    // 如果翻译已启动，尝试处理队列
    if (isTranslating && !isProcessingRef.current) {
      processTranslationQueue();
    }
  }, [isTranslating]);

  // 处理翻译队列
  const processTranslationQueue = useCallback(async () => {
    if (isProcessingRef.current || !isTranslating) return;

    isProcessingRef.current = true;
    console.log('Processing translation queue...');

    try {
      // 从上次翻译的位置继续
      const nextIndex = lastTranslatedIndexRef.current + 1;
      
      while (nextIndex < translationQueueRef.current.length) {
        const segment = translationQueueRef.current[nextIndex];
        
        if (!segment.translated && segment.text) {
          console.log(`Translating segment ${nextIndex}:`, segment.text);
          
          const translation = await translateText(segment.text);
          
          if (translation) {
            // 更新队列中的段落
            translationQueueRef.current[nextIndex] = {
              ...segment,
              translated: true,
              translation
            };

            // 调用回调通知更新
            segment.onTranslationComplete?.(segment.id, translation);
          }
        }
        
        lastTranslatedIndexRef.current = nextIndex;
        nextIndex++;
      }
    } catch (error) {
      console.error('Error processing translation queue:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [isTranslating]);

  const translateText = useCallback(async (text) => {
    if (!text) return '';
    
    // 添加调试日志
    console.log('Translation requested for:', text);
    
    // 检查是否需要节流
    const now = Date.now();
    if (
      text === lastTranslationRef.current.text && 
      now - lastTranslationRef.current.timestamp < THROTTLE_TIME
    ) {
      console.log('Using cached translation');
      return lastTranslationRef.current.translation;
    }
    
    try {
      const response = await fetch('http://localhost:5001/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang: 'en',
          targetLang: 'zh',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const translation = data?.translation || '';
      
      console.log('Translation received:', translation);
      
      // 保存最新的翻译结果
      lastTranslationRef.current.translation = translation;
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return '';
    }
  }, []);

  const handleNewTranscript = useCallback((transcript) => {
    if (!isTranslating || !transcript.text) return;
    
    addToTranslationQueue({
        id: transcript.id,
        text: transcript.text,
        timestamp: transcript.timestamp,
        onTranslationComplete: transcript.onTranslationComplete
      });
    }, [isTranslating, addToTranslationQueue]);

 const toggleTranslation = useCallback(async (existingTranscripts = []) => {
    setIsTranslating(prev => {
      const newState = !prev;
      
      if (newState) {
        // 将现有转录添加到队列
        existingTranscripts.forEach(transcript => {
          if (!transcript.translation && transcript.text) {
            addToTranslationQueue({
              id: transcript.id,
              text: transcript.text,
              timestamp: transcript.timestamp,
              onTranslationComplete: transcript.onTranslationComplete
            });
          }
        });
        
        // 开始处理队列
        processTranslationQueue();
      } else {
        // 重置翻译状态
        lastTranslatedIndexRef.current = -1;
        isProcessingRef.current = false;
      }
      
      return newState;
    });
  }, [addToTranslationQueue, processTranslationQueue]);

  // 清理队列的方法
  const clearTranslationQueue = useCallback(() => {
    translationQueueRef.current = [];
    lastTranslatedIndexRef.current = -1;
    isProcessingRef.current = false;
  }, []);

  return {
    isTranslating,
    translateText,
    toggleTranslation,
    handleNewTranscript,
    clearTranslationQueue
  };
}