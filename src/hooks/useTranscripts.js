import { useState, useCallback } from 'react';

export function useTranscripts() {
  const [transcripts, setTranscripts] = useState([]);
  const [interimResult, setInterimResult] = useState(null);

  const updateLatestTranscript = useCallback((data) => {
    // 从 Deepgram 数据中提取转录信息
    const transcriptData = data?.channel?.alternatives?.[0];
    if (!transcriptData) {
      console.log('No transcript data received');
      return;
    }

    // 构建转录对象
    const transcript = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: transcriptData.transcript || '',
      confidence: transcriptData.confidence || 0,
      words: transcriptData.words?.length || 0,
      isFinal: data.is_final,
      timestamp: Date.now()
    };

    console.group('Transcript Processing');
    console.log('Processing transcript:', {
      type: transcript.isFinal ? 'final' : 'interim',
      text: transcript.text,
      confidence: transcript.confidence,
      words: transcript.words,
      currentTranscripts: transcripts.length
    });

    // 只处理有文本内容的转录
    if (transcript.text.trim()) {
      if (transcript.isFinal) {
        setTranscripts(prev => [...prev, transcript]);
        setInterimResult(null);
        console.log('Final transcript added to history');
      } else {
        setInterimResult(transcript);
        console.log('Interim result updated');
      }
    }
    console.groupEnd();
  }, [transcripts.length]);

  const updateTranscriptTranslations = useCallback((id, translation) => {
    console.group('Translation Update');
    console.log('Updating translation:', { id, translation });
    
    setTranscripts(prev => prev.map(t => 
      t.id === id ? { ...t, translation } : t
    ));
    
    setInterimResult(prev => 
      prev?.id === id ? { ...prev, translation } : prev
    );
    
    console.log('Translation update completed');
    console.groupEnd();
  }, []);

  return {
    transcripts,
    interimResult,
    updateLatestTranscript,
    updateTranscriptTranslations
  };
} 