import { useState, useEffect, useCallback } from 'react';
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

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-4 border-b">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          All Notes
          <span className="text-sm text-gray-500 font-normal px-2 py-1 bg-gray-100 rounded-full">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>
        </h1>
      </div>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                     hover:bg-blue-700 transition-colors flex items-center gap-2"
          onClick={handleNewNote}
        >
          <FiEdit2 className="w-4 h-4" />
          New Note
        </button>
      </div>
    </div>
  );

  const renderSearchBar = () => (
    <div className="flex gap-4 mb-6 sticky top-16 bg-white z-10 py-4">
      <div className="flex-1 relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg 
                    focus:outline-none focus:border-blue-500 focus:ring-1 
                    focus:ring-blue-500 transition-colors"
        />
      </div>
      <select
        className="border border-gray-200 rounded-lg px-4 py-2.5 
                   focus:outline-none focus:border-blue-500 focus:ring-1 
                   focus:ring-blue-500 bg-white cursor-pointer 
                   hover:bg-gray-50 transition-colors min-w-[120px]"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <option value="date">Latest</option>
        <option value="title">Title</option>
      </select>
    </div>
  );

  const NoteSkeleton = () => (
    <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  );

  const EmptyState = ({ searchTerm, onNewNote }) => (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <div className="text-gray-400 mb-4">
        {searchTerm ? (
          <>
            <FiSearch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No notes match "{searchTerm}"</p>
            <p className="text-sm">Try searching with different keywords</p>
          </>
        ) : (
          <>
            <FiEdit2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No notes yet</p>
            <p className="text-sm">Create your first note to get started</p>
          </>
        )}
      </div>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
        onClick={onNewNote}
      >
        <FiEdit2 className="w-4 h-4" />
        {searchTerm ? 'Create new note' : 'Create your first note'}
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white w-full p-6">
        <div className="max-w-7xl mx-auto">
          {renderHeader()}
          {renderSearchBar()}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <NoteSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white w-full">
      <main className="flex-1 h-full">
        <div className="p-6 h-full">
          <div className="max-w-7xl mx-auto">
            {renderHeader()}
            {renderSearchBar()}

            {filteredNotes.length === 0 ? (
              <EmptyState searchTerm={searchTerm} onNewNote={handleNewNote} />
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
                    className="hover:shadow-lg transition-shadow duration-200 
                               hover:border-gray-300 group"
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
