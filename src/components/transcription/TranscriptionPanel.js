import React from 'react';
// 添加图标导入
import { MicrophoneIcon, StopIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import { languages } from '../../config/languages';
import { useTranscriptStore } from '../../hooks/useTranscripts';
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
  // 从 store 获取状态和更新方法
  const {
    transcriptionLanguage: storeTranscriptionLanguage,
    translationLanguage: storeTranslationLanguage,
    isTranslating: storeIsTranslating,
    setTranscriptionLanguage,
    setTranslationLanguage,
    setIsTranslating
  } = useTranscriptStore();

  const noteLanguage =useTranscriptStore(state=>state.noteLanguage);
  const setNoteLanguage =useTranscriptStore(state=>state.setNoteLanguage);
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
            value={storeTranscriptionLanguage}
            onChange={(e) => setTranscriptionLanguage(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
        {/*笔记语言选择*/}
        <div>
        <label className="text-sm text-gray-500 mb-1 block">
          Note Language
        </label>
        <select
          value={noteLanguage}
          onChange={(e) => setNoteLanguage(e.target.value)}
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
                storeIsTranslating ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              {storeIsTranslating ? 'On' : 'Off'}
            </button>
          </div>

          {storeIsTranslating && (
            <select
              value={storeTranslationLanguage}
              onChange={(e) => setTranslationLanguage(e.target.value)}
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
