import React, { useState, useCallback } from 'react';
import { LiveTranscription } from '../components/transcription';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Sidebar from '../components/layout/Sidebar';
import DraggableSidebar from '../components/layout/DraggableSidebar';
import TranscriptionPanel from '../components/transcription/TranscriptionPanel';
import AiAssistant from '../components/ai/AiAssistant';
import Split from 'react-split';
import LiveNotes from '../components/notes/LiveNotes';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

function TranscriptionPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [rightSidebarState, setRightSidebarState] = useState({
    isCollapsed: false,
    size: { width: 400 },
    COLLAPSED_SIZE: 40
  });
  const [transcriptionContent, setTranscriptionContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [collapsedPanel, setCollapsedPanel] = useState(null); // 'left' | 'right' | null
  const COLLAPSE_THRESHOLD = 200; // 从300px减小到200px

  // 监听转录内容更新
  const handleTranscriptionUpdate = useCallback((content) => {
    setTranscriptionContent(content);
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
              <h1 className="text-2xl font-bold text-gray-900">Live Transcription</h1>
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
                <LiveNotes content={transcriptionContent} />
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