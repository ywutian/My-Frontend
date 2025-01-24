import { useState, useEffect } from 'react';
import VideoUpload from '../components/video/VideoUpload';
import SubjectSelectionModal from '../components/subject/SubjectSelectionModal';
import ErrorBoundary from '../components/common/ErrorBoundary';
import LiveTranscription from '../components/transcription/LiveTranscription';
import SettingsModal from '../components/settings/SettingsModal';
import NoteCard from '../components/notes/NoteCard';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AudioUploadModal from '../components/audio/AudioUploadModal';
import { transcribeAudio } from '../services/transcriptionService';
import { generateNote, saveNote } from '../services/noteGenerationService';
import { db } from '../db/db';
import { handleDocumentUpload } from '../services/documentService';
import ProgressBar from '../components/common/ProgressBar';
import YouTubeLinkModal from '../components/youtube/YouTubeLinkModal';
import { motion } from 'framer-motion';
import { HiSparkles } from 'react-icons/hi';
import { RiVipCrownFill } from 'react-icons/ri';

function Dashboard() {
  const [selectedInput, setSelectedInput] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showLiveTranscription, setShowLiveTranscription] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const location = useLocation();
  const [showAudioUpload, setShowAudioUpload] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);

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
    if (optionId === 'youtube') {
      setShowYouTubeModal(true);
    } else if (optionId === 'document') {
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

            const { content, title, originalText } = await handleDocumentUpload(file, 'en');
            
            // 保存笔记
            const noteData = {
              title: title,
              content: content,
              originalText: originalText, // 保存原始PDF文本
              noteLanguage: 'en',
              date: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              type: 'pdf', // 标记笔记来源
              fileName: file.name // 保存原始文件名
            };

            // 保存到数据库
            const noteId = await saveNote(noteData);

            // 移除处理提示
            notification.remove();

            // 显示成功提示
            const successNotification = document.createElement('div');
            successNotification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
            successNotification.textContent = 'Note created successfully!';
            document.body.appendChild(successNotification);
            setTimeout(() => successNotification.remove(), 3000);

            // 刷新笔记列表
            const updatedNotes = await db.notes
              .orderBy('date')
              .reverse()
              .limit(10)
              .toArray();
            setRecentNotes(updatedNotes);

            // 导航到新笔记
            navigate(`/notes/${noteId}`);

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
      navigate('/transcription');
    } else if (optionId === 'audio') {
      setShowAudioUpload(true);
    } else {
      setSelectedInput(optionId);
    }
  };

  const handleAudioUpload = async (formData) => {
    try {
      setIsProcessing(true);
      setShowProgress(true);
      
      // Step 1: Transcribe audio (30%)
      setProgress(0);
      setProgressStatus('Transcribing audio...');
      const { transcription, suggestedTitle, confidence, duration } = await transcribeAudio(formData);
      setProgress(30);
      
      // Step 2: Generate note (30% -> 60%)
      setProgressStatus('Generating structured note...');
      const noteLanguage = formData.get('noteLanguage');
      const structuredNote = await generateNote(transcription, noteLanguage);
      setProgress(60);
      
      // Step 3: Save note (60% -> 90%)
      setProgressStatus('Saving note...');
      const userTitle = formData.get('title');
      const finalTitle = userTitle || suggestedTitle;
      
      const noteData = {
        title: finalTitle,
        content: structuredNote,
        transcript: transcription,
        audioLanguage: formData.get('audioLanguage'),
        noteLanguage: noteLanguage,
        confidence: confidence,
        duration: duration,
        date: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      const noteId = await saveNote(noteData);
      setProgress(90);
      
      // Step 4: Finishing up (90% -> 100%)
      setProgressStatus('Finishing up...');
      setShowAudioUpload(false);

      // Refresh recent notes list
      const updatedNotes = await db.notes
        .orderBy('date')
        .reverse()
        .limit(10)
        .toArray();
      setRecentNotes(updatedNotes);
      
      setProgress(100);
      setProgressStatus('Note created successfully!');
      
      // Navigate to the new note after a short delay
      setTimeout(() => {
        setShowProgress(false);
        navigate(`/notes/${noteId}`);
      }, 1000);

    } catch (error) {
      setShowProgress(false);
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
      errorNotification.textContent = error.message;
      document.body.appendChild(errorNotification);
      setTimeout(() => errorNotification.remove(), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleYouTubeSubmit = async (data) => {
    try {
      setIsProcessing(true);
      setShowProgress(true);
      setProgress(0);
      setProgressStatus('Processing YouTube video...');
      
      // TODO: Implement YouTube processing logic here
      
      setShowYouTubeModal(false);
    } catch (error) {
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
      errorNotification.textContent = error.message;
      document.body.appendChild(errorNotification);
      setTimeout(() => errorNotification.remove(), 3000);
    } finally {
      setIsProcessing(false);
      setShowProgress(false);
    }
  };

  const inputOptions = [
    {
      id: 'audio',
      icon: '🎙️',
      title: 'Record or Upload Audio',
      subtitle: 'Upload an audio file',
      bgColor: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600',
      glowColor: 'group-hover:shadow-blue-500/50',
      borderColor: 'border-blue-400/20',
    },
    {
      id: 'lecture',
      icon: '🎤',
      title: 'Record Live Lecture',
      subtitle: 'Real time transcript',
      bgColor: 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600',
      glowColor: 'group-hover:shadow-purple-500/50',
      borderColor: 'border-purple-400/20',
      //isNew: true,
      isPro: true,
    },
    {
      id: 'youtube',
      icon: '▶️',
      title: 'YouTube Video',
      subtitle: 'Paste a YouTube link',
      bgColor: 'bg-gradient-to-br from-red-400 to-red-600',
      borderColor: 'border-red-400',
      shadowColor: 'shadow-red-400/30',
    },
    {
      id: 'document',
      icon: '📄',
      title: 'Document Upload',
      subtitle: 'PDF,PPT,WORD,EXCEL,CSV,TXT',
      bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
      borderColor: 'border-green-400',
      shadowColor: 'shadow-green-400/30',
    },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen p-4 md:p-6 bg-[#fafafa] dark:bg-gray-900">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className={`rounded-3xl shadow-2xl backdrop-blur-xl p-6 md:p-8 
            ${theme === 'light' 
              ? 'bg-white/80' 
              : 'bg-gray-800/80 text-white'}`}
          >
            {!showLiveTranscription ? (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between mb-8"
                >
                  <div className="relative">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1e3d58] to-[#2d5a7c] 
                      dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                      Dashboard
                    </h1>
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.2, 1] 
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="absolute -top-4 -right-4"
                    >
                      <HiSparkles className="text-yellow-400 text-2xl" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Input Selection Grid - Updated sizing and spacing */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {inputOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02, y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleInputSelect(option.id)}
                      className={`relative p-4 rounded-xl border ${option.borderColor} ${option.bgColor}
                        text-white text-left group
                        hover:shadow-lg ${option.glowColor}
                        backdrop-blur-lg h-[120px]
                        transform-gpu will-change-transform`}
                    >
                      {option.isNew && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 
                            text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-lg"
                        >
                          New
                        </motion.span>
                      )}
                      {option.isPro && (
                        <motion.div
                          animate={{ 
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1] 
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                          className="absolute top-2 right-2"
                        >
                          <RiVipCrownFill className="text-yellow-300 text-sm" />
                        </motion.div>
                      )}
                      <div className="text-2xl mb-2 transform group-hover:scale-110 
                        transition-transform duration-300">
                        {option.icon}
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1">{option.title}</h3>
                      <p className="text-xs text-white/80 line-clamp-2">{option.subtitle}</p>
                    </motion.button>
                  ))}
                </div>

                {/* Recent Notes Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-[#1e3d58] to-[#2d5a7c] 
                      dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                      Recent Notes
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentNotes.length > 0 ? (
                      recentNotes.map((note, index) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -5 }}
                          className="backdrop-blur-lg"
                        >
                          <NoteCard
                            note={note}
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
                            onAddToFolder={() => {}}
                            onRemoveFromFolder={() => {}}
                          />
                        </motion.div>
                      ))
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-3 text-center p-12 rounded-2xl 
                          bg-gradient-to-br from-gray-50/50 to-gray-100/50 
                          dark:from-gray-700/30 dark:to-gray-800/30 backdrop-blur-xl"
                      >
                        <motion.div
                          animate={{ 
                            y: [0, -10, 0],
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                          className="text-5xl mb-4"
                        >
                          📝
                        </motion.div>
                        <p className="text-xl font-medium mb-2">No notes yet</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Start your journey by creating your first note
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </>
            ) : (
              <LiveTranscription onClose={() => setShowLiveTranscription(false)} />
            )}
          </div>
        </motion.div>
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

      {showProgress && (
        <ProgressBar 
          progress={progress} 
          status={progressStatus} 
        />
      )}

      <AudioUploadModal
        isOpen={showAudioUpload}
        onClose={() => setShowAudioUpload(false)}
        onUpload={handleAudioUpload}
      />

      <YouTubeLinkModal
        isOpen={showYouTubeModal}
        onClose={() => setShowYouTubeModal(false)}
        onSubmit={handleYouTubeSubmit}
      />
    </ErrorBoundary>
  );
}

export default Dashboard;
