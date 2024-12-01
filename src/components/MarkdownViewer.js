import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// 创建一个纯展示组件
const MarkdownContent = React.memo(({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw]}
  >
    {content || ''}
  </ReactMarkdown>
));

// 主组件
const MarkdownViewer = ({ content }) => {
  // 使用 key 来强制重新渲染
  return (
    <div className="prose prose-slate max-w-none">
      <MarkdownContent 
        key={Date.now()} 
        content={content} 
      />
    </div>
  );
};

export default MarkdownViewer; 