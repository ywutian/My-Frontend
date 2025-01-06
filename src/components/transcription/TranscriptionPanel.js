import React from 'react';
// 添加图标导入
import { MicrophoneIcon, StopIcon, DocumentTextIcon } from '@heroicons/react/24/solid';

// 把 languages 移动到组件内部
const TranscriptionPanel = ({
  isRecording,
  isTranslating,
  transcriptionLanguage,
  translationLanguage,
  onTranscriptionLanguageChange,
  onTranslationLanguageChange,
  onRecordingToggle,
  onTranslationToggle,
  onGenerateNote,
  hasTranscripts,
}) => {
  // 语言选项移到组件内部
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
  ];
  return (
    <div className="p-4 space-y-4">
      {/* 录音控制按钮 */}
      <div>
        <button
          onClick={onRecordingToggle}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
            isRecording
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {isRecording ? (
            <>
              <StopIcon className="w-5 h-5" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <MicrophoneIcon className="w-5 h-5" />
              <span>Start Recording</span>
            </>
          )}
        </button>
      </div>

      {/* 语言控制部分 */}
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-500 mb-1 block">
            Transcription Language
          </label>
          <select
            value={transcriptionLanguage}
            onChange={(e) => onTranscriptionLanguageChange(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* 翻译控制 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-500">Translation</label>
            <button
              onClick={onTranslationToggle}
              className={`px-3 py-1 rounded-lg transition-colors ${
                isTranslating ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              {isTranslating ? 'On' : 'Off'}
            </button>
          </div>

          {isTranslating && (
            <select
              value={translationLanguage}
              onChange={(e) => onTranslationLanguageChange(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 生成笔记按钮 - 移到这里 */}
      <div className="pt-2 border-t border-gray-200">
        <button
          onClick={onGenerateNote}
          disabled={!hasTranscripts}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
            hasTranscripts 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title={hasTranscripts ? 'Generate Note' : 'No transcripts available'}
        >
          <DocumentTextIcon className="w-5 h-5" />
          <span>Generate Note</span>
        </button>
      </div>
    </div>
  );
};

export default TranscriptionPanel;
