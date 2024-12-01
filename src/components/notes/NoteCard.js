import { FiClock } from 'react-icons/fi';
import { formatDistanceToNow, parseISO } from 'date-fns';

function NoteCard({ note, onClick }) {
  const formatDate = (dateString) => {
    try {
      // 首先尝试将日期字符串解析为 Date 对象
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      // 如果解析失败，直接返回原始日期字符串
      return dateString;
    }
  };

  return (
    <div 
      className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      <h3 className="font-medium text-gray-800 mb-2">{note.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{note.preview}</p>
      <div className="flex items-center text-gray-400 text-xs">
        <FiClock className="w-4 h-4 mr-1" />
        <span>{formatDate(note.date)}</span>
      </div>
    </div>
  );
}

export default NoteCard; 