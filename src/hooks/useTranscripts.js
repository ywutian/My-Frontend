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
    const transcript = transcriptData.transcript.trim();
    const isFinal = data.is_final;

    if (!transcript) return;

    console.log('Processing transcript:', {
      text: transcript,
      isFinal,
      isTranslating,
      hasTranslateFunction: !!translateText
    });

    if (!isFinal) {
      setInterimResult({
        text: transcript,
        timestamp: new Date(),
        translation: null
      });

      if (isTranslating && translateText) {
        translateText(transcript).then(translation => {
          setInterimResult(current => 
            current?.text === transcript ? { ...current, translation } : current
          );
        });
      }
    } else {
      if (!interimResult || interimResult.text !== transcript) {
        setTranscripts(prev => {
          const newTranscript = {
            id: Date.now(),
            text: transcript,
            timestamp: new Date(),
            translation: null
          };

          if (isTranslating && translateText) {
            translateText(transcript).then(translation => {
              setTranscripts(current => 
                current.map(t => 
                  t.id === newTranscript.id ? { ...t, translation } : t
                )
              );
            });
          }

          return [...prev, newTranscript];
        });
      }
      setInterimResult(null);
    }
  }, [interimResult]);

  const updateTranscriptTranslations = useCallback(async (translateText) => {
    // 遍历所有转录记录
    const updatedTranscripts = await Promise.all(
      transcripts.map(async (transcript) => {
        // 如果已经有翻译，就跳过
        if (transcript.translation) return transcript;
        
        // 翻译文本
        const translation = await translateText(transcript.text);
        
        // 返回更新后的转录对象
        return {
          ...transcript,
          translation
        };
      })
    );

    // 更新状态
    setTranscripts(updatedTranscripts);
  }, [transcripts]);

  return {
    transcripts,
    interimResult,
    setTranscripts,
    updateLatestTranscript,
    updateTranscriptTranslations
  };
} 