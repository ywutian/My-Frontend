import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiSearch, FiFolder } from 'react-icons/fi';
import NoteCard from '../components/notes/NoteCard';

function FolderPage() {
  const { id } = useParams();
  const [folder, setFolder] = useState(null);
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 替换为实际的 API 调用
    const fetchFolderData = async () => {
      try {
        setLoading(true);
        // 模拟 API 调用
        const folderData = {
          id: id,
          name: 'Study Notes',
          notes: [
            { id: 1, title: 'React Hooks', content: 'Notes about React Hooks...', createdAt: new Date() },
            { id: 2, title: 'TypeScript Basics', content: 'Learning TypeScript...', createdAt: new Date() },
          ]
        };
        
        setFolder(folderData);
        setNotes(folderData.notes);
      } catch (error) {
        console.error('Error fetching folder:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFolderData();
  }, [id]);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Folder Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <FiFolder className="h-6 w-6 text-purple-600 mr-2" />
          <h1 className="text-2xl font-semibold text-gray-800">{folder?.name}</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map(note => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>

      {/* Empty State */}
      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No notes found in this folder.</p>
        </div>
      )}
    </div>
  );
}

export default FolderPage; 