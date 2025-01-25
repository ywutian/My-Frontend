import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiFolder,
  FiChevronDown,
  FiFileText,
  FiX,
  FiPlus,
  FiClock,
  FiInfo,
  FiCalendar,
  FiTag
} from 'react-icons/fi';
import { db } from '../db/db';
import {
  addNoteToFolder,
  removeFromFolder,
} from '../services/folderOperations';
import FolderSelector from '../components/Folder/FolderSelector';
import NoteCard from '../components/notes/NoteCard';

// 新增 EmptyState 组件
const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 text-center shadow-sm border border-gray-100">
    <div className="max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-blue-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h2>
      <p className="text-gray-500 mb-6">
        {message}
      </p>
      <button
        onClick={action.onClick}
        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 
                 transition-all duration-200 shadow-sm mx-auto"
      >
        {action.label}
      </button>
    </div>
  </div>
);

const Notes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showFolderSelector, setShowFolderSelector] = useState(false);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const allNotes = await db.notes.toArray();
      
      // Get folder names for notes that are in folders
      const notesWithFolderNames = await Promise.all(
        allNotes.map(async (note) => {
          if (note.folderId) {
            const folder = await db.folders.get(note.folderId);
            return { ...note, folderName: folder?.name };
          }
          return note;
        })
      );
      
      setNotes(notesWithFolderNames);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRename = async (noteId, newTitle) => {
    if (!newTitle) return;

    try {
      await db.notes.update(noteId, {
        title: newTitle,
        lastModified: new Date().toISOString(),
        syncStatus: 'pending',
      });
      await loadNotes(); // Reload notes to get updated data
    } catch (error) {
      console.error('Error renaming note:', error);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await db.notes.delete(noteId);
      setNotes(notes.filter((note) => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleAddToFolder = async (noteId) => {
    setSelectedNote(noteId);
    setShowFolderSelector(true);
  };

  const handleFolderSelect = async (folderId) => {
    try {
      await addNoteToFolder(selectedNote, folderId);
      await loadNotes(); // Reload notes to get updated folder information
    } catch (error) {
      console.error('Error adding note to folder:', error);
    } finally {
      setShowFolderSelector(false);
      setSelectedNote(null);
    }
  };

  const handleRemoveFromFolder = async (noteId) => {
    try {
      await removeFromFolder(noteId);
      await loadNotes(); // Reload notes to get updated folder information
    } catch (error) {
      console.error('Error removing from folder:', error);
    }
  };

  const handleNewNote = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const filteredNotes = notes
    .filter(
      (note) =>
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.lastModified || b.date) - new Date(a.lastModified || a.date);
      }
      return (a.title || '').localeCompare(b.title || '');
    });

  return (
    <div className="min-h-screen bg-gradient-custom overflow-x-hidden">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Stats Bar - 新增统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto">
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100
                        hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiFileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Notes</p>
                <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100
                        hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiFolder className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">In Folders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notes.filter(note => note.folderId).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100
                        hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <FiClock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-sm font-bold text-gray-900">
                  {notes.length > 0 
                    ? new Date(Math.max(...notes.map(n => new Date(n.lastModified)))).toLocaleDateString()
                    : 'No notes yet'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section - 增强版 */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-100 mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 
                            text-gray-400 group-hover:text-blue-500 transition-all duration-200">
                <FiSearch className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         group-hover:border-blue-200 transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 
                           text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-3 bg-white border border-gray-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           cursor-pointer min-w-[140px] pr-10 transition-all duration-200
                           hover:border-blue-200"
                >
                  <option value="date">Latest First</option>
                  <option value="title">By Title</option>
                </select>
                <FiChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 
                                      text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={handleNewNote}
                className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                         text-white rounded-lg hover:from-blue-600 hover:to-blue-700 
                         transition-all duration-200 shadow-sm active:scale-95"
              >
                <FiPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
          {searchTerm && (
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <FiInfo className="w-4 h-4 mr-2" />
              <span>
                Found {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} 
                matching "{searchTerm}"
              </span>
            </div>
          )}
        </div>

        {/* Notes Grid - 优化卡片布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto">
          {isLoading ? (
            [...Array(6)].map((_, index) => (
              <div key={index} 
                   className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm 
                            border border-gray-100 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-2/3"></div>
                </div>
              </div>
            ))
          ) : filteredNotes.length === 0 ? (
            <div className="col-span-full">
              <EmptyState 
                icon={searchTerm ? FiSearch : FiEdit2}
                title={searchTerm ? 'No notes found' : 'Create your first note'}
                message={searchTerm 
                  ? `No notes match your search "${searchTerm}"`
                  : 'Get started by creating a new note'}
                action={{
                  label: searchTerm ? 'Clear search' : 'Create note',
                  onClick: searchTerm ? () => setSearchTerm('') : handleNewNote
                }}
              />
            </div>
          ) : (
            filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => navigate(`/notes/${note.id}`)}
                onRename={(newTitle) => handleRename(note.id, newTitle)}
                onDelete={() => handleDelete(note.id)}
                onAddToFolder={() => handleAddToFolder(note.id)}
                onRemoveFromFolder={() => handleRemoveFromFolder(note.id)}
                className="bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-sm 
                         rounded-xl shadow-sm hover:shadow-md transition-all duration-200
                         transform hover:-translate-y-1 border border-gray-100
                         hover:border-blue-200"
              />
            ))
          )}
        </div>

        {/* Modals */}
        {showFolderSelector && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden">
            <FolderSelector
              onSelect={handleFolderSelect}
              onClose={() => {
                setShowFolderSelector(false);
                setSelectedNote(null);
              }}
              className="w-full max-w-lg mx-4 bg-white rounded-xl shadow-lg"
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Notes;
