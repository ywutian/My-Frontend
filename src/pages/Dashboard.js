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
import { handleDocumentUpload, validateFile } from '../services/documentService';
import ProgressBar from '../components/common/ProgressBar';
import YouTubeLinkModal from '../components/youtube/YouTubeLinkModal';
import { motion } from 'framer-motion';
import { HiSparkles } from 'react-icons/hi';
import { RiVipCrownFill } from 'react-icons/ri';
import { FiUpload, FiFile, FiX, FiLoader, FiGlobe } from 'react-icons/fi';

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
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentLanguage, setDocumentLanguage] = useState('en');
  const [noteLanguage, setNoteLanguage] = useState('en');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' }
  ];

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
      setShowDocumentModal(true);
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

  const handleFileUpload = async (file) => {
    try {
      // 验证文件
      validateFile(file);

      setIsProcessing(true);
      setShowProgress(true);
      setProgress(0);
      setProgressStatus('Processing document...');
      
      const result = await handleDocumentUpload(file, documentLanguage, noteLanguage);
      
      const noteData = {
        title: result.title,
        content: result.content,
        originalText: result.originalText,
        metadata: result.metadata,
        date: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        type: 'document'
      };

      // 保存笔记
      const noteId = await saveNote(noteData);
      
      // 刷新笔记列表
      const updatedNotes = await db.notes
        .orderBy('date')
        .reverse()
        .limit(10)
        .toArray();
      setRecentNotes(updatedNotes);
      
      setShowDocumentModal(false);
      navigate(`/notes/${noteId}`);
    } catch (error) {
      console.error('Error uploading document:', error);
      // 显示错误提示
      const errorMessage = error.message || 'Failed to process document';
      // TODO: 使用统一的错误提示组件
    } finally {
      setIsProcessing(false);
      setShowProgress(false);
    }
  };

  return (
    <ErrorBoundary>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-custom"
      >
        <div className="max-w-7xl mx-auto py-6 md:py-8 px-4 sm:px-6 lg:px-8">
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

              {/* Input Selection Grid */}
              <div className="mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              </div>

              {/* Recent Notes Section */}
              <div className="mt-16">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 
                    dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Recent Notes
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent 
                    dark:from-gray-700" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recentNotes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group/card relative isolate"
                    >
                      <div className="relative p-6 rounded-2xl bg-white/90 dark:bg-gray-800/90 
                        backdrop-blur-xl border border-gray-100/20 dark:border-gray-700/20
                        group-hover/card:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]
                        dark:group-hover/card:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]
                        transition-all duration-300 group-hover/card:-translate-y-1"
                      >
                        {/* 卡片装饰效果 - 仅在真正hover到卡片时触发 */}
                        <div className="absolute -z-10 inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 
                          dark:from-blue-900/20 dark:to-purple-900/20 opacity-0 group-hover/card:opacity-100 
                          transition-opacity rounded-2xl pointer-events-none" />
                        
                        {/* 闪光效果 */}
                        <div className="absolute -z-10 inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none">
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent
                            -skew-x-12 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000" />
                        </div>

                        {/* 卡片内容 */}
                        <div className="space-y-4">
                          {/* 标题区域 */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 
                                line-clamp-2 group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400
                                transition-colors">
                                {note.title}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(note.date).toLocaleDateString()}
                              </p>
                            </div>
                            
                            {/* 类型标签 */}
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {note.type || 'Note'}
                            </span>
                          </div>

                          {/* 预览内容 */}
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                            {note.content?.substring(0, 150)}...
                          </p>

                          {/* 底部操作区 */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                            {/* 左侧元数据 */}
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {note.duration ? `${Math.round(note.duration / 60)}min` : 'N/A'}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                </svg>
                                {note.noteLanguage || 'EN'}
                              </span>
                            </div>

                            {/* 右侧操作按钮 - 使用新的group命名空间 */}
                            <div className="flex items-center space-x-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                              <button 
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
                                  text-gray-500 dark:text-gray-400 transition-colors relative z-10 group/button"
                                onClick={(e) => {
                                  e.stopPropagation(); // 阻止事件冒泡
                                  // 编辑操作
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
                                  text-gray-500 dark:text-gray-400 transition-colors relative z-10 group/button"
                                onClick={(e) => {
                                  e.stopPropagation(); // 阻止事件冒泡
                                  // 删除操作
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 点击整体区域跳转 - 调整z-index确保正确的点击顺序 */}
                        <div 
                          className="absolute inset-0 cursor-pointer z-0" 
                          onClick={() => navigate(`/notes/${note.id}`)}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {recentNotes.length === 0 && (
                <motion.div 
                  className="col-span-3 p-16 rounded-3xl bg-gradient-to-br from-gray-50/90 to-white/90 
                    dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-xl border border-gray-100/50
                    dark:border-gray-700/50 text-center"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -15, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="inline-block text-7xl mb-6"
                  >
                    ✨
                  </motion.div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 
                    dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent mb-3">
                    Start Your Journey
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Create your first note and begin organizing your thoughts in a beautiful way
                  </p>
                </motion.div>
              )}
            </>
          ) : (
            <LiveTranscription onClose={() => setShowLiveTranscription(false)} />
          )}
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

        {/* Document Upload Modal */}
        {showDocumentModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md
                         shadow-[0_8px_32px_rgb(0,0,0,0.12)] border border-white/20
                         transform transition-all duration-300">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/10 
                               flex items-center justify-center ring-1 ring-green-500/20">
                    <FiFile className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold bg-gradient-to-br from-green-600 to-green-500 
                                bg-clip-text text-transparent">
                      Upload Document
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      PDF, PPT, WORD, EXCEL, CSV, TXT
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isProcessing && setShowDocumentModal(false)}
                  className="p-2 hover:bg-green-50 rounded-xl transition-colors duration-200 
                           group disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing}
                >
                  <FiX className="w-5 h-5 text-gray-400 group-hover:text-green-500 
                               transition-colors duration-200" />
                </button>
              </div>

              {/* Language Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FiGlobe className="w-4 h-4 mr-1.5 text-green-500" />
                    Document Language
                  </label>
                  <select
                    value={documentLanguage}
                    onChange={(e) => setDocumentLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-white/60 border border-gray-200 rounded-xl
                            focus:ring-2 focus:ring-green-500 focus:border-transparent
                            text-sm transition-all duration-200"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FiGlobe className="w-4 h-4 mr-1.5 text-green-500" />
                    Note Language
                  </label>
                  <select
                    value={noteLanguage}
                    onChange={(e) => setNoteLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-white/60 border border-gray-200 rounded-xl
                            focus:ring-2 focus:ring-green-500 focus:border-transparent
                            text-sm transition-all duration-200"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8
                           hover:border-green-500/50 transition-colors duration-200
                           bg-gray-50/50 cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  id="document-upload"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="document-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <FiLoader className="w-12 h-12 text-green-500 animate-spin mb-4" />
                      <span className="text-sm font-medium text-gray-700">Processing document...</span>
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-12 h-12 text-green-500 mb-4 
                                       group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-sm font-medium text-gray-700">
                        Drag & drop or click to upload document
                      </span>
                      <span className="text-xs text-gray-500 mt-2">
                        Supports multiple formats
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </ErrorBoundary>
  );
}

export default Dashboard;
