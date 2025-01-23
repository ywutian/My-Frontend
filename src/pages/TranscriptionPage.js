import React, { useState, useCallback, useEffect } from 'react';
import { LiveTranscription } from '../components/transcription';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Sidebar from '../components/layout/Sidebar';
import DraggableSidebar from '../components/layout/DraggableSidebar';
import TranscriptionPanel from '../components/transcription/TranscriptionPanel';
import AiAssistant from '../components/ai/AiAssistant';
import Split from 'react-split';
import LiveNotes from '../components/notes/LiveNotes';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useTranscriptStore } from '../hooks/useTranscripts';
import { saveNote } from '../db/db';

function TranscriptionPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rightSidebarState, setRightSidebarState] = useState({
    isCollapsed: false,
    size: { width: 400 },
    COLLAPSED_SIZE: 40
  });
  const [transcriptionContent, setTranscriptionContent] = useState('');
  const [transcriptionSegments, setTranscriptionSegments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [collapsedPanel, setCollapsedPanel] = useState(null);
  const COLLAPSE_THRESHOLD = 200;
  const [noteTitle, setNoteTitle] = useState(getDefaultTitle());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const addNote = useTranscriptStore(state => state.addNote);

  // 直接从 Zustand store 获取笔记数据
  const notes = useTranscriptStore(state => state.notes);

  // 添加语言相关的状态
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('en-US'); // 默认中文
  const [translationLanguage, setTranslationLanguage] = useState('en-US');    // 默认英文
  const [isTranslating, setIsTranslating] = useState(false);                  // 默认不开启翻译

  // 监听转录内容更新
  const handleTranscriptionUpdate = useCallback((content, segments) => {
    setTranscriptionContent(content);
    setTranscriptionSegments(segments);
  }, []);

  // 处理录音状态切换
  const handleRecordingToggle = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  // 处理分割面板大小变化
  const handleSplitDrag = (sizes) => {
    const [leftSize, rightSize] = sizes;
    const leftWidth = window.innerWidth * (leftSize / 100);
    const rightWidth = window.innerWidth * (rightSize / 100);

    if (leftWidth < COLLAPSE_THRESHOLD && collapsedPanel !== 'left') {
      setCollapsedPanel('left');
    } else if (rightWidth < COLLAPSE_THRESHOLD && collapsedPanel !== 'right') {
      setCollapsedPanel('right');
    } else if (leftWidth >= COLLAPSE_THRESHOLD && rightWidth >= COLLAPSE_THRESHOLD) {
      setCollapsedPanel(null);
    }
  };

  // 生成默认标题（当前日期）
  function getDefaultTitle() {
    const now = new Date();
    return now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '-');
  }

  // 处理标题编辑
  const handleTitleChange = (e) => {
    setNoteTitle(e.target.value);
  };

  // 处理标题编辑完成
  const handleTitleSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      setIsEditingTitle(false);
    }
  };

  // 处理标题编辑开始
  const handleStartEditing = () => {
    setIsEditingTitle(true);
    // 选中所有文本，方便直接输入覆盖
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.select();
      }
    }, 0);
  };

  // 处理生成笔记
  const handleGenerateNote = async () => {
    if (!transcriptionContent.trim()) return;

    try {
      // 从 store 获取所有笔记内容并按时间顺序合并
      const storeNotes = useTranscriptStore.getState().notes;
      
      // 如果没有已生成的笔记，就不需要合并
      if (storeNotes.length === 0) {
        return;
      }

      const combinedContent = storeNotes
        .sort((a, b) => a.timestamp - b.timestamp)  // 按时间顺序排序
        .map(note => note.content)                  // 获取所有内容
        .join('\n');                               // 合并所有内容
      
      // 准备笔记数据
      const noteData = {
        title: noteTitle || getDefaultTitle(),
        content: combinedContent,                   // 只使用合并后的笔记内容
        transcript: transcriptionContent,           // 保留原始转录文本
        segments: transcriptionSegments,
        audioLanguage: transcriptionLanguage,
        noteLanguage: isTranslating ? translationLanguage : transcriptionLanguage,
        date: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        syncStatus: 'pending'
      };

      // 保存到数据库
      const noteId = await saveNote(noteData);

      // 清空当前转录内容
      setTranscriptionContent('');
      setTranscriptionSegments([]);
      
      // 显示成功提示
      alert('Note generated successfully!');
    } catch (error) {
      console.error('Failed to generate note:', error);
      alert('Failed to generate note. Please try again.');
    }
  };

  // 处理页面离开
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (transcriptionContent.trim()) {
        // 自动保存笔记
        await handleGenerateNote();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [transcriptionContent]);

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-gray-50">
        {/* Left Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        
        {/* Main Content */}
        <div 
          className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}
          style={{ 
            marginRight: rightSidebarState.isCollapsed 
              ? `${rightSidebarState.COLLAPSED_SIZE}px` 
              : `${rightSidebarState.size.width}px`
          }}
        >
          <div className="w-full h-full px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={noteTitle}
                  onChange={handleTitleChange}
                  onKeyDown={handleTitleSubmit}
                  onBlur={handleTitleSubmit}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full max-w-md"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
                  onClick={handleStartEditing}
                >
                  {noteTitle || getDefaultTitle()}
                </h1>
              )}
            </div>
            
            {/* Split Container */}
            <Split
              className="flex h-[calc(100vh-120px)]"
              sizes={collapsedPanel === 'left' ? [0, 100] : 
                     collapsedPanel === 'right' ? [100, 0] : 
                     [50, 50]}
              minSize={100}
              gutterSize={12}
              gutterStyle={() => ({
                backgroundColor: '#f3f4f6',
                cursor: 'col-resize',
                margin: '0 -6px',
                width: '12px',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '1px',
                  height: '100%',
                  backgroundColor: '#e5e7eb',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '4px',
                  height: '80px',
                  borderRadius: '2px',
                  backgroundColor: '#d1d5db',
                  transition: 'all 0.2s ease',
                },
                '& .drag-dots': {
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '2px',
                  height: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: '0.5',
                  transition: 'opacity 0.2s ease',
                },
                '&:hover': {
                  backgroundColor: '#e5e7eb',
                  '&::after': {
                    backgroundColor: '#9ca3af',
                    width: '6px',
                  },
                  '& .drag-dots': {
                    opacity: '1',
                  }
                },
                '&:active': {
                  backgroundColor: '#d1d5db',
                  '&::after': {
                    backgroundColor: '#6b7280',
                  }
                }
              })}
              renderGutter={({ index }) => (
                <div className="gutter-custom">
                  <div className="drag-dots">
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  </div>
                </div>
              )}
              snapOffset={20}
              dragInterval={1}
              onDrag={handleSplitDrag}
            >
              {/* Left Panel - Live Transcription */}
              <div className={`pr-2 transition-all duration-300 ${
                collapsedPanel === 'left' ? 'w-0 overflow-hidden' : 'w-full'
              }`}>
                <LiveTranscription 
                  onTranscriptionUpdate={handleTranscriptionUpdate}
                  isRecording={isRecording}
                />
                {collapsedPanel === 'left' && (
                  <button
                    onClick={() => setCollapsedPanel(null)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-blue-500 text-white p-2 rounded-r-lg"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Right Panel - Live Notes */}
              <div className={`pl-2 transition-all duration-300 ${
                collapsedPanel === 'right' ? 'w-0 overflow-hidden' : 'w-full'
              }`}>
                <LiveNotes />
                {collapsedPanel === 'right' && (
                  <button
                    onClick={() => setCollapsedPanel(null)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-500 text-white p-2 rounded-l-lg"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </Split>
          </div>
        </div>

        {/* Right Sidebar */}
        <DraggableSidebar
          title="Controls"
          defaultWidth={400}
          minWidth={280}
          initialPosition="right"
          defaultTab="Transcription"
          onStateChange={setRightSidebarState}
        >
          <div role="tabpanel" label="Transcription">
            <TranscriptionPanel 
              isRecording={isRecording}
              onRecordingToggle={handleRecordingToggle}
              hasTranscripts={!!transcriptionContent.trim()}
              onGenerateNote={handleGenerateNote}
              transcriptionLanguage={transcriptionLanguage}
              translationLanguage={translationLanguage}
              isTranslating={isTranslating}
              onTranscriptionLanguageChange={setTranscriptionLanguage}
              onTranslationLanguageChange={setTranslationLanguage}
              onTranslationToggle={() => setIsTranslating(prev => !prev)}
            />
          </div>
          <div role="tabpanel" label="AI Assistant">
            <AiAssistant noteContent={transcriptionContent} />
          </div>
        </DraggableSidebar>
      </div>
    </ErrorBoundary>
  );
}

export default TranscriptionPage; 