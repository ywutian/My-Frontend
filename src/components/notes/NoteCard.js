import { FiClock, FiEdit2 } from 'react-icons/fi';
import { formatDistanceToNow, parseISO } from 'date-fns';
import PropTypes from 'prop-types';

function NoteCard({ note, onClick }) {
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div 
      className="group bg-white p-4 rounded-lg border hover:border-purple-300 hover:shadow-lg 
                 transition-all duration-200 cursor-pointer relative"
      onClick={() => onClick(note)}
    >
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <FiEdit2 className="w-4 h-4 text-purple-500" />
      </div>

      <h3 className="font-medium text-gray-800 mb-2 pr-8 truncate">
        {note.title || 'Untitled Note'}
      </h3>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
        {note.preview || note.content || 'No content'}
      </p>

      <div className="flex items-center text-gray-400 text-xs group-hover:text-purple-500 transition-colors">
        <FiClock className="w-3.5 h-3.5 mr-1" />
        <span>{formatDate(note.date || note.lastModified)}</span>
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
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default NoteCard; 