import React, { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function TranscriptList({ transcripts, interimResult, isRecording, isTranslating }) {
  const prevInterimRef = useRef('');
  
  // 计算历史文本和新增文本
  const { historicalText, incrementalText } = useMemo(() => {
    const historical = transcripts.map(t => t.text).join(' ');
    
    if (!interimResult) {
      prevInterimRef.current = '';
      return { historicalText: historical, incrementalText: '' };
    }

    const currentText = interimResult.text;
    const prevText = prevInterimRef.current;
    
    // 计算真正的增量部分
    let newIncrement = '';
    if (currentText.startsWith(prevText)) {
      newIncrement = currentText.slice(prevText.length);
    } else {
      newIncrement = currentText;
    }
    
    prevInterimRef.current = currentText;
    
    return { 
      historicalText: historical,
      incrementalText: newIncrement.trim()
    };
  }, [transcripts, interimResult]);

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
          <span>{historicalText}</span>
          <span>{prevInterimRef.current}</span>
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

        {/* 翻译 */}
        {isTranslating && (
          <div className="mt-2 text-gray-600 border-t border-gray-200 pt-2 text-left">
            {[...transcripts, interimResult]
              .filter(Boolean)
              .map(t => t.translation)
              .filter(Boolean)
              .join(' ')}
          </div>
        )}

        {/* 时间戳 */}
        {(interimResult || transcripts[transcripts.length - 1]) && (
          <div className="mt-2 text-xs text-gray-500">
            {new Date(
              (interimResult || transcripts[transcripts.length - 1]).timestamp
            ).toLocaleTimeString()}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default TranscriptList; 