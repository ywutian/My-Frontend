import React from 'react';

const ContentDisplay = ({ content }) => {
  const processText = (text) => {
    if (!text || typeof text !== 'string') {
      return <div>No content available</div>;
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
        <div key={sectionIndex} className="mb-0">
          <h4 className="text-xs mb-0">{title}</h4>
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
