import React, { useState, useEffect, useCallback } from 'react';
import { useDeepgramTranscription } from '../../hooks/useDeepgramTranscription';
import { useTranslation } from '../../hooks/useTranslation';
import { useTranscripts } from '../../hooks/useTranscripts';
import { useLiveTranscription } from '../../hooks/useLiveTranscription';
import { TranscriptList } from './TranscriptList';
import AiAssistant from '../ai/AiAssistant';
import DraggableSidebar from '../layout/DraggableSidebar';
import TranscriptionPanel from './TranscriptionPanel';
import { saveNote } from '../../db/db';
import CreateNoteModal from '../notes/CreateNoteModal';
import { useNavigate } from 'react-router-dom';
import { generateNote } from '../../services/noteGenerationService';

function LiveTranscription() {
  const navigate = useNavigate();
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
      isRecording,
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
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    const fullTranscript = transcripts.map((t) => t.text).join('\n');
    if (interimResult?.text) {
      setTranscriptionContent(`${fullTranscript}\n${interimResult.text}`);
    } else {
      setTranscriptionContent(fullTranscript);
    }
  }, [transcripts, interimResult]);

  const handleGenerateNote = useCallback(() => {
    const noteText = transcripts
      .map(t => t.text)
      .join('\n');
    
    setNoteContent(noteText);
    setShowCreateNote(true);
  }, [transcripts]);

  const handleCreateNote = async (formData) => {
    try {
      const title = formData.get('title');
      const noteLanguage = formData.get('noteLanguage');
      const folderId = formData.get('folderId');
      const folderName = formData.get('folderName');

      const transcript = transcripts.map(t => t.text).join('\n');
      const aiGeneratedContent = await generateNote(transcript, noteLanguage);

      const noteData = {
        title: title || new Date().toLocaleDateString(),
        content: aiGeneratedContent,
        audioLanguage: transcriptionLanguage,
        noteLanguage,
        transcript: transcripts,
        date: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        folderId: folderId || null,
        folderName: folderName || null,
      };

      const noteId = await saveNote(noteData);
      setShowCreateNote(false);

      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
      notification.textContent = 'Note created successfully!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
        navigate(`/notes/${noteId}`);
      }, 1000);

    } catch (error) {
      console.error('Error creating note:', error);
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
      errorNotification.textContent = `Failed to create note: ${error.message}`;
      document.body.appendChild(errorNotification);
      setTimeout(() => errorNotification.remove(), 3000);
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <div 
        className="h-full p-4"
        style={{ 
          marginRight: sidebarState.isCollapsed ? `${sidebarState.COLLAPSED_SIZE}px` : `${sidebarState.size.width}px`
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
        minWidth={280}
        initialPosition="right"
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
            onGenerateNote={handleGenerateNote}
            hasTranscripts={transcripts.length > 0}
          />
        </div>
        <div role="tabpanel" label="AI Assistant">
          <AiAssistant noteContent={transcriptionContent} />
        </div>
      </DraggableSidebar>

      <CreateNoteModal
        isOpen={showCreateNote}
        onClose={() => setShowCreateNote(false)}
        onSubmit={handleCreateNote}
        initialContent={noteContent}
      />
    </div>
  );
}

export default LiveTranscription;
