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
    <div className="h-full overflow-auto bg-gray-50">
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
                  className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm"
                >
                  <div className="text-sm text-gray-500 mb-2">
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
              <div className="text-center text-gray-500 mt-8">
                No notes generated yet
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
} 