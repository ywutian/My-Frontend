import { useEffect, useCallback, useRef } from 'react';
import { useDeepgramTranscription } from '../../hooks/useDeepgramTranscription';
import { useTranslation } from '../../hooks/useTranslation';
import { useTranscripts } from '../../hooks/useTranscripts';
import { TranscriptionControls } from './TranscriptionControls';
import { TranscriptList } from './TranscriptList';

function LiveTranscription({ onTranscript }) {
  const { isRecording, error, startRecording, stopRecording } = useDeepgramTranscription();
  const { isTranslating, translateText, toggleTranslation } = useTranslation();
  const { 
    transcripts, 
    interimResult, 
    updateLatestTranscript,
    updateTranscriptTranslations 
  } = useTranscripts();

  // 创建一个 ref 来存储最新的处理函数
  const transcriptHandlerRef = useRef(null);

  // 当 isTranslating 改变时更新处理函数
  useEffect(() => {
    transcriptHandlerRef.current = (data) => {
      console.log('Processing transcript with latest translation state:', {
        isTranslating,
        text: data?.channel?.alternatives?.[0]?.processedTranscript?.text
      });

      updateLatestTranscript(data);

      if (isTranslating) {
        const transcript = data?.channel?.alternatives?.[0]?.processedTranscript;
        if (transcript?.text) {
          console.log('Requesting translation for:', transcript.text);
          translateText(transcript.text).then(translation => {
            if (translation) {
              console.log('Received translation:', translation);
              updateTranscriptTranslations(transcript.id, translation);
            }
          });
        }
      }
    };
  }, [isTranslating, translateText, updateLatestTranscript, updateTranscriptTranslations]);

  useEffect(() => {
    return stopRecording;
  }, [stopRecording]);

  // 修改录音切换函数
  const handleRecordingToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      // 使用一个包装函数来调用最新的处理函数
      const handleTranscriptWithLatestState = (data) => {
        if (transcriptHandlerRef.current) {
          transcriptHandlerRef.current(data);
        }
      };

      startRecording(handleTranscriptWithLatestState);
    }
  }, [isRecording, stopRecording, startRecording]);

  const handleTranslationToggle = useCallback(async () => {
    try {
      console.log('Translation toggle clicked. Current state:', isTranslating);
      
      await toggleTranslation(transcripts);
      console.log('Translation state toggled. New state should be:', !isTranslating);

      if (!isTranslating) {
        console.log('Processing existing transcripts for translation');
        const translationPromises = transcripts
          .filter(t => !t.translation && t.text)
          .map(async transcript => {
            const translation = await translateText(transcript.text);
            if (translation) {
              updateTranscriptTranslations(transcript.id, translation);
            }
            return { id: transcript.id, translation };
          });

        await Promise.all(translationPromises);
      }
    } catch (error) {
      console.error('Error during translation toggle:', error);
    }
  }, [isTranslating, transcripts, toggleTranslation, translateText, updateTranscriptTranslations]);

  // 添加调试用的 useEffect
  useEffect(() => {
    console.log('Translation state changed:', isTranslating);
  }, [isTranslating]);

  return (
    <div className="relative min-h-screen p-4">
      <TranscriptionControls
        isRecording={isRecording}
        isTranslating={isTranslating}
        onRecordingToggle={handleRecordingToggle}
        onTranslationToggle={handleTranslationToggle}
      />
      
      <TranscriptList
        transcripts={transcripts}
        interimResult={interimResult}
        isRecording={isRecording}
        isTranslating={isTranslating}
      />

      {error && (
        <div className="fixed bottom-4 left-4 bg-red-100 text-red-600 px-4 py-2 rounded-lg shadow">
          {error}
        </div>
      )}

      {/* Debug info */}
    </div>
  );
}

export default LiveTranscription; 