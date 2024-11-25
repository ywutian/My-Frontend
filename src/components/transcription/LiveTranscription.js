import { useEffect, useCallback } from 'react';
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

  const handleTranscript = useCallback((data) => {
    updateLatestTranscript(data, translateText, isTranslating);
  }, [updateLatestTranscript, translateText, isTranslating]);

  useEffect(() => {
    return stopRecording;
  }, [stopRecording]);

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(handleTranscript);
    }
  };

  const handleTranslationToggle = useCallback(async () => {
    const willEnableTranslation = !isTranslating;
    
    toggleTranslation(transcripts);
  }, [isTranslating, transcripts, toggleTranslation]);

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