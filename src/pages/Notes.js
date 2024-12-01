import { useState } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi';
import Sidebar from '../components/layout/Sidebar';

const Notes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: 'Untitled Note',
      date: '11/30/2024',
      subject: 'No Subject',
      content: 'Note content here...'
    }
  ]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRename = (noteId, newTitle) => {
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, title: newTitle } : note
    ));
  };

  const handleDelete = (noteId) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  const handleAddToFolder = (noteId, folderId) => {
    // Implementation for adding to folder
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6">
          {/* Header and Search */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">All Notes <span className="text-sm text-gray-500 ml-2">{notes.length} notes</span></h1>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <select
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="subject">Subject</option>
            </select>
          </div>

          {/* Notes List */}
          <div className="space-y-2">
            {notes.map(note => (
              <div
                key={note.id}
                className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    📝
                  </div>
                  <div>
                    <h3 className="font-medium">{note.title}</h3>
                    <div className="text-sm text-gray-500">
                      {note.date} • {note.subject}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons - Only visible on hover */}
                <div className="hidden group-hover:flex items-center gap-2">
                  <button
                    onClick={() => handleRename(note.id, prompt('Enter new title:', note.title))}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <FiEdit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <FiTrash2 className="w-4 h-4 text-red-500" />
                  </button>
                  <button
                    onClick={() => handleAddToFolder(note.id)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <FiFolder className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes; 