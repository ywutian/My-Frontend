import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiEdit2,
  FiShare2,
  FiPlus,
  FiDownload,
  FiArrowLeft,
  FiSend,
  FiChevronRight,
  FiChevronLeft,
  FiSave,
  FiCheck,
} from 'react-icons/fi';
import QuizPanel from '../components/quiz/QuizPanel';
import FlashcardPanel from '../components/flashcards/FlashcardPanel';
import { db } from '../db/db';
import React from 'react';
import MarkdownViewer from '../components/MarkdownViewer';
import DraggableSidebar from '../components/layout/DraggableSidebar';
import AiAssistant from '../components/ai/AiAssistant';
import MindmapPanel from '../components/mindmap/MindmapPanel';
import { generateNote } from '../services/noteGenerationService';
import html2pdf from 'html2pdf.js';
import MarkdownIt from 'markdown-it';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import rehypeSanitize from "rehype-sanitize"; // 用于安全处理
import NoteContent from '../components/notes/NoteContent';

function getYouTubeVideoId(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    return urlObj.searchParams.get('v');
  } catch (error) {
    console.error('Invalid YouTube URL:', error);
    return null;
  }
}

function NoteDetail() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [activeTab, setActiveTab] = useState('Note');
  const [isEditing, setIsEditing] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content:
        'Hi! I can help you analyze this note. What would you like to know?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editContent, setEditContent] = useState('');
  const [shouldRender, setShouldRender] = useState(true);
  const [sidebarState, setSidebarState] = useState({
    isCollapsed: false,
    size: { width: 300 },
    COLLAPSED_SIZE: 40
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableNotes, setAvailableNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isCombining, setIsCombining] = useState(false);
  const [selectedNoteTranscript, setSelectedNoteTranscript] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copyStatus, setCopyStatus] = useState('idle'); // 'idle' | 'copied' | 'error'
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, attachmentId: null });

  const tabs = ['Note', 'Quiz', 'Flashcards', 'Mindmap', 'About'];

  // 从数据库获取笔记
  useEffect(() => {
    let isMounted = true;

    const fetchNote = async () => {
      setIsLoading(true);
      try {
        const noteData = await db.notes.get(parseInt(noteId));
        if (isMounted) {
          setNote(noteData);
        }
      } catch (error) {
        console.error('Error fetching note:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchNote();

    return () => {
      isMounted = false;
    };
  }, [noteId]);

  // 当进入编辑模式时，初始化编辑内容
  useEffect(() => {
    if (isEditing && note) {
      setEditContent(note.content || '');
    }
  }, [isEditing, note]);

  // 修改笔记更新函数
  const handleNoteUpdate = async () => {
    setIsLoading(true);
    try {
      const updatedNote = {
        ...note,
        content: editContent,
        lastModified: new Date().toISOString(),
      };

      await db.notes.update(note.id, updatedNote);
      setNote(updatedNote);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    // 实现分享能
    const shareUrl = `${window.location.origin}/notes/${noteId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Note link copied to clipboard!');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Initialize markdown-it
      const md = new MarkdownIt();
      
      // Create a temporary div to render the markdown content
      const tempDiv = document.createElement('div');
      tempDiv.className = 'pdf-export-container';
      
      // Create title element
      const titleElement = document.createElement('h1');
      titleElement.textContent = note.title;
      tempDiv.appendChild(titleElement);
      
      // Create content container
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = md.render(note.content);
      tempDiv.appendChild(contentDiv);
      
      // Add some basic styling
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      // Configure PDF options
      const options = {
        margin: 10,
        filename: `${note.title}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate PDF
      await html2pdf().from(tempDiv).set(options).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // 添加用户消息
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    // 模拟AI响应
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'assistant',
        content: `I understand you're asking about "${inputMessage}". Let me help you with that...`,
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  // 添加一个安全的内容获取函数
  const getSafeContent = () => {
    try {
      return note?.content || '';
    } catch (error) {
      console.error('Error getting note content:', error);
      return '';
    }
  };

  // Add this function to fetch available notes
  const fetchAvailableNotes = useCallback(async () => {
    try {
      const notes = await db.notes
        .where('id')
        .notEqual(Number(noteId))
        .toArray();
      setAvailableNotes(notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }, [noteId]);

  // Add this function to handle note combination
  const handleCombineNotes = async () => {
    if (!selectedNoteId) return;
    
    setIsCombining(true);
    try {
      // Get the selected note
      const selectedNote = await db.notes.get(selectedNoteId);
      
      // Combine transcripts
      const combinedTranscript = `${note.transcript || ''}\n\n${selectedNote.transcript || ''}`;
      
      // Generate new note from combined transcripts
      const newNoteContent = await generateNote(combinedTranscript, note.noteLanguage);
      
      // Save the combined note
      const combinedNote = {
        title: `Combined: ${note.title} & ${selectedNote.title}`,
        content: newNoteContent,
        transcript: combinedTranscript,
        //subject: note.subject,
        noteLanguage: note.noteLanguage,
        date: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      const newNoteId = await db.notes.put(combinedNote);
      
      // Navigate to the new combined note
      navigate(`/notes/${newNoteId}`);
    } catch (error) {
      console.error('Error combining notes:', error);
      alert('Failed to combine notes: ' + error.message);
    } finally {
      setIsCombining(false);
      setIsAddModalOpen(false);
    }
  };

  const handleNoteSelect = async (noteId) => {
    setSelectedNoteId(noteId);
    try {
      const selectedNote = await db.notes.get(noteId);
      setSelectedNoteTranscript(selectedNote.transcript);
    } catch (error) {
      console.error('Error fetching selected note transcript:', error);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setSelectedNoteId(null);
    setSelectedNoteTranscript(null);
  };

  const handleCopyTranscript = async () => {
    try {
      const textToCopy = typeof note.transcript === 'object'
        ? JSON.stringify(note.transcript, null, 2)
        : note.transcript;

      await navigator.clipboard.writeText(textToCopy);
      
      // Show success status
      setCopyStatus('copied');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopyStatus('error');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    }
  };

  // Add this effect to load attachments
  useEffect(() => {
    const loadAttachments = async () => {
      if (note?.attachments?.length) {
        const attachmentData = await Promise.all(
          note.attachments.map(id => db.attachments.get(id))
        );
        setAttachments(attachmentData);
      }
    };
    loadAttachments();
  }, [note]);

  // Add these handler functions
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        await db.saveAttachment(note.id, file);
      }
      // Refresh attachments list
      const updatedNote = await db.notes.get(note.id);
      const newAttachments = await Promise.all(
        updatedNote.attachments.map(id => db.attachments.get(id))
      );
      setAttachments(newAttachments);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const { blob, fileName } = await db.getAttachment(attachment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (attachmentId) => {
    setDeleteConfirmation({ isOpen: true, attachmentId });
  };

  const confirmDelete = async () => {
    try {
      const attachmentId = deleteConfirmation.attachmentId;
      await db.deleteAttachment(attachmentId, note.id);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      setDeleteConfirmation({ isOpen: false, attachmentId: null });
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  if (isLoading || !note) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex relative">
      {/* Main Content */}
      <div 
        className="flex-1 flex flex-col"
        style={{ 
          marginRight: `${sidebarState.isCollapsed ? sidebarState.COLLAPSED_SIZE : sidebarState.size.width}px`,
          transition: 'margin-right 0.2s ease-out'
        }}
      >
        {/* Header */}
        <header className="border-b border-gray-200 p-4 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-800"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">{note.title}</h1>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-4">
              {/* Edit/Save 按钮 */}
              {isEditing ? (
                <button
                  onClick={handleNoteUpdate}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg border border-gray-200 
                           text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <FiCheck className="w-4 h-4" />
                  <span>Save</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg border border-gray-200 
                           text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}

              {/* Export 按钮 */}
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-6 py-2
                         rounded-lg border border-gray-200 text-gray-700 bg-white 
                         hover:bg-gray-50 transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-gray-800 text-gray-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-2">
          {activeTab === 'Note' && (
            <div className="h-full w-full">
              <NoteContent
                content={note.content}
                isEditing={isEditing}
                editContent={editContent}
                onEditChange={setEditContent}
                onEdit={() => setIsEditing(true)}
                onSave={handleNoteUpdate}
                onCancel={() => {
                  setIsEditing(false);
                  setEditContent(note.content);
                }}
                readOnly={!isEditing}
              />
            </div>
          )}

          {activeTab === 'Quiz' && (
            <QuizPanel 
              noteContent={note?.content} 
              noteId={note?.id} 
            />
          )}

          {activeTab === 'Flashcards' && (
            <FlashcardPanel 
              noteContent={note?.content} 
              noteId={note?.id} 
            />
          )}

          {/* {activeTab === 'Podcast' && (
            <div className="h-full p-6">
              <div className="h-full bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">
                  Podcast Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p>{new Date(note.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Modified</p>
                    <p>{new Date(note.lastModified).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subject</p>
                    <p>{note.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Source</p>
                    <p>{note.source}</p>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          <div className={activeTab === 'Mindmap' ? 'block h-full' : 'hidden'}>
            <MindmapPanel 
              noteContent={note?.content}
              isVisible={activeTab === 'Mindmap'}
            />
          </div>

          {activeTab === 'About' && (
            <div className="h-full p-6">
              <div className="space-y-6">
                {/* Note Information Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                      <h2 className="text-xl font-semibold">Note Information</h2>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {/* Created Date */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Created: {new Date(note.date).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Last Modified Date */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Last Modified: {new Date(note.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* YouTube References Card */}
                {/* <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-red-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM10 15V9l5.2 3-5.2 3z"/>
                        </svg>
                      </span>
                      <h2 className="text-xl font-semibold">YouTube References</h2>
                    </div>
                    {note.youtubeUrl && (
                      <a
                        href={note.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21.593 7.203a2.506 2.506 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 0 0-1.766 1.778C2 8.769 2 12 2 12s0 3.231.403 4.792c.222.85.864 1.494 1.766 1.721C5.736 18.993 12 19 12 19s6.264.007 7.831-.404a2.51 2.51 0 0 0 1.766-1.778C22 15.231 22 12 22 12s0-3.231-.407-4.797zM10 15V9l5.2 3-5.2 3z"/>
                        </svg>
                        Open in YouTube
                      </a>
                    )}
                  </div>
                  {note.youtubeUrl ? (
                    <div className="aspect-video w-full rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(note.youtubeUrl)}`}
                        title="YouTube video player"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <p className="text-gray-600">No YouTube URLs available</p>
                  )}
                </div> */}

                {/* Attached Files Card */}
                {/* <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </span>
                      <h2 className="text-xl font-semibold">Attached Files</h2>
                    </div>
                    <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      {isUploading ? 'Uploading...' : 'Add File'}
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>

                  {attachments.length > 0 ? (
                    <div className="space-y-3">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="font-medium">{attachment.fileName}</p>
                              <p className="text-sm text-gray-500">
                                {(attachment.size / 1024).toFixed(1)} KB • {new Date(attachment.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownload(attachment)}
                              className="p-2 text-gray-600 hover:text-blue-500 transition-colors"
                              title="Download"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(attachment.id)}
                              className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No files attached</p>
                  )}
                </div> */}

                {/* Transcript Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-green-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </span>
                      <h2 className="text-xl font-semibold">Transcript</h2>
                    </div>
                    {note.transcript && (
                      <button 
                        onClick={handleCopyTranscript}
                        disabled={copyStatus === 'copied'}
                        className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2
                          ${copyStatus === 'copied' 
                            ? 'bg-green-50 text-green-600 border-green-200' 
                            : copyStatus === 'error'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {copyStatus === 'copied' ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : copyStatus === 'error' ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Error
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {note.transcript ? (
                      typeof note.transcript === 'object' ? (
                        <div className="space-y-3">
                          {Array.isArray(note.transcript) ? (
                            // Handle array of transcript segments
                            note.transcript.map((segment, index) => (
                              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">
                                  {segment.text || JSON.stringify(segment)}
                                </p>
                                {segment.timestamp && (
                                  <span className="text-xs text-gray-500">
                                    {new Date(segment.timestamp).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            ))
                          ) : (
                            // Handle object transcript
                            <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(note.transcript, null, 2)}
                            </pre>
                          )}
                        </div>
                      ) : (
                        // Handle string transcript
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {note.transcript}
                          </p>
                        </div>
                      )
                    ) : (
                      <p className="text-gray-600">No transcript available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant with DraggableSidebar */}
      <DraggableSidebar
        title="AI Assistant"
        defaultWidth={350}
        minWidth={280}
        initialPosition="right"
        defaultTab="Chat"
        onStateChange={setSidebarState}
      >
        <div role="tabpanel" label="Chat">
          <AiAssistant noteContent={note?.content || ''} />
        </div>
      </DraggableSidebar>

      {/* Add this modal component */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Combine with Another Note</h2>
              <p className="mt-1 text-sm text-gray-500">
                Select another note to combine with "{note.title}"
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {availableNotes.map((availableNote) => (
                  <div
                    key={availableNote.id}
                    onClick={() => handleNoteSelect(availableNote.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedNoteId === availableNote.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'hover:border-blue-200 hover:bg-blue-50/50'
                    }`}
                  >
                    <h3 className="font-medium text-gray-800">{availableNote.title}</h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>Created: {new Date(availableNote.date).toLocaleDateString()}</span>
                      {availableNote.subject && (
                        <span>Subject: {availableNote.subject}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCombineNotes}
                disabled={!selectedNoteId || isCombining}
                className={`px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-all ${
                  !selectedNoteId || isCombining
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-600 hover:shadow-md'
                }`}
              >
                {isCombining ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Combining...</span>
                  </>
                ) : (
                  'Combine Notes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Confirmation</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this file? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, attachmentId: null })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default NoteDetail;

