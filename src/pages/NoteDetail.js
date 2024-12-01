import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit2, FiShare2, FiPlus, FiDownload, FiArrowLeft, FiSend, FiChevronRight, FiChevronLeft, FiSave } from 'react-icons/fi';
import QuizPanel from '../components/quiz/QuizPanel';
import FlashcardPanel from '../components/flashcards/FlashcardPanel';
import { db } from '../db/db';
import React from 'react';
import MarkdownViewer from '../components/MarkdownViewer';

function NoteDetail() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [activeTab, setActiveTab] = useState('Note');
  const [aiPanelWidth, setAiPanelWidth] = useState(300);
  const [isEditing, setIsEditing] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hi! I can help you analyze this note. What would you like to know?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const COLLAPSE_THRESHOLD = 100; // 收起阈值
  const COLLAPSED_WIDTH = 40; // 收起后宽度
  const MIN_WIDTH = 280; // 最小展开宽度
  const MAX_WIDTH = 800; // 最大宽度
  const [isLoading, setIsLoading] = useState(true);
  const [editContent, setEditContent] = useState('');
  const [shouldRender, setShouldRender] = useState(true);

  const tabs = ['Note', 'Quiz', 'Flashcards', 'Podcast', 'Mindmap', 'About'];

  // 从数据库获取笔记
  useEffect(() => {
    const fetchNote = async () => {
      setIsLoading(true);
      try {
        const noteData = await db.notes.get(parseInt(noteId));
        if (noteData) {
          setNote(noteData);
        } else {
          console.error('Note not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching note:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [noteId, navigate]);

  // 当进入编辑模式时，初始化编辑内容
  useEffect(() => {
    if (isEditing && note) {
      setEditContent(note.content || '');
    }
  }, [isEditing, note]);

  // 修改笔记更新函数
  const handleNoteUpdate = async () => {
    try {
      const updatedNote = {
        ...note,
        content: editContent,
        lastModified: new Date().toISOString()
      };
      
      // 1. 先退出编辑模式
      setIsEditing(false);
      
      // 2. 清空内容
      setNote(prev => ({ ...prev, content: '' }));
      
      // 3. 更新数据库
      await db.notes.update(note.id, updatedNote);
      
      // 4. 更新状态
      requestAnimationFrame(() => {
        setNote(updatedNote);
      });
      
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = isCollapsed ? MIN_WIDTH : aiPanelWidth;

    const handleMouseMove = (e) => {
      const deltaX = startX - e.clientX;
      const newWidth = startWidth + deltaX;
      
      // 检查是否应该收起
      if (newWidth < COLLAPSE_THRESHOLD) {
        setIsCollapsed(true);
        setAiPanelWidth(COLLAPSED_WIDTH);
      } else {
        setIsCollapsed(false);
        // 限制最小和最大宽度
        const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
        setAiPanelWidth(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'auto';
    };

    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // 模拟AI响应
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'assistant',
        content: `I understand you're asking about "${inputMessage}". Let me help you with that...`
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const toggleCollapse = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setAiPanelWidth(MIN_WIDTH);
    } else {
      setIsCollapsed(true);
      setAiPanelWidth(COLLAPSED_WIDTH);
    }
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

  if (isLoading || !note) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Main Content */}
      <div id="note-container" className="flex-1 overflow-hidden flex flex-col">
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
        <div className="flex-1 overflow-auto bg-gray-50">
          {activeTab === 'Note' && (
            <div className="h-full p-6">
              <div className="h-full bg-white p-6 rounded-lg shadow-sm">
                {isEditing ? (
                  <textarea
                    className="w-full h-full p-4 border rounded-lg font-mono"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                ) : (
                  <div className="h-full overflow-auto">
                    <MarkdownViewer key={note.lastModified} content={note.content} />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'Quiz' && (
            <div className="h-full">
              <QuizPanel 
                noteContent={note.content} 
                noteId={note.id}
              />
            </div>
          )}
          
          {activeTab === 'Flashcards' && (
            <div className="h-full">
              <FlashcardPanel />
            </div>
          )}
          
          {activeTab === 'Podcast' && (
            <div className="h-full p-6">
              <div className="h-full bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Podcast Information</h2>
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
            <div className="h-full p-6">
              <div className="h-full bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Mindmap Information</h2>
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resizable AI Panel */}
      <div
        className={`relative bg-white border-l flex flex-col ${
          isResizing ? 'select-none' : ''
        }`}
        style={{ 
          width: aiPanelWidth,
          transition: isResizing ? 'none' : 'width 0.2s ease-out'
        }}
      >
        {/* Resize Handle with Collapse Toggle */}
        <div
          className="absolute left-0 top-0 w-4 h-full cursor-col-resize group -ml-2"
          onMouseDown={handleResizeStart}
        >
          <div 
            className={`absolute left-1/2 top-0 w-1 h-full -translate-x-1/2 ${
              isResizing ? 'bg-purple-500' : 'bg-gray-200 group-hover:bg-purple-500'
            }`}
          />
          <button
            onClick={toggleCollapse}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            {isCollapsed ? <FiChevronLeft /> : <FiChevronRight />}
          </button>
        </div>

        {/* AI Panel Content */}
        {!isCollapsed ? (
          <>
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">AI Assistant</h2>
              <p className="text-sm text-gray-600">Ask me anything about this note...</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            <form 
              onSubmit={handleSendMessage}
              className="p-4 border-t bg-white"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
                  disabled={!inputMessage.trim()}
                >
                  <FiSend />
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <span className="text-gray-400 rotate-180" style={{ writingMode: 'vertical-rl' }}>
              AI Assistant
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteDetail; 