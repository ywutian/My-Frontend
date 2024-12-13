import React, { useState } from 'react';
import NoteCard from '../notes/NoteCard';
import CreateNoteModal from '../notes/CreateNoteModal';

function NoteView() {
  const [notes, setNotes] = useState([]); // 笔记列表
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制模态框

  const handleCreateNote = async (formData) => {
    // 模拟创建笔记逻辑
    const newNote = {
      id: Date.now(),
      title: formData.get('title') || 'Untitled Note',
      preview: 'This is a preview of the note content.',
      date: new Date().toISOString(),
    };
    setNotes((prevNotes) => [newNote, ...prevNotes]);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">笔记模式</h1>

      {/* 创建笔记按钮 */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
      >
        创建笔记
      </button>

      {/* 笔记列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.length > 0 ? (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => alert(`Viewing note: ${note.title}`)} // 示例点击逻辑
            />
          ))
        ) : (
          <p className="text-gray-500">暂无笔记</p>
        )}
      </div>

      {/* 创建笔记模态框 */}
      <CreateNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateNote}
      />
    </div>
  );
}

export default NoteView;
