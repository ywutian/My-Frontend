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

  const tabs = ['Note', 'Quiz', 'Flashcards', 'Podcast', 'Mindmap', 'About'];

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

      await db.notes.update(note.id, updatedNote); // 更新数据库
      setNote(updatedNote); // 更新状态
      setIsEditing(false); // 退出编辑模式
    } catch (error) {
      console.error('Error updating note:', error);
    } finally {
      setIsLoading(false); // 恢复加载状态
    }
  };

  const handleShare = () => {
    // 实现分享能
    const shareUrl = `${window.location.origin}/notes/${noteId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Note link copied to clipboard!');
  };

  const handleExport = () => {
    // 实现导出功能
    const blob = new Blob([note.content], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title}.md`;
    a.click();
    window.URL.revokeObjectURL(url);
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
        subject: note.subject,
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

  if (isLoading || !note) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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
        <header className="border-b p-4 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">{note.title}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={isEditing ? handleNoteUpdate : () => setIsEditing(true)}
              className="btn-primary flex items-center gap-1 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600"
            >
              {isEditing ? (
                <>
                  <FiSave /> Save
                </>
              ) : (
                <>
                  <FiEdit2 /> Edit
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="btn-secondary flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <FiShare2 /> Share
            </button>
            <button
              onClick={() => {
                fetchAvailableNotes();
                setIsAddModalOpen(true);
              }}
              className="btn-secondary flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <FiPlus /> Add
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <FiDownload /> Export
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b bg-white">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-purple-500 text-purple-500'
                    : 'text-gray-600 hover:text-gray-900'
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
            <div className="h-full bg-white p-2 rounded-lg shadow-sm relative mx-auto" >
              {/* 编辑模式 */}
              <textarea
                className="absolute inset-0 w-full h-full p-5 border rounded-lg font-mono"
                style={{
                  visibility: isEditing ? 'visible' : 'hidden',
                  pointerEvents: isEditing ? 'auto' : 'none',
                }}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />

              {/* 查看模式 */}
              <div
                className="absolute inset-0 w-full h-full overflow-auto px-5"
                style={{
                  visibility: !isEditing ? 'visible' : 'hidden',
                  pointerEvents: !isEditing ? 'auto' : 'none',
                }}
              >
                <MarkdownViewer content={note.content} />
              </div>
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

          {activeTab === 'Podcast' && (
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
          )}

          {activeTab === 'Mindmap' && (
            <div className="h-full">
              <MindmapPanel noteContent={note.content} />
            </div>
          )}

          {activeTab === 'About' && (
            <div className="h-full p-6">
              <div className="h-full bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Note Information</h2>
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
                  {note.transcript && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Original Transcripts</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Current Note Transcript */}
                        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                          <h3 className="font-medium mb-2">{note.title}</h3>
                          {typeof note.transcript === 'object' ? (
                            <div className="space-y-2">
                              {Array.isArray(note.transcript) ? (
                                note.transcript.map((segment, index) => (
                                  <div key={index} className="p-2 border-b">
                                    <p className="text-sm">{segment.text}</p>
                                  </div>
                                ))
                              ) : (
                                <pre className="whitespace-pre-wrap font-sans text-sm">
                                  {JSON.stringify(note.transcript, null, 2)}
                                </pre>
                              )}
                            </div>
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans text-sm">
                              {note.transcript}
                            </pre>
                          )}
                        </div>

                        {/* Selected Note Transcript */}
                        {selectedNoteTranscript && (
                          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                            <h3 className="font-medium mb-2">
                              {availableNotes.find(n => n.id === selectedNoteId)?.title}
                            </h3>
                            {typeof selectedNoteTranscript === 'object' ? (
                              <div className="space-y-2">
                                {Array.isArray(selectedNoteTranscript) ? (
                                  selectedNoteTranscript.map((segment, index) => (
                                    <div key={index} className="p-2 border-b">
                                      <p className="text-sm">{segment.text}</p>
                                    </div>
                                  ))
                                ) : (
                                  <pre className="whitespace-pre-wrap font-sans text-sm">
                                    {JSON.stringify(selectedNoteTranscript, null, 2)}
                                  </pre>
                                )}
                              </div>
                            ) : (
                              <pre className="whitespace-pre-wrap font-sans text-sm">
                                {selectedNoteTranscript}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Combine with Another Note</h2>
            <div className="max-h-96 overflow-y-auto">
              {availableNotes.map((availableNote) => (
                <div
                  key={availableNote.id}
                  onClick={() => handleNoteSelect(availableNote.id)}
                  className={`p-4 border rounded-lg mb-2 cursor-pointer ${
                    selectedNoteId === availableNote.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium">{availableNote.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {new Date(availableNote.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCombineNotes}
                disabled={!selectedNoteId || isCombining}
                className={`px-4 py-2 bg-purple-500 text-white rounded-lg ${
                  !selectedNoteId || isCombining
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-purple-600'
                }`}
              >
                {isCombining ? 'Combining...' : 'Combine Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default NoteDetail;
