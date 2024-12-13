import React, { useState, useEffect } from 'react';
import { useDeepgramTranscription } from '../../hooks/useDeepgramTranscription';
import { useTranslation } from '../../hooks/useTranslation';
import { useTranscripts } from '../../hooks/useTranscripts';
import { useLiveTranscription } from '../../hooks/useLiveTranscription';
import { TranscriptList } from './TranscriptList';
import AiAssistant from '../ai/AiAssistant';
import DraggableSidebar from '../layout/DraggableSidebar';
import TranscriptionPanel from './TranscriptionPanel';

function LiveTranscription() {
  const { isRecording, error, startRecording, stopRecording } =
    useDeepgramTranscription();
  const { isTranslating, translateText, toggleTranslation } = useTranslation();
  const {
    transcripts,
    interimResult,
    updateLatestTranscript,
    updateTranscriptTranslations,
  } = useTranscripts();

  const { handleRecordingToggle, handleTranslationToggle } =
    useLiveTranscription({
      isTranslating,
      updateLatestTranscript,
      updateTranscriptTranslations,
      translateText,
      startRecording,
      stopRecording,
      transcripts,
    });

  const [transcriptionContent, setTranscriptionContent] = useState('');
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('en');
  const [translationLanguage, setTranslationLanguage] = useState('zh');
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [sidebarState, setSidebarState] = useState({
    isCollapsed: false,
    size: { width: 400 },
    COLLAPSED_SIZE: 40
  });

  useEffect(() => {
    const fullTranscript = transcripts.map((t) => t.text).join('\n');
    if (interimResult?.text) {
      setTranscriptionContent(`${fullTranscript}\n${interimResult.text}`);
    } else {
      setTranscriptionContent(fullTranscript);
    }
  }, [transcripts, interimResult]);

  return (
    <div className="h-screen overflow-hidden">
      <div 
        className="h-full p-4"
        style={{ 
          marginRight: sidebarState.isCollapsed ? sidebarState.COLLAPSED_SIZE : sidebarState.size.width,
          transition: 'margin-right 0.2s ease-out'
        }}
      >
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
      </div>

      <DraggableSidebar
        title="Controls"
        defaultWidth={300}
        defaultTab="Transcription"
        onStateChange={setSidebarState}
      >
        <div role="tabpanel" label="Transcription">
          <TranscriptionPanel
            isRecording={isRecording}
            isTranslating={isTranslating}
            transcriptionLanguage={transcriptionLanguage}
            translationLanguage={translationLanguage}
            onTranscriptionLanguageChange={setTranscriptionLanguage}
            onTranslationLanguageChange={setTranslationLanguage}
            onRecordingToggle={handleRecordingToggle}
            onTranslationToggle={handleTranslationToggle}
          />
        </div>
        <div role="tabpanel" label="AI Assistant">
          <AiAssistant noteContent={transcriptionContent} />
        </div>
      </DraggableSidebar>
    </div>
  );
}

export default LiveTranscription;
