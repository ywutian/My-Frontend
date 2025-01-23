import React, { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

const ContentDisplay = ({ content }) => {
  const [copiedSection, setCopiedSection] = useState(null);

  const handleCopy = async (text, sectionIndex) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionIndex);
      setTimeout(() => setCopiedSection(null), 2000); // 2秒后重置复制状态
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const processText = (text) => {
    if (!text || typeof text !== 'string') {
      return (
        <div className="flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="relative inline-flex">
              {/* 主要加载动画 */}
              <div className="w-10 h-10 rounded-full border-[2px] border-gray-100">
                <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
                <div className="absolute inset-[2px] rounded-full bg-gradient-to-tr from-blue-50 to-white"></div>
              </div>
              {/* 加载点动画 */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"></div>
                <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce delay-100"></div>
                <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce delay-200"></div>
              </div>
            </div>
            {/* 文字提示 */}
            <div className="pt-2">
              <p className="text-sm font-medium text-gray-700">Processing Content</p>
              <p className="text-xs text-gray-500 mt-0.5">Please wait a moment</p>
            </div>
          </div>
        </div>
      );
    }

    // First split by sections (###)
    const sections = text.split('###').filter(Boolean);

    return sections.map((section, sectionIndex) => {
      if (!section.trim()) return null;

      // Split the section into title and content
      const [title, ...contentLines] = section.trim().split('\n');
      const sectionContent = contentLines.join('\n');

      // Process content for bold text and lists
      const parts = sectionContent.split(/(\*\*.*?\*\*)/g).filter(Boolean);

      return (
        <div key={sectionIndex} className="mb-2 relative group">
          <div className="flex justify-between items-start">
            <h4 className="text-xs mb-0">{title}</h4>
            <button
              onClick={() => handleCopy(section, sectionIndex)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                        ml-2 p-1.5 hover:bg-gray-100 rounded-lg"
            >
              {copiedSection === sectionIndex ? (
                <FiCheck className="w-4 h-4 text-green-500" />
              ) : (
                <FiCopy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          <div className="space-y-1">
            {parts.map((part, index) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                const boldText = part.slice(2, -2);
                if (boldText.includes(':')) {
                  return (
                    <h3 key={index} className="text-xs mt-1 mb-0">
                      {boldText.replace(':', '')}
                    </h3>
                  );
                }
                return (
                  <h4 key={index} className="text-xs mt-1 mb-0">
                    {boldText}
                  </h4>
                );
              }

              const items = part.split('-').filter(Boolean);
              return (
                <div key={index} className="ml-2">
                  {items.map(
                    (item, i) =>
                      item.trim() && (
                        <div key={i} className="flex gap-1 mb-0 text-xs">
                          <span>•</span>
                          <span>{item.trim()}</span>
                        </div>
                      ),
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return <div className="text-gray-800 text-xs">{processText(content)}</div>;
};

export default ContentDisplay;
