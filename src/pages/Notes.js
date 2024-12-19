import { useState, useEffect } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi';
import { db } from '../db/db';
import {
  addNoteToFolder,
  removeFromFolder,
} from '../services/folderOperations';
import FolderSelector from '../components/Folder/FolderSelector';
import NoteCard from '../components/notes/NoteCard';
import { useNavigate } from 'react-router-dom';

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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

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

  const handleNewNote = () => {
    navigate('/dashboard');
  };

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

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800">
        All Notes
        <span className="text-sm text-gray-500 ml-2 font-normal">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>
      </h1>
      <button
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                   transition-colors flex items-center gap-2"
        onClick={handleNewNote}
      >
        <FiEdit2 className="w-4 h-4" />
        New Note
      </button>
    </div>
  );

  const renderSearchBar = () => (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex-1 relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search notes..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 
                     focus:ring-purple-500 bg-white transition-shadow hover:shadow-sm"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      <select
        className="border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 
                   bg-white cursor-pointer hover:shadow-sm transition-shadow"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <option value="date">Latest</option>
        <option value="subject">Subject</option>
        <option value="title">Title</option>
      </select>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading notes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <main className="flex-1 h-full">
        <div className="p-6 h-full">
          <div className="max-w-7xl mx-auto">
            {renderHeader()}
            {renderSearchBar()}

            {filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FiSearch className="w-12 h-12 mx-auto mb-4" />
                  {searchTerm ? 'No notes match your search' : 'No notes yet'}
                </div>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                             transition-colors inline-flex items-center gap-2"
                  onClick={handleNewNote}
                >
                  <FiEdit2 className="w-4 h-4" />
                  Create your first note
                </button>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => navigate(`/notes/${note.id}`)}
                    onRename={(newTitle) => handleRename(note.id, newTitle)}
                    onDelete={() => handleDelete(note.id)}
                    onAddToFolder={() => handleAddToFolder(note.id)}
                    onRemoveFromFolder={() => handleRemoveFromFolder(note.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {showFolderSelector && (
            <FolderSelector
              onSelect={handleFolderSelect}
              onClose={() => {
                setShowFolderSelector(false);
                setSelectedNote(null);
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Notes;
