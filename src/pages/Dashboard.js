import { useState, useEffect } from 'react';
import VideoUpload from '../components/video/VideoUpload';
import SubjectSelectionModal from '../components/subject/SubjectSelectionModal';
import ErrorBoundary from '../components/common/ErrorBoundary';
import LiveTranscription from '../components/transcription/LiveTranscription';
import SettingsModal from '../components/settings/SettingsModal';
import NoteCard from '../components/notes/NoteCard';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import CreateNoteModal from '../components/notes/CreateNoteModal';
import { transcribeAudio } from '../services/transcriptionService';
import { generateNote, saveNote } from '../services/noteGenerationService';
import { db } from '../db/db';

function Dashboard() {
  const [selectedInput, setSelectedInput] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showLiveTranscription, setShowLiveTranscription] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const loadRecentNotes = async () => {
      try {
        const notes = await db.notes
          .orderBy('date')
          .reverse()
          .limit(10)
          .toArray();

        setRecentNotes(notes);
      } catch (error) {
        console.error('Error loading recent notes:', error);
      }
    };

    loadRecentNotes();
  }, []);

  useEffect(() => {
    setShowLiveTranscription(false);
  }, [location]);

  const handleSubjectSelect = (subjectId) => {
    try {
      console.log('Starting subject selection for:', subjectId);
      setShowSubjectModal(false);
      setSelectedInput('audio');
    } catch (error) {
      console.error('Error in handleSubjectSelect:', error);
    }
  };

  const handleInputSelect = (optionId) => {
    console.log('Input selected:', optionId);
    if (optionId === 'audio') {
      setShowCreateNote(true);
    } else if (optionId === 'lecture') {
      setShowLiveTranscription(true);
      setSelectedInput('lecture');
    } else {
      setSelectedInput(optionId);
    }
  };

  const handleCreateNote = async (formData) => {
    try {
      setIsLoading(true);
      setError(null);

      const audioFile = formData.get('audio');
      const audioLanguage = formData.get('audioLanguage');
      const noteLanguage = formData.get('noteLanguage');
      const title = formData.get('title');
      const subject = formData.get('subject');

      console.log('Creating note with data:', {
        title,
        subject,
        audioLanguage,
        noteLanguage,
      });

      // 1. 转录音频
      const transcript = await transcribeAudio(audioFile, audioLanguage);

      // 2. 生成笔记
      const noteContent = await generateNote(transcript, noteLanguage);

      // 3. 保存笔记
      const noteData = {
        title: title || new Date().toLocaleDateString(),
        subject: subject || 'General',
        content: noteContent,
        audioLanguage,
        noteLanguage,
        transcript,
      };

      const noteId = await saveNote(noteData);
      console.log('Note created successfully:', noteId);

      // 刷新最近笔记列表
      const notes = await db.notes
        .orderBy('date')
        .reverse()
        .limit(10)
        .toArray();
      setRecentNotes(notes);

      setShowCreateNote(false);
      setIsLoading(false);

      return noteId;
    } catch (error) {
      console.error('Error creating note:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const inputOptions = [
    {
      id: 'audio',
      icon: '🎙️',
      title: 'Record or Upload Audio',
      subtitle: 'Upload an audio file',
      bgColor: 'bg-blue-500',
    },
    {
      id: 'lecture',
      icon: '🎤',
      title: 'Record Live Lecture',
      subtitle: 'Real time transcript',
      bgColor: 'bg-purple-500',
      isNew: true,
    },
    {
      id: 'youtube',
      icon: '▶️',
      title: 'YouTube Video',
      subtitle: 'Paste a YouTube link',
      bgColor: 'bg-red-500',
    },
    {
      id: 'document',
      icon: '📄',
      title: 'Document Upload',
      subtitle: 'PDF,PPT,WORD,EXCEL,CSV,TXT',
      bgColor: 'bg-green-500',
    },
  ];

  return (
    <ErrorBoundary>
      <div className="p-6">
        <div
          className={`rounded-lg shadow-xl p-6 ${
            theme === 'light' ? 'bg-white' : 'bg-gray-800 text-white'
          }`}
        >
          {!showLiveTranscription ? (
            <>
              <h1 className="text-2xl font-bold mb-6 text-[#1e3d58]">
                Dashboard
              </h1>

              {/* Input Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {inputOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleInputSelect(option.id)}
                    className={`relative p-6 rounded-lg ${option.bgColor} text-white hover:shadow-lg transition-all duration-200 text-left`}
                  >
                    {option.isNew && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <h3 className="font-semibold mb-1">{option.title}</h3>
                    <p className="text-sm text-white/80">{option.subtitle}</p>
                  </button>
                ))}
              </div>

              {/* Recent Notes Section */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-[#1e3d58]">
                  Recent Notes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentNotes.length > 0 ? (
                    recentNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={{
                          id: note.id,
                          title: note.title,
                          date: new Date(note.date).toLocaleDateString(),
                          preview: note.content.substring(0, 100) + '...',
                          subject: note.subject,
                        }}
                        onClick={() => navigate(`/notes/${note.id}`)}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 text-center text-gray-500 py-8">
                      No notes yet. Create your first note by clicking on
                      "Record or Upload Audio"!
                    </div>
                  )}
                </div>
              </div>

              {/* 音频上传部分 */}
              {selectedInput === 'audio' && (
                <div className="mt-8">
                  <VideoUpload onUploadSuccess={() => {}} />
                </div>
              )}
            </>
          ) : (
            <LiveTranscription
              onClose={() => setShowLiveTranscription(false)}
            />
          )}
        </div>
      </div>

      <SubjectSelectionModal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        onSelect={handleSubjectSelect}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <CreateNoteModal
        isOpen={showCreateNote}
        onClose={() => setShowCreateNote(false)}
        onSubmit={handleCreateNote}
      />
    </ErrorBoundary>
  );
}

export default Dashboard;
