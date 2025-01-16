import { useState, useCallback, useEffect } from 'react';
import { generateNote } from '../services/noteGenerationService';

export function useTranscripts() {
  const [transcriptBuffer, setTranscriptBuffer] = useState({
    segments: [],           // 已完成的段落
    currentSegment: {       // 当前正在处理的段落
      id: `segment-${Date.now()}`,
      texts: [],
      wordCount: 0,
      startTime: null
    },
    notes: []              // 笔记数组
  });

  // 判断是否应该创建新段落
  const shouldCreateNewSegment = useCallback((segment, newTranscript) => {
    const MIN_WORDS = 20;
    const hasMinWords = segment.wordCount >= MIN_WORDS;
    const lastText = segment.texts[segment.texts.length - 1]?.text || '';
    const endsWithPunctuation = /[.!?。！？]$/.test(lastText.trim());
    const newText = newTranscript.text || '';
    const startsWithCapital = /^[A-Z]/.test(newText.trim());

    return hasMinWords && endsWithPunctuation && startsWithCapital;
  }, []);

  const updateLatestTranscript = useCallback((data) => {
    const transcriptData = data?.channel?.alternatives?.[0];
    if (!transcriptData?.transcript) return;

    const transcript = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: transcriptData.transcript,
      words: transcriptData.words || [],
      timestamp: Date.now()
    };

    setTranscriptBuffer(prev => {
     
      const lastText = prev.currentSegment.texts.length > 0
      ? prev.currentSegment.texts[prev.currentSegment.texts.length - 1].text
      : prev.segments.length > 0
        ? prev.segments[prev.segments.length - 1].texts.slice(-1)[0]?.text
        : '';
        
      let newText = transcript.text;
      if (lastText) {
        if (newText.includes(lastText)) {
          // 如果新文本包含旧文本，只保留新增部分
          newText = newText.substring(lastText.length).trim();
          if (!newText) return prev; // 如果没有新内容，直接返回原状态
        } else if (lastText.includes(newText)) {
          // 如果新文本完全包含在旧文本中，忽略这次更新
          return prev;
        }
      }

      transcript.text=newText;

      const updatedSegment = {
        ...prev.currentSegment,
        texts: [...prev.currentSegment.texts, transcript],
        wordCount: prev.currentSegment.wordCount + transcript.words.length,
        startTime: prev.currentSegment.startTime || transcript.timestamp
      };

      if (shouldCreateNewSegment(updatedSegment, transcript)) {
        const finalizedSegment = {
          ...updatedSegment,
          endTime: transcript.timestamp
        };

        // 异步生成笔记
        // generateSegmentNote(finalizedSegment).then(note => {
        //   if (note) {
        //     setTranscriptBuffer(current => ({
        //       ...current,
        //       notes: [...current.notes, {
        //         id: `note-${Date.now()}`,
        //         content: note,
        //         segmentId: finalizedSegment.id,
        //         timestamp: Date.now()
        //       }]
        //     }));
        //   }
        // });

        return {
          ...prev,
          segments: [...prev.segments, finalizedSegment],
          currentSegment: {
            id: `segment-${Date.now()}`,
            texts: [],
            wordCount: 0,
            startTime: transcript.timestamp
          }
        };
      }

      return {
        ...prev,
        currentSegment: updatedSegment
      };
    });
  }, [shouldCreateNewSegment]);

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

  useEffect(() => {
    console.log('TranscriptBuffer state:', transcriptBuffer);
  }, [transcriptBuffer]);

  return {
    transcriptBuffer,
    updateLatestTranscript,
  };
} 