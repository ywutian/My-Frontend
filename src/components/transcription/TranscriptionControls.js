import React from 'react';
import { MicrophoneIcon, StopIcon, LanguageIcon } from '@heroicons/react/24/solid';

export function TranscriptionControls({ 
  isRecording, 
  isTranslating, 
  onRecordingToggle, 
  onTranslationToggle 
}) {
  return (
    <div className="absolute top-4 right-4 flex gap-4 z-10">
      {/* 翻译切换按钮 */}
      <button
        onClick={onTranslationToggle}
        className={`p-2 rounded-full transition-colors duration-200 ${
          isTranslating
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
        title={isTranslating ? '关闭翻译' : '开启翻译'}
      >
        <LanguageIcon className="w-6 h-6" />
      </button>

      {/* 录音控制按钮 */}
      <button
        onClick={onRecordingToggle}
        className={`p-2 rounded-full transition-colors duration-200 ${
          isRecording
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
        title={isRecording ? '停止录音' : '开始录音'}
      >
        {isRecording ? (
          <StopIcon className="w-6 h-6" />
        ) : (
          <MicrophoneIcon className="w-6 h-6" />
        )}
      </button>
    </div>
  );
} 

export default TranscriptionControls; 