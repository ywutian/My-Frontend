import { useState, useCallback } from 'react';

export function useTranscripts() {
  const [transcripts, setTranscripts] = useState([]);
  const [interimResult, setInterimResult] = useState(null);

  const updateLatestTranscript = useCallback((data, translateText, isTranslating) => {
    if (!data?.channel?.alternatives?.[0]?.transcript) {
      console.warn('Invalid data format received:', data);
      return;
    }

    const transcriptData = data.channel.alternatives[0];
    const transcript = transcriptData.transcript;
    const isFinal = data.is_final;
    const speechFinal = data.speech_final;

    if (!transcript.trim()) return;

    console.log('Processing transcript:', {
      text: transcript,
      isFinal,
      isTranslating,
      hasTranslateFunction: !!translateText
    });

    if (!isFinal) {
      const interimData = {
        text: transcript,
        timestamp: new Date(),
        translation: null
      };

      setInterimResult(interimData);

      if (isTranslating && translateText) {
        console.log('Translating interim result:', transcript);
        translateText(transcript)
          .then(translation => {
            console.log('Interim translation received:', translation);
            setInterimResult(current => 
              current?.text === transcript ? { ...current, translation } : current
            );
          })
          .catch(error => {
            console.error('Interim translation error:', error);
          });
      }
      return;
    }

    setTranscripts(prev => {
      const newTranscript = {
        id: Date.now(),
        text: transcript,
        timestamp: new Date(),
        translation: null,
        isFinal,
        speechFinal
      };

      if (isTranslating && translateText) {
        console.log('Translating final result:', transcript);
        translateText(transcript)
          .then(translation => {
            console.log('Final translation received:', translation);
            setTranscripts(current => 
              current.map(t => 
                t.id === newTranscript.id ? { ...t, translation } : t
              )
            );
          })
          .catch(error => {
            console.error('Final translation error:', error);
          });
      }

      setInterimResult(null);
      return [...prev, newTranscript];
    });
  }, []);

  const updateTranscriptTranslations = useCallback(async (translateText) => {
    if (!translateText || transcripts.length === 0) return;

    console.log('Translating existing transcripts...');
    
    const updatedTranscripts = [...transcripts];
    
    for (let i = 0; i < updatedTranscripts.length; i++) {
      const transcript = updatedTranscripts[i];
      if (!transcript.translation && transcript.text) {
        try {
          const translation = await translateText(transcript.text);
          setTranscripts(current => 
            current.map((t, index) => 
              index === i ? { ...t, translation } : t
            )
          );
        } catch (error) {
          console.error('Translation error for text:', transcript.text, error);
        }
      }
    }
  }, [transcripts]);

  return {
    transcripts,
    interimResult,
    setTranscripts,
    updateLatestTranscript,
    updateTranscriptTranslations
  };
} 