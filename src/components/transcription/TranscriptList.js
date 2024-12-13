import React, { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranscriptText } from '../../utils/transcriptionUtils'; // 引入工具函数

export function TranscriptList({
  transcripts,
  interimResult,
  isRecording,
  isTranslating,
}) {
  const prevInterimRef = useRef('');

  // 使用工具函数计算历史文本和新增文本
  const { historicalText, incrementalText } = useMemo(() => {
    return getTranscriptText(transcripts, interimResult, prevInterimRef);
  }, [transcripts, interimResult]);

  // 添加调试日志
  useEffect(() => {
    console.log('TranscriptList updated:', {
      transcriptsCount: transcripts.length,
      hasInterim: !!interimResult,
      translations: transcripts.map((t) => t.translation).filter(Boolean),
    });
  }, [transcripts, interimResult]);

  return (
    <div className="space-y-4 mt-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`p-4 rounded-lg ${
          isRecording
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-gray-50 border border-gray-200'
        }`}
      >
        {/* 转录文本显示 */}
        <div className="text-gray-800 text-left">
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
          <div className="mt-2 text-gray-600 border-t border-gray-200 pt-2 text-left">
            {(() => {
              // 收集所有翻译，包括历史记录和当前临时结果
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
      </motion.div>
    </div>
  );
}

export default TranscriptList;
