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
        <div key={sectionIndex} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <div className="space-y-4">
            {parts.map((part, index) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                const boldText = part.slice(2, -2);
                if (boldText.includes(':')) {
                  return (
                    <h3 key={index} className="font-bold text-lg mt-4 mb-2">
                      {boldText.replace(':', '')}
                    </h3>
                  );
                }
                return (
                  <h4 key={index} className="font-semibold text-md mt-3 mb-1">
                    {boldText}
                  </h4>
                );
              }

              const items = part.split('-').filter(Boolean);
              return (
                <div key={index} className="ml-4">
                  {items.map(
                    (item, i) =>
                      item.trim() && (
                        <div key={i} className="flex gap-2 mb-2">
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

  return <div className="text-gray-800">{processText(content)}</div>;
};

export default ContentDisplay;
