import { useState, useRef, useEffect } from 'react';
import { FiClock, FiMoreVertical, FiEdit2, FiFolder, FiTrash2, FiFolderMinus } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { db } from '../../db/db';

function NoteCard({ note, onClick, onRename, onDelete, onAddToFolder, onRemoveFromFolder }) {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };

  const handleActionClick = async (e, action, type) => {
    e.stopPropagation();
    setShowActions(false);
    
    try {
      if (type === 'rename') {
        const newTitle = prompt('Enter new title:', note.title);
        if (newTitle && newTitle !== note.title) {
          await db.notes.update(note.id, {
            title: newTitle,
            lastModified: new Date().toISOString(),
            syncStatus: 'pending'
          });
          
          if (typeof onRename === 'function') {
            onRename(newTitle);
          } else {
            window.location.reload();
          }
        }
      } 
      else if (type === 'delete') {
        try {
          await db.notes.delete(note.id);
          window.location.reload();
        } catch (error) {
          console.error('Error deleting note:', error);
          alert('Failed to delete note');
        }
      } 
      else {
        if (typeof action === 'function') {
          action();
        }
      }
    } catch (error) {
      console.error(`Error in ${type} action:`, error);
      alert(`Failed to ${type} note: ${error.message}`);
    }
  };

  return (
    <div 
      className="group bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 
                 hover:shadow-sm transition-all duration-200 cursor-pointer relative"
      onClick={onClick}
    >
      {/* Actions Menu */}
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiMoreVertical className="w-4 h-4 text-gray-500" />
        </button>

        {showActions && (
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 
                          rounded-lg shadow-sm py-1">
            <button
              onClick={(e) => handleActionClick(e, null, 'rename')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <FiEdit2 className="w-4 h-4" />
              Rename
            </button>

            {!note.folderId ? (
              <button
                onClick={(e) => handleActionClick(e, null, 'addToFolder')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <FiFolder className="w-4 h-4" />
                Add to Folder
              </button>
            ) : (
              <button
                onClick={(e) => handleActionClick(e, null, 'removeFromFolder')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <FiFolderMinus className="w-4 h-4" />
                Remove from Folder
              </button>
            )}
            
            <button
              onClick={(e) => handleActionClick(e, null, 'delete')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <FiTrash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Note Content */}
      <h3 className="font-medium text-gray-800 mb-2 pr-8 truncate">
        {note.title || 'Untitled Note'}
      </h3>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
        {note.preview || note.content || 'No content'}
      </p>

      {/* Note Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center group-hover:text-gray-600 transition-colors">
          <FiClock className="w-3.5 h-3.5 mr-1" />
          <span>{formatDate(note.date || note.lastModified)}</span>
        </div>
        
        {note.folderId && (
          <div className="flex items-center text-gray-400">
            <FiFolder className="w-3.5 h-3.5 mr-1" />
            <span>{note.folderName || 'Folder'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

NoteCard.propTypes = {
  note: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string,
    preview: PropTypes.string,
    content: PropTypes.string,
    date: PropTypes.string,
    lastModified: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    folderId: PropTypes.number,
    folderName: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddToFolder: PropTypes.func.isRequired,
  onRemoveFromFolder: PropTypes.func.isRequired,
};

export default NoteCard; 