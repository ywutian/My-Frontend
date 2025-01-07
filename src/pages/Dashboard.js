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
import { handleDocumentUpload } from '../services/documentService';

function Dashboard() {
  const [selectedInput, setSelectedInput] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showLiveTranscription, setShowLiveTranscription] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleInputSelect = async (optionId) => {
    if (optionId === 'document') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            setIsProcessing(true);
            
            // 显示处理提示
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg';
            notification.textContent = 'Processing document...';
            document.body.appendChild(notification);

            const { noteContent } = await handleDocumentUpload(file, 'en');
            
            // 移除处理提示
            notification.remove();
            
            // 打开笔记创建模态框
            setNoteContent(noteContent);
            setShowCreateNote(true);
          } catch (error) {
            // 显示错误提示
            const errorNotification = document.createElement('div');
            errorNotification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
            errorNotification.textContent = error.message;
            document.body.appendChild(errorNotification);
            setTimeout(() => errorNotification.remove(), 3000);
          } finally {
            setIsProcessing(false);
          }
        }
      };
      
      input.click();
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
      const title = formData.get('title');
      const noteLanguage = formData.get('noteLanguage');
      const content = formData.get('content');
      const folderId = formData.get('folderId');
      const folderName = formData.get('folderName');

      const noteData = {
        title: title || new Date().toLocaleDateString(),
        content: content,
        noteLanguage,
        date: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        folderId: folderId || null,
        folderName: folderName || null,
      };

      // 保存笔记
      const noteId = await saveNote(noteData);
      
      // 刷新最近笔记列表
      const notes = await db.notes
        .orderBy('date')
        .reverse()
        .limit(10)
        .toArray();
      setRecentNotes(notes);

      // 关闭模态框
      setShowCreateNote(false);
      
      // 跳转到新创建的笔记页面
      navigate(`/notes/${noteId}`);

    } catch (error) {
      console.error('Error creating note:', error);
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
      errorNotification.textContent = `Failed to create note: ${error.message}`;
      document.body.appendChild(errorNotification);
      setTimeout(() => errorNotification.remove(), 3000);
    } finally {
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
    // {
    //   id: 'youtube',
    //   icon: '▶️',
    //   title: 'YouTube Video',
    //   subtitle: 'Paste a YouTube link',
    //   bgColor: 'bg-red-500',
    // },
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
                        onRename={async (newTitle) => {
                          try {
                            await db.notes.update(note.id, {
                              title: newTitle,
                              lastModified: new Date().toISOString(),
                              syncStatus: 'pending'
                            });
                            // Refresh the notes list
                            const updatedNotes = await db.notes
                              .orderBy('date')
                              .reverse()
                              .limit(10)
                              .toArray();
                            setRecentNotes(updatedNotes);
                          } catch (error) {
                            console.error('Error renaming note:', error);
                            alert('Failed to rename note');
                          }
                        }}
                        onDelete={async () => {
                          if (window.confirm('Are you sure you want to delete this note?')) {
                            try {
                              await db.notes.delete(note.id);
                              setRecentNotes(recentNotes.filter(n => n.id !== note.id));
                            } catch (error) {
                              console.error('Error deleting note:', error);
                              alert('Failed to delete note');
                            }
                          }
                        }}
                        onAddToFolder={() => {}} // Add folder functionality if needed
                        onRemoveFromFolder={() => {}} // Add remove from folder functionality if needed
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
        initialContent={noteContent}
      />
    </ErrorBoundary>
  );
}

export default Dashboard;
