import { FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

function NoteCard({ note }) {
  return (
    <div className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
      <h3 className="font-medium text-gray-800 mb-2">{note.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{note.content}</p>
      <div className="flex items-center text-gray-400 text-xs">
        <FiClock className="w-4 h-4 mr-1" />
        <span>{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</span>
      </div>
    </div>
  );
}

export default NoteCard; 