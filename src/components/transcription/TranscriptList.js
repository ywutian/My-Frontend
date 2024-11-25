import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function TranscriptList({ transcripts, interimResult, isRecording, isTranslating }) {
  // 将所有文字连接成一个字符串
  const combinedText = transcripts.map(t => t.text).join(' ');
  const latestTranscript = transcripts[transcripts.length - 1];

  return (
    <div className="space-y-4 mt-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`p-4 rounded-lg ${
          isRecording ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
        }`}
      >
        {/* 连续显示的文字 */}
        <div className="text-gray-800 text-left">
          {combinedText}
          {interimResult && (
            <span className="text-gray-800"> {interimResult.text}</span>
          )}
        </div>

        {/* 翻译 */}
        {isTranslating && (
          <div className="mt-2 text-gray-600 border-t border-gray-200 pt-2 text-left">
            {transcripts.map(t => t.translation).filter(Boolean).join(' ')}
            {interimResult?.translation && (
              <span> {interimResult.translation}</span>
            )}
          </div>
        )}

        {/* 时间戳 */}
        {(latestTranscript || interimResult) && (
          <div className="mt-2 text-xs text-gray-500">
            {new Date(
              (latestTranscript || interimResult).timestamp
            ).toLocaleTimeString()}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default TranscriptList; 