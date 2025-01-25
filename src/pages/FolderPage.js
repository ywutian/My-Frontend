import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../db/db';
import PropTypes from 'prop-types';
import NoteCard from '../components/notes/NoteCard';

function FolderPage() {
  const { folderId } = useParams();
  const [folder, setFolder] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadFolderData = async () => {
      try {
        if (!folderId) {
          setError('No folder ID provided');
          return;
        }

        const folderData = await db.folders.get(parseInt(folderId));
        if (!mounted) return;
        
        if (!folderData) {
          setError('Folder not found');
          return;
        }

        const folderNotes = await db.notes
          .where('folderId')
          .equals(parseInt(folderId))
          .toArray();

        if (!mounted) return;
        setFolder(folderData);
        setNotes(folderNotes);
      } catch (err) {
        if (!mounted) return;
        setError(`Failed to load folder data: ${err.message}`);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    setLoading(true);
    loadFolderData();

    return () => {
      mounted = false;
    };
  }, [folderId]);

  const handleCreateNote = async () => {
    setIsCreatingNote(true);
    try {
      // Add note creation logic here
    } catch (err) {
      setError(`Failed to create note: ${err.message}`);
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleNoteClick = (note) => {
    // Add navigation logic here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-custom">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          <div className="ml-2 mt-4 text-gray-600">Loading folder data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-custom p-4">
        <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-2 text-red-600">Error</h2>
          <p className="text-gray-700">{error}</p>
          <p className="mt-2 text-sm text-gray-500">Folder ID: {folderId}</p>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-gradient-custom p-4">
        <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-2">Folder Not Found</h2>
          <p className="text-gray-600">Could not find folder with ID: {folderId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-custom custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header with Breadcrumb and Stats */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6
                      border border-white/30 transition-all duration-300
                      hover:bg-white/25 hover:border-white/40 hover:shadow-lg
                      group">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-sm text-gray-600/80 mb-2">
                <span className="hover:text-gray-800 cursor-pointer transition-colors
                             flex items-center gap-1">
                  <span className="w-4 h-4">📁</span>
                  <span>Folders</span>
                </span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-800 font-medium flex items-center gap-1">
                  <span className="w-4 h-4">📂</span>
                  {folder?.name || 'Loading...'}
                </span>
              </div>
              
              {/* Title and Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <h1 className="text-2xl font-semibold text-gray-800 group-hover:text-gray-900
                             transition-colors duration-300">
                  {folder?.name || 'Loading...'}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full
                               bg-blue-50/50 border border-blue-100/50">
                    <span className="w-2 h-2 rounded-full bg-blue-400/60 animate-pulse"></span>
                    {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full
                               bg-green-50/50 border border-green-100/50">
                    <span className="w-2 h-2 rounded-full bg-green-400/60"></span>
                    Updated {new Date(folder?.lastModified || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreatingNote(true)}
                className="group relative px-5 py-2.5 bg-white/30 text-gray-700 
                         border border-white/40 rounded-xl overflow-hidden
                         hover:bg-white/40 hover:border-white/50 hover:shadow-md 
                         active:scale-95 disabled:opacity-50 
                         flex items-center gap-2 transition-all duration-200"
                disabled={isCreatingNote}
              >
                <span className="absolute inset-0 animate-shimmer opacity-0 
                             group-hover:opacity-100"></span>
                <span className="transform group-hover:scale-110 transition-transform duration-200">
                  {isCreatingNote ? '✍️' : '✨'}
                </span>
                <span className="font-medium relative z-10">
                  {isCreatingNote ? 'Creating...' : 'New Note'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Content with Animation */}
        <div className="transition-all duration-500 ease-in-out">
          {notes.length === 0 ? (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-12 text-center
                          border border-white/30 hover:bg-white/25 
                          transition-all duration-300">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6 animate-float">📝</div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  This folder is empty
                </h3>
                <p className="text-gray-600 mb-8">
                  Start organizing your thoughts by creating your first note in this folder.
                </p>
                <button 
                  className="group relative px-6 py-3 bg-white/30 text-gray-700 
                           border border-white/40 rounded-xl overflow-hidden
                           hover:bg-white/40 hover:border-white/50 
                           hover:shadow-md active:scale-95 disabled:opacity-50 
                           flex items-center gap-3 mx-auto transition-all duration-200"
                  onClick={handleCreateNote}
                  disabled={isCreatingNote}
                >
                  <span className="absolute inset-0 animate-shimmer opacity-0 
                               group-hover:opacity-100"></span>
                  <span className="transform group-hover:scale-110 transition-transform duration-200">
                    {isCreatingNote ? '✍️' : '✨'}
                  </span>
                  <span className="font-medium relative z-10">
                    {isCreatingNote ? 'Creating...' : 'Create First Note'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note, index) => (
                <div 
                  key={note.id} 
                  className="transition-all duration-300 hover:transform hover:scale-[1.02]
                           hover:shadow-lg group"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    opacity: 0,
                    animation: 'fadeIn 0.5s ease-out forwards'
                  }}
                >
                  <NoteCard 
                    note={note}
                    onClick={() => handleNoteClick(note)}
                    onRename={async (newTitle) => {
                      try {
                        await db.notes.update(note.id, {
                          title: newTitle,
                          lastModified: new Date().toISOString(),
                          syncStatus: 'pending'
                        });
                        const updatedNotes = await db.notes
                          .where('folderId')
                          .equals(parseInt(folderId))
                          .toArray();
                        setNotes(updatedNotes);
                      } catch (error) {
                        console.error('Error renaming note:', error);
                        alert('Failed to rename note');
                      }
                    }}
                    onDelete={async () => {
                      if (window.confirm('Are you sure you want to delete this note?')) {
                        try {
                          await db.notes.delete(note.id);
                          setNotes(notes.filter(n => n.id !== note.id));
                        } catch (error) {
                          console.error('Error deleting note:', error);
                          alert('Failed to delete note');
                        }
                      }
                    }}
                    onAddToFolder={() => {}} // Already in a folder
                    onRemoveFromFolder={async () => {
                      try {
                        await db.notes.update(note.id, { folderId: null });
                        setNotes(notes.filter(n => n.id !== note.id));
                      } catch (error) {
                        console.error('Error removing from folder:', error);
                        alert('Failed to remove from folder');
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

FolderPage.propTypes = {
  folderId: PropTypes.string.isRequired,
};

export default FolderPage;
