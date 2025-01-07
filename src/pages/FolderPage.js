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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <div className="ml-2">Loading folder data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <p className="mt-2 text-sm">Folder ID: {folderId}</p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">Folder Not Found</h2>
        <p>Could not find folder with ID: {folderId}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{folder.name}</h1>
      
      {notes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No notes in this folder</p>
          <button 
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            onClick={handleCreateNote}
            disabled={isCreatingNote}
          >
            {isCreatingNote ? 'Creating...' : 'Create New Note'}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map(note => (
            <NoteCard 
              key={note.id}
              note={note}
              onClick={() => handleNoteClick(note)}
              onRename={async (newTitle) => {
                try {
                  await db.notes.update(note.id, {
                    title: newTitle,
                    lastModified: new Date().toISOString(),
                    syncStatus: 'pending'
                  });
                  // Refresh notes list
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
          ))}
        </div>
      )}
    </div>
  );
}

FolderPage.propTypes = {
  folderId: PropTypes.string.isRequired,
};

export default FolderPage;
