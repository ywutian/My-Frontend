import React, { useState, useCallback } from 'react';
import { LiveTranscription } from '../components/transcription';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Sidebar from '../components/layout/Sidebar';
import DraggableSidebar from '../components/layout/DraggableSidebar';
import TranscriptionPanel from '../components/transcription/TranscriptionPanel';
import AiAssistant from '../components/ai/AiAssistant';

function TranscriptionPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [rightSidebarState, setRightSidebarState] = useState({
    isCollapsed: false,
    size: { width: 400 },
    COLLAPSED_SIZE: 40
  });
  const [transcriptionContent, setTranscriptionContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // 监听转录内容更新
  const handleTranscriptionUpdate = useCallback((content) => {
    setTranscriptionContent(content);
  }, []);

  // 处理录音状态切换
  const handleRecordingToggle = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

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
            <div className="h-[calc(100vh-120px)] overflow-auto">
              <LiveTranscription 
                onTranscriptionUpdate={handleTranscriptionUpdate}
                isRecording={isRecording}
              />
            </div>
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