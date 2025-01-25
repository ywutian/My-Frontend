import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranscriptStore } from '../../hooks/useTranscripts';
import NoteContent from './NoteContent';

export default function LiveNotes() {
  const notes = useTranscriptStore(state => state.notes);
  const updateNote = useTranscriptStore(state => state.updateNote);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // 添加日志来调试笔记数据
  useEffect(() => {
    console.log('LiveNotes received notes:', {
      notesCount: notes.length,
      notes: notes.map(note => ({
        id: note.id,
        timestamp: note.timestamp,
        contentPreview: note.content?.substring(0, 50) + '...'
      }))
    });
  }, [notes]);

  // 修改排序逻辑，最新的笔记在下面
  const sortedNotes = [...notes].sort((a, b) => a.timestamp - b.timestamp);

  // 处理开始编辑
  const handleStartEdit = (note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  // 处理保存编辑
  const handleSave = (id) => {
    if (editContent.trim() !== '') {
      updateNote(id, editContent);
    }
    setEditingId(null);
    setEditContent('');
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-[#f8faff] to-[#f2f6ff]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full overflow-y-auto p-4"
      >
        <div className="space-y-4">
          <AnimatePresence mode="sync">
            {Array.isArray(sortedNotes) && sortedNotes.length > 0 ? (
              sortedNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="group p-4 rounded-xl border border-white/60 bg-white/80 backdrop-blur-sm 
                           shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]
                           hover:shadow-[0_8px_16px_-4px_rgba(59,130,246,0.15)]
                           hover:border-blue-200/80 hover:bg-white/90
                           transition-all duration-300"
                >
                  <div className="text-sm text-gray-500 mb-2 font-medium tracking-wide">
                    {new Date(note.timestamp).toLocaleTimeString()}
                  </div>
                  <NoteContent
                    content={note.content}
                    isEditing={editingId === note.id}
                    editContent={editingId === note.id ? editContent : ''}
                    onEditChange={setEditContent}
                    onEdit={() => handleStartEdit(note)}
                    onSave={() => handleSave(note.id)}
                  />
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-[300px] mt-8 p-8 
                            bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-sm rounded-xl 
                            border border-white/60 hover:border-blue-200/80
                            shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]
                            hover:shadow-[0_8px_16px_-4px_rgba(59,130,246,0.15)]
                            transition-all duration-300">
                <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/10 
                                flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 text-blue-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Notes Yet</h3>
                <p className="text-sm text-gray-500 max-w-[280px]">
                  Start recording to generate your first note. Your notes will appear here.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
} 