import { useState, useCallback } from 'react';

export function useTranscripts() {
  const [transcripts, setTranscripts] = useState([]);
  const [interimResult, setInterimResult] = useState(null);

  const updateLatestTranscript = useCallback((data) => {
    const transcript = data?.channel?.alternatives?.[0]?.processedTranscript;
    if (!transcript) return;

    if (transcript.isFinal) {
      setTranscripts(prev => [...prev, {
        ...transcript,
        timestamp: Date.now(),
        translation: data.translation
      }]);
      setInterimResult(null);
    } else {
      setInterimResult({
        ...transcript,
        timestamp: Date.now(),
        translation: data.translation
      });
    }
  }, []);

  const updateTranscriptTranslations = useCallback((id, translation) => {
    console.log('Updating translation:', { id, translation });
    
    setTranscripts(prev => prev.map(t => 
      t.id === id ? { ...t, translation } : t
    ));
    
    setInterimResult(prev => 
      prev?.id === id ? { ...prev, translation } : prev
    );
  }, []);

  return {
    transcripts,
    interimResult,
    updateLatestTranscript,
    updateTranscriptTranslations
  };
} 