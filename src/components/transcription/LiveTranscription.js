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
    transcriptBuffer,
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
    const { segments, currentSegment, interimResult } = transcriptBuffer;
    return getTranscriptText(
      [...segments, currentSegment], 
      interimResult, 
      prevInterimRef
    );
  }, [transcriptBuffer]);

  // 更新转录内容
  useEffect(() => {
    const { segments, currentSegment, interimResult } = transcriptBuffer;
    const allSegments = [...segments, currentSegment];
    const fullTranscript = allSegments.map(segment => 
      segment.texts.map(t => t.text).join(' ')
    ).join('\n');
    
    const currentContent = interimResult?.text 
      ? `${fullTranscript}\n${interimResult.text}`
      : fullTranscript;
    
    onTranscriptionUpdate?.(currentContent);
  }, [transcriptBuffer, onTranscriptionUpdate]);

  // 合并所有需要显示的段落
  const displaySegments = useMemo(() => {
    const { segments, currentSegment, interimResult } = transcriptBuffer;
    
    // 1. 已完成的段落
    const completedSegments = [...segments];
    
    // 2. 当前段落（包含临时结果）
    if (currentSegment.texts.length > 0 || interimResult) {
      const currentDisplay = {
        ...currentSegment,
        texts: interimResult 
          ? [...currentSegment.texts, interimResult]
          : currentSegment.texts
      };
      completedSegments.push(currentDisplay);
    }

    return completedSegments;
  }, [transcriptBuffer]);

  // 添加自动滚动逻辑
  useEffect(() => {
    const container = transcriptContainerRef.current;
    if (container) {
      // 当新段落出现时自动滚动
      const { segments, currentSegment } = transcriptBuffer;
      const isNewSegment = segments.length > 0 && currentSegment.texts.length === 0;
      
      // 检查是否需要自动滚动
      const shouldAutoScroll = 
        isNewSegment || // 新段落出现时
        isRecording || // 正在录音时
        container.scrollHeight - container.scrollTop - container.clientHeight < 100; // 接近底部时
      
      if (shouldAutoScroll) {
        // 使用平滑滚动效果
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [transcriptBuffer, isRecording]); // 监听转录缓冲区和录音状态的变化

  return (
    <div className="h-full overflow-hidden">
      <motion.div
        ref={transcriptContainerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`h-full overflow-y-auto p-4 
          scrollbar-thin scrollbar-thumb-gray-300 
          scrollbar-track-transparent hover:scrollbar-thumb-gray-400 
          [&::-webkit-scrollbar]:w-2 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:bg-gray-300 
          [&::-webkit-scrollbar-thumb]:rounded-full 
          [&::-webkit-scrollbar-thumb:hover]:bg-gray-400`}
      >
        {displaySegments.map((segment, index) => (
          <div 
            key={segment.id || index}
            className={`p-4 rounded-lg border border-gray-200 mb-4 ${
              index === displaySegments.length - 1 && isRecording 
                ? 'bg-blue-50' 
                : 'bg-gray-50'
            }`}
          >
            {/* 段落时间戳 */}
            <div className="text-sm text-gray-500 mb-2">
              {new Date(segment.startTime).toLocaleTimeString()}
            </div>

            {/* 段落内容 */}
            <div className="text-left">
              {segment.texts.map((text, i) => (
                <span key={text.id || i}>{text.text} </span>
              ))}
            </div>

            {/* 翻译显示部分 */}
            {isTranslating && segment.translation && (
              <div className="mt-2 text-gray-600 border-t border-gray-200 pt-2">
                {segment.translation}
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {error && (
        <div className="fixed bottom-4 left-4 bg-red-100 text-red-600 px-4 py-2 rounded-lg shadow">
          {error}
        </div>
      )}
    </div>
  );
}
