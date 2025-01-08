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
    background: '#f8fafc', // gray-50
    fontSize: '18px',
    fontWeight: 'bold',
    minWidth: '280px',
  },
  topic: {
    background: '#f1f5f9', // gray-100
    fontSize: '16px',
    fontWeight: 'semibold',
    minWidth: '240px',
  },
  detail: {
    background: '#e2e8f0', // gray-200
    fontSize: '14px',
    minWidth: '200px',
  },
  base: {
    color: '#334155', // gray-700
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #e5e7eb', // gray-200
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
        className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg 
                 border border-gray-200 transition-colors duration-200 shadow-sm"
      >
        Generate Mindmap
      </button>
      <div className="w-full h-[750px] bg-gray-50 rounded-xl border border-gray-200 shadow-sm mt-6">
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
          <Controls className="bg-white shadow-sm rounded-lg border border-gray-200" />
          <MiniMap 
            style={{ background: 'white' }}
            className="shadow-sm rounded-lg border border-gray-200"
            nodeColor={(node) => node.style.background}
          />
          <Background color="#f1f5f9" gap={16} size={1} /> {/* gray-100 */}
        </ReactFlow>
      </div>
    </div>
  );
};

export default MindmapPanel;
