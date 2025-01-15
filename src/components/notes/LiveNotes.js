import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveNotes({ content, notes = [] }) {
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

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full overflow-y-auto p-4"
      >
        <div className="space-y-4">
          <AnimatePresence mode="sync">
            {Array.isArray(notes) && notes.length > 0 ? (
              notes.map((note) => (
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
                  <div className="prose prose-sm max-w-none">
                    {note.content?.split('\n').map((line, index) => {
                      if (!line.trim()) return null;
                      if (line.startsWith('# ')) {
                        return <h1 key={index} className="text-xl font-bold mb-4">{line.slice(2)}</h1>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={index} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h2>;
                      }
                      if (line.startsWith('- ')) {
                        return <li key={index} className="ml-4 mb-1">{line.slice(2)}</li>;
                      }
                      return <p key={index} className="mb-2">{line}</p>;
                    })}
                  </div>
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