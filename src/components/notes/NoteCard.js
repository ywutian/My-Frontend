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
      else if (type === 'addToFolder') {
        if (typeof onAddToFolder === 'function') {
          const folderId = await onAddToFolder();
          if (folderId) {
            await db.notes.update(note.id, {
              folderId,
              lastModified: new Date().toISOString(),
              syncStatus: 'pending'
            });
            
            // 触发一个自定义事件来通知 Sidebar 更新
            const event = new CustomEvent('folderUpdate');
            window.dispatchEvent(event);
            
            // 如果仍需要刷新页面，可以保留这行
            window.location.reload();
          }
        }
      }
      else if (type === 'removeFromFolder') {
        if (typeof onRemoveFromFolder === 'function') {
          await db.notes.update(note.id, {
            folderId: null,
            lastModified: new Date().toISOString(),
            syncStatus: 'pending'
          });
          onRemoveFromFolder();
          window.location.reload();
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
      className="group bg-white p-4 rounded-xl border border-gray-200/80 
                 hover:border-blue-200/80 hover:shadow-lg hover:shadow-blue-100/50
                 transition-all duration-300 cursor-pointer relative
                 backdrop-blur-sm backdrop-filter
                 w-full h-[200px] flex flex-col"
      onClick={onClick}
    >
      {/* Actions Menu Button */}
      <div className="absolute right-2 top-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className="p-1.5 hover:bg-gray-100/80 rounded-lg transition-colors
                     backdrop-blur-sm backdrop-filter"
        >
          <FiMoreVertical className="w-4 h-4 text-gray-500" />
        </button>

        {/* Actions Dropdown */}
        {showActions && (
          <div ref={actionsRef}
               className="absolute right-0 mt-1 w-48 bg-white/95 border border-gray-200 
                        rounded-xl shadow-lg py-1 backdrop-blur-sm backdrop-filter
                        transform origin-top-right transition-all duration-200 z-30"
          >
            <button
              onClick={(e) => handleActionClick(e, null, 'rename')}
              className="w-full px-4 py-2 text-left hover:bg-blue-50/50 flex items-center gap-2
                         text-gray-700 transition-colors"
            >
              <FiEdit2 className="w-4 h-4" />
              Rename
            </button>

            {!note.folderId ? (
              <button
                onClick={(e) => handleActionClick(e, null, 'addToFolder')}
                className="w-full px-4 py-2 text-left hover:bg-blue-50/50 flex items-center gap-2
                           text-gray-700 transition-colors"
              >
                <FiFolder className="w-4 h-4" />
                Add to Folder
              </button>
            ) : (
              <button
                onClick={(e) => handleActionClick(e, null, 'removeFromFolder')}
                className="w-full px-4 py-2 text-left hover:bg-blue-50/50 flex items-center gap-2
                           text-gray-700 transition-colors"
              >
                <FiFolderMinus className="w-4 h-4" />
                Remove from Folder
              </button>
            )}
            
            <button
              onClick={(e) => handleActionClick(e, null, 'delete')}
              className="w-full px-4 py-2 text-left hover:bg-red-50/50 flex items-center gap-2
                         text-red-600 transition-colors"
            >
              <FiTrash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Note Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Note Title */}
        <h3 className="font-medium text-gray-800 mb-2 pr-8 truncate text-base">
          {note.title || 'Untitled Note'}
        </h3>

        {/* Note Preview */}
        <div 
          className="text-gray-500 text-sm mb-3 flex-1 overflow-hidden
                     prose prose-sm max-w-none line-clamp-4
                     [&>*]:text-sm [&>*]:my-0 [&>*]:leading-normal
                     [&_h1]:text-base [&_h1]:font-medium [&_h1]:text-gray-800 [&_h1]:my-1
                     [&_h2]:text-sm [&_h2]:font-medium [&_h2]:text-gray-700 [&_h2]:my-1
                     [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-gray-700 [&_h3]:my-0.5
                     [&_p]:mb-0.5 [&_p]:line-clamp-2
                     [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-0.5
                     [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-0.5
                     [&_li]:my-0
                     [&_em]:text-gray-600 [&_em]:font-normal [&_em]:not-italic
                     [&_strong]:font-medium [&_strong]:text-gray-700"
          dangerouslySetInnerHTML={{
            __html: note.preview || note.content || '<p>No content</p>'
          }}
        />
      </div>

      {/* Note Footer */}
      <div className="flex items-center justify-between text-xs pt-2 
                      border-t border-gray-100">
        <div className="flex items-center text-gray-400 group-hover:text-gray-600 
                      transition-colors">
          <FiClock className="w-3 h-3 mr-1" />
          <span>{formatDate(note.date || note.lastModified)}</span>
        </div>
        
        {note.folderId && (
          <div className="flex items-center px-1.5 py-0.5 bg-gray-50/80 rounded-full
                         text-gray-500 group-hover:bg-blue-50/80 transition-colors">
            <FiFolder className="w-3 h-3 mr-1" />
            <span className="truncate max-w-[80px]">
              {note.folderName || 'Folder'}
            </span>
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