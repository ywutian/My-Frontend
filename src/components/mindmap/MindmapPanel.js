import React, { useState, useEffect, useRef } from 'react';
import { Markmap, loadCSS, loadJS } from 'markmap-view';
import { askQuestion } from '../../services/aiService';

const MarkmapPanel = ({ noteContent }) => {
  const [markmapContent, setMarkmapContent] = useState('');
  const svgRef = useRef(null);

  // Generate the Markmap content based on AI response
  const generateMarkmap = async () => {
    try {
      let finalResponse = '';
      await askQuestion(
        noteContent,
        `Generate a Markdown mindmap with exactly this syntax and no extra text:
# Stress and Health
## Main Topic 1
- Subtopic
- Subtopic
## Main Topic 2
- Subtopic
- Subtopic`,
        (chunk) => {
          finalResponse += chunk;
        },
      );

      // Set the AI-generated response as the Markmap content
      setMarkmapContent(finalResponse);
    } catch (error) {
      console.error('Error generating Markmap:', error);
    }
  };

  // Initialize Markmap whenever content updates
  useEffect(() => {
    if (svgRef.current && markmapContent) {
      try {
        Markmap.create(svgRef.current, null, markmapContent);
      } catch (error) {
        console.error('Error rendering Markmap:', error);
      }
    }
  }, [markmapContent]);

  // Load Markmap assets once when the component mounts
  useEffect(() => {
    loadCSS('https://cdn.jsdelivr.net/npm/markmap-view/dist/markmap-view.css');
    loadJS('https://cdn.jsdelivr.net/npm/d3/dist/d3.min.js');
    loadJS(
      'https://cdn.jsdelivr.net/npm/markmap-view/dist/markmap-view.min.js',
    );
  }, []);

  return (
    <div className="h-full p-6">
      <button
        onClick={generateMarkmap}
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
      >
        Generate Markmap
      </button>
      <div className="w-full h-full bg-gray-100 p-4 rounded shadow-lg mt-4">
        <svg ref={svgRef} style={{ width: '100%', height: '500px' }}></svg>
      </div>
    </div>
  );
};

export default MarkmapPanel;
