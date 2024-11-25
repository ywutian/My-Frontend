import React from 'react';
import { motion } from 'framer-motion';

export function TranscriptList({ transcripts, isRecording, isTranslating }) {
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
        </div>

        {/* 翻译 */}
        {isTranslating && (
          <div className="mt-2 text-gray-600 border-t border-gray-200 pt-2 text-left">
            {transcripts.map(t => t.translation).filter(Boolean).join(' ')}
          </div>
        )}

        {/* 时间戳 */}
        {latestTranscript && (
          <div className="mt-2 text-xs text-gray-500">
            {new Date(latestTranscript.timestamp).toLocaleTimeString()}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default TranscriptList; 