import { useRef, useEffect, useCallback } from 'react';

export const useLiveTranscription = ({
  isTranslating,
  updateLatestTranscript,
  updateTranscriptTranslations,
  translateText,
  startRecording,
  stopRecording,
  isRecording,
  transcripts,
}) => {
  const transcriptHandlerRef = useRef(null);

  // 更新最新的处理函数，当 isTranslating 状态变化时
  useEffect(() => {
    transcriptHandlerRef.current = (data) => {
      console.log('Processing transcript with the latest translation state:', {
        isTranslating,
        text: data?.channel?.alternatives?.[0]?.processedTranscript?.text,
      });

      // 更新最新的转录
      updateLatestTranscript(data);

      // 如果启用了翻译
      if (isTranslating) {
        const transcript =
          data?.channel?.alternatives?.[0]?.processedTranscript;
        if (transcript?.text) {
          console.log('Requesting translation for:', transcript.text);
          translateText(transcript.text).then((translation) => {
            if (translation) {
              console.log('Received translation:', translation);
              updateTranscriptTranslations(transcript.id, translation);
            }
          });
        }
      }
    };
  }, [
    isTranslating,
    translateText,
    updateLatestTranscript,
    updateTranscriptTranslations,
  ]);

  // 录音切换逻辑
  const handleRecordingToggle = useCallback(() => {
    if (!startRecording || !stopRecording) return;

    if (isRecording) {
      console.log('Currently recording, stopping...');
      stopRecording();
    } else {
      console.log('Not recording, starting...');
      const handleTranscriptWithLatestState = (data) => {
        if (transcriptHandlerRef.current) {
          transcriptHandlerRef.current(data);
        }
      };
      startRecording(handleTranscriptWithLatestState);
    }
  }, [isRecording, startRecording, stopRecording]);

  // 翻译切换逻辑
  const handleTranslationToggle = useCallback(async () => {
    console.log('Translation toggle clicked. Current state:', isTranslating);

    if (!isTranslating) {
      console.log('Processing existing transcripts for translation');
      const translationPromises = transcripts
        .filter((t) => !t.translation && t.text)
        .map(async (transcript) => {
          const translation = await translateText(transcript.text);
          if (translation) {
            updateTranscriptTranslations(transcript.id, translation);
          }
          return { id: transcript.id, translation };
        });

      await Promise.all(translationPromises);
    }
  }, [isTranslating, transcripts, translateText, updateTranscriptTranslations]);

  // 停止录音时清理资源
  useEffect(() => {
    return () => {
      if (stopRecording) stopRecording();
    };
  }, [stopRecording]);

  return {
    handleRecordingToggle,
    handleTranslationToggle,
  };
};

export default useLiveTranscription;
