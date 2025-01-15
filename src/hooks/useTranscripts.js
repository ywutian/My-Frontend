import { useState, useCallback, useMemo } from 'react';

export function useTranscripts() {
  // 使用单一状态管理所有转录数据
  const [transcriptBuffer, setTranscriptBuffer] = useState({
    segments: [],           // 已完成的段落
    currentSegment: {       // 当前正在处理的段落
      id: `segment-${Date.now()}`,
      texts: [],
      wordCount: 0,
      startTime: null
    },
    interimResult: null     // 临时结果
  });

  // 判断是否应该创建新段落
  const shouldCreateNewSegment = useCallback((segment, newTranscript) => {
    // 1. 检查最小字数要求
    const MIN_WORDS = 20;
    const hasMinWords = segment.wordCount >= MIN_WORDS;
    
    if (!hasMinWords) return false;

    // 2. 检查最后一个文本是否以标点符号结束
    const lastText = segment.texts[segment.texts.length - 1]?.text || '';
    const endsWithPunctuation = /[.!?。！？]$/.test(lastText.trim());
    
    // 3. 检查新文本是否以大写字母开头
    const newText = newTranscript.text || '';
    const startsWithCapital = /^[A-Z]/.test(newText.trim());

    // 同时满足：
    // - 达到最小字数
    // - 上一句以标点符号结束
    // - 新句子以大写字母开头
    return hasMinWords && endsWithPunctuation && startsWithCapital;
  }, []);

  // 更新最新的转录内容
  const updateLatestTranscript = useCallback((data) => {
    const transcriptData = data?.channel?.alternatives?.[0];
    if (!transcriptData) return;

    const transcript = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: transcriptData.transcript || '',
      confidence: transcriptData.confidence || 0,
      words: transcriptData.words || [],
      isFinal: data.is_final,
      timestamp: Date.now()
    };

    if (transcript.text.trim() && transcript.confidence >= 0.9) {
      setTranscriptBuffer(prev => {
        if (transcript.isFinal) {
          // 更新当前段落
          const updatedSegment = {
            ...prev.currentSegment,
            texts: [...prev.currentSegment.texts, transcript],
            wordCount: prev.currentSegment.wordCount + transcript.words.length,
            startTime: prev.currentSegment.startTime || transcript.timestamp
          };

          // 检查是否需要创建新段落
          if (shouldCreateNewSegment(updatedSegment, transcript)) {
            return {
              segments: [...prev.segments, {
                ...updatedSegment,
                endTime: transcript.timestamp
              }],
              currentSegment: {
                id: `segment-${Date.now()}`,
                texts: [],  // 新段落从空开始
                wordCount: 0,
                startTime: transcript.timestamp
              },
              interimResult: null
            };
          } else {
            return {
              ...prev,
              currentSegment: updatedSegment,
              interimResult: null
            };
          }
        } else {
          return {
            ...prev,
            interimResult: transcript
          };
        }
      });
    }
  }, [shouldCreateNewSegment]);

  // 更新翻译
  const updateTranscriptTranslations = useCallback((id, translation) => {
    setTranscriptBuffer(prev => {
      // 更新已完成段落的翻译
      const updatedSegments = prev.segments.map(segment => 
        segment.id === id ? { ...segment, translation } : segment
      );

      // 更新当前段落的翻译
      const updatedCurrentSegment = 
        prev.currentSegment.id === id 
          ? { ...prev.currentSegment, translation }
          : prev.currentSegment;

      return {
        ...prev,
        segments: updatedSegments,
        currentSegment: updatedCurrentSegment
      };
    });
  }, []);

  return {
    transcriptBuffer,
    updateLatestTranscript,
    updateTranscriptTranslations
  };
} 