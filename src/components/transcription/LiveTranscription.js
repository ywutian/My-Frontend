import React, { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeepgramTranscription } from '../../hooks/useDeepgramTranscription';
import { useTranslation } from '../../hooks/useTranslation';
import { useTranscripts } from '../../hooks/useTranscripts';
import { getTranscriptText } from '../../utils/transcriptionUtils';

export default function LiveTranscription({ onTranscriptionUpdate, isRecording }) {
  const { error, startRecording, stopRecording } = useDeepgramTranscription();
  const { isTranslating, translateText } = useTranslation();
  const {
    transcripts,
    interimResult,
    updateLatestTranscript,
    updateTranscriptTranslations,
  } = useTranscripts();

  const prevInterimRef = useRef('');
  const transcriptContainerRef = useRef(null);

  // 监听外部录音状态变化
  useEffect(() => {
    if (isRecording) {
      startRecording(updateLatestTranscript);
    } else {
      stopRecording();
    }
  }, [isRecording, startRecording, stopRecording, updateLatestTranscript]);

  // 使用工具函数计算历史文本和新增文本
  const { historicalText, incrementalText } = useMemo(() => {
    return getTranscriptText(transcripts, interimResult, prevInterimRef);
  }, [transcripts, interimResult]);

  // 更新转录内容
  useEffect(() => {
    const fullTranscript = transcripts.map((t) => t.text).join('\n');
    const currentContent = interimResult?.text 
      ? `${fullTranscript}\n${interimResult.text}`
      : fullTranscript;
    
    onTranscriptionUpdate?.(currentContent);
  }, [transcripts, interimResult, onTranscriptionUpdate]);

  // 自动滚动到底部
  useEffect(() => {
    if (transcriptContainerRef.current) {
      const container = transcriptContainerRef.current;
      const shouldAutoScroll = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (shouldAutoScroll) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [historicalText, incrementalText]);

  return (
    <div className="h-full overflow-hidden">
      <motion.div
        ref={transcriptContainerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 
          scrollbar-track-transparent hover:scrollbar-thumb-gray-400 
          [&::-webkit-scrollbar]:w-2 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:bg-gray-300 
          [&::-webkit-scrollbar-thumb]:rounded-full 
          [&::-webkit-scrollbar-thumb:hover]:bg-gray-400`}
      >
        <div className={`p-4 rounded-lg border border-gray-200 ${
          isRecording ? 'bg-blue-50' : 'bg-gray-50'
        }`}>
          {/* 转录文本显示 */}
          <div className="text-left">
            <span>{historicalText}</span>
            <AnimatePresence mode="wait">
              {incrementalText && (
                <motion.span
                  key={incrementalText}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {' ' + incrementalText}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* 翻译显示部分 */}
          {isTranslating && (
            <div className="mt-2 text-gray-600 border-t border-gray-200 pt-2">
              {(() => {
                const translations = [
                  ...transcripts.map((t) => t.translation),
                  interimResult?.translation,
                ].filter(Boolean);
                return translations.join(' ');
              })()}
            </div>
          )}

          {/* 时间戳显示 */}
          {(interimResult || transcripts[transcripts.length - 1]) && (
            <div className="mt-2 text-xs text-gray-500">
              {new Date(
                (interimResult || transcripts[transcripts.length - 1]).timestamp,
              ).toLocaleTimeString()}
            </div>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="fixed bottom-4 left-4 bg-red-100 text-red-600 px-4 py-2 rounded-lg shadow">
          {error}
        </div>
      )}
    </div>
  );
}
