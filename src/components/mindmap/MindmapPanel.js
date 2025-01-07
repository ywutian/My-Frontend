import React, { useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { askQuestion } from '../../services/aiService';

const NODE_STYLES = {
  root: {
    background: '#4f46e5', // Indigo-600
    fontSize: '18px',
    fontWeight: 'bold',
    minWidth: '280px',
  },
  topic: {
    background: '#6366f1', // Indigo-500
    fontSize: '16px',
    fontWeight: 'semibold',
    minWidth: '240px',
  },
  detail: {
    background: '#818cf8', // Indigo-400
    fontSize: '14px',
    minWidth: '200px',
  },
  base: {
    color: 'white',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
};

const MindmapPanel = ({ noteContent }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const getNodeStyle = (level) => ({
    ...NODE_STYLES.base,
    ...(level === 1 ? NODE_STYLES.root : level === 2 ? NODE_STYLES.topic : NODE_STYLES.detail),
  });

  const convertToNodesAndEdges = (markdownContent) => {
    const lines = markdownContent.split('\n').filter(line => line.trim());
    const nodes = [];
    const edges = [];
    let nodeId = 1;
    let previousIds = [0];
    
    // Calculate vertical spacing
    const levelNodes = {};
    lines.forEach(line => {
      const level = line.startsWith('#') 
        ? line.match(/^#+/)[0].length
        : line.startsWith('-') ? 3 : 1;
      levelNodes[level] = (levelNodes[level] || 0) + 1;
    });

    let levelCounters = {};
    lines.forEach((line) => {
      const level = line.startsWith('#') 
        ? line.match(/^#+/)[0].length
        : line.startsWith('-') ? 3 : 1;

      const text = line.replace(/^[#\s-]+/, '').trim();
      levelCounters[level] = (levelCounters[level] || 0) + 1;

      // Calculate position
      const xPos = level * 350; // Increased horizontal spacing
      const totalInLevel = levelNodes[level];
      const currentIndex = levelCounters[level];
      const yPos = (currentIndex - (totalInLevel + 1) / 2) * 120;

      nodes.push({
        id: nodeId.toString(),
        data: { label: text },
        position: { x: xPos, y: yPos },
        style: getNodeStyle(level),
      });

      if (nodeId > 1) {
        edges.push({
          id: `e${previousIds[level - 1]}-${nodeId}`,
          source: previousIds[level - 1].toString(),
          target: nodeId.toString(),
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#c7d2fe', strokeWidth: 3 }, // Indigo-200
        });
      }

      previousIds[level] = nodeId;
      nodeId++;
    });

    return { nodes, edges };
  };

  const generateMindmap = async () => {
    try {
      let finalResponse = '';
      await askQuestion(
        noteContent,
        `Create a hierarchical mindmap in markdown format that summarizes the key points. Use this exact format with no additional text:
# ${noteContent.split(' ').slice(0, 3).join(' ')}...
## Key Finding 1
- Supporting Evidence
- Important Detail
## Key Finding 2
- Supporting Evidence
- Important Detail
## Key Finding 3
- Supporting Evidence
- Important Detail`,
        (chunk) => {
          finalResponse += chunk;
        },
      );

      const { nodes: newNodes, edges: newEdges } = convertToNodesAndEdges(finalResponse);
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error('Error generating mindmap:', error);
    }
  };

  const onInit = useCallback((reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.3 });
  }, []);

  return (
    <div className="h-full p-6">
      <button
        onClick={generateMindmap}
        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg 
                   transition-colors duration-200 shadow-md"
      >
        Generate Mindmap
      </button>
      <div className="w-full h-[750px] bg-gray-50 rounded-xl shadow-xl mt-6">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit}
          fitView
          minZoom={0.1}
          maxZoom={1.5}
          defaultZoom={0.8}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Controls className="bg-white shadow-lg rounded-lg" />
          <MiniMap 
            style={{ background: 'white' }}
            className="shadow-lg rounded-lg"
            nodeColor={(node) => node.style.background}
          />
          <Background color="#e0e7ff" gap={16} size={1} /> {/* Indigo-100 */}
        </ReactFlow>
      </div>
    </div>
  );
};

export default MindmapPanel;
