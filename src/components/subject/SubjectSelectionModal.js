import { _motion, _AnimatePresence } from 'framer-motion';

function SubjectSelectionModal({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  const subjects = [
    { id: 'math', name: 'Mathematics', icon: '📐' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'history', name: 'History', icon: '📚' },
    { id: 'english', name: 'English', icon: '✏️' },
    { id: 'computer', name: 'Computer Science', icon: '💻' },
    { id: 'physics', name: 'Physics', icon: '⚡' },
    { id: 'chemistry', name: 'Chemistry', icon: '🧪' },
    { id: 'biology', name: 'Biology', icon: '🧬' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl relative z-10 mx-4">
        <div className="p-6">
          {/* Header */}
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Select Subject
          </h3>

          {/* Subject Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => onSelect(subject.id)}
                className="flex items-center p-4 text-left rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <span className="text-2xl mr-3">{subject.icon}</span>
                <span className="font-medium text-gray-900">{subject.name}</span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubjectSelectionModal; 