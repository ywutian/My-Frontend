import { useState, useCallback, useMemo, useEffect } from 'react';
import { generateNote } from '../services/noteGenerationService';

export function useTranscripts() {
  // 初始化状态时提供完整的默认值
  const [transcriptBuffer, setTranscriptBuffer] = useState({
    segments: [],           // 已完成的段落
    currentSegment: {       // 当前正在处理的段落
      id: `segment-${Date.now()}`,
      texts: [],
      wordCount: 0,
      startTime: null
    },
    interimResult: null,    // 临时结果
    notes: []              // 笔记数组
  });

  // 定义 generateSegmentNote 函数
  const generateSegmentNote = useCallback(async (segment) => {
    try {
      console.log('Starting note generation for segment:', {
        segmentId: segment.id,
        wordCount: segment.wordCount,
        textsCount: segment.texts.length,
        startTime: new Date(segment.startTime).toLocaleTimeString(),
        endTime: segment.endTime ? new Date(segment.endTime).toLocaleTimeString() : 'ongoing'
      });

      const segmentText = segment.texts.map(t => t.text).join(' ');
      console.log('Segment text to process:', segmentText);

      const note = await generateNote(segmentText, 'en');
      
      if (note) {
        console.log('Note generated successfully:', {
          noteLength: note.length,
          firstLine: note.split('\n')[0],
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        console.warn('Note generation returned null');
      }

      return note;
    } catch (error) {
      console.error('Error generating note:', {
        error: error.message,
        segmentId: segment.id,
        timestamp: new Date().toLocaleTimeString()
      });
      return null;
    }
  }, []);

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
        if (!prev) return transcriptBuffer; // 添加空值检查

        if (transcript.isFinal) {
          const updatedSegment = {
            ...prev.currentSegment,
            texts: [...prev.currentSegment.texts, transcript],
            wordCount: prev.currentSegment.wordCount + transcript.words.length,
            startTime: prev.currentSegment.startTime || transcript.timestamp
          };

          if (shouldCreateNewSegment(updatedSegment, transcript)) {
            // 立即生成笔记并更新状态
            (async () => {
              const note = await generateSegmentNote(updatedSegment);
              if (note) {
                const newNote = {
                  id: `note-${Date.now()}`,
                  content: note,
                  segmentId: updatedSegment.id,
                  timestamp: Date.now()
                };
                
                console.log('Adding new note to buffer:', newNote);
                
                setTranscriptBuffer(current => ({
                  ...current,
                  notes: [...(current?.notes || []), newNote]
                }));
              }
            })();

            return {
              ...prev,
              segments: [...prev.segments, {
                ...updatedSegment,
                endTime: transcript.timestamp
              }],
              currentSegment: {
                id: `segment-${Date.now()}`,
                texts: [],
                wordCount: 0,
                startTime: transcript.timestamp
              },
              interimResult: null
            };
          }

          return {
            ...prev,
            currentSegment: updatedSegment,
            interimResult: null
          };
        }

        return {
          ...prev,
          interimResult: transcript
        };
      });
    }
  }, [shouldCreateNewSegment]);

  // 添加调试日志
  useEffect(() => {
    console.log('TranscriptBuffer state:', transcriptBuffer);
  }, [transcriptBuffer]);

  return {
    transcriptBuffer,
    updateLatestTranscript,
  };
} 