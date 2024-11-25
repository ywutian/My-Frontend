import { useState, useCallback, useRef } from 'react';

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const lastTranslationRef = useRef({ text: '', timestamp: 0 });
  const translationCallbackRef = useRef(null);
  const THROTTLE_TIME = 300;
  
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
      lastTranslationRef.current = {
        text,
        timestamp: now,
        translation: '' // 初始化
      };

      console.log('Sending translation request to server');
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
    
    translateText(transcript.text).then(translation => {
      if (translation) {
        transcript.onTranslationComplete?.(transcript.id, translation);
      }
    });
  }, [isTranslating, translateText]);

  const toggleTranslation = useCallback(async (existingTranscripts = []) => {
    setIsTranslating(prev => {
      const newState = !prev;
      
      if (newState && existingTranscripts.length > 0) {
        // 处理现有转录
        existingTranscripts.forEach(async (transcript) => {
          if (!transcript.translation && transcript.text) {
            const translation = await translateText(transcript.text);
            transcript.onTranslationComplete?.(transcript.id, translation);
          }
        });
      }
      
      return newState;
    });
  }, [translateText]);

  return {
    isTranslating,
    translateText,
    toggleTranslation,
    handleNewTranscript
  };
}