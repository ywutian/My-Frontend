import { useState } from 'react';
import Modal from '../common/Modal';
import { youtubeService } from '../../services/youtubeService';

function YouTubeLinkModal({ isOpen, onClose, onSubmit }) {
  const [youtubeLink, setYoutubeLink] = useState('');
  const [title, setTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const result = await youtubeService.processYouTubeVideo(
        youtubeLink, 
        title
      );
      onSubmit(result);
      onClose();
    } catch (error) {
      console.error('Error processing YouTube video:', error);
      // TODO: 显示错误提示
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-3 bg-white rounded-lg">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Add YouTube Video</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              YouTube Link
            </label>
            <input
              type="url"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 
                focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-300
                hover:border-gray-300 transition-colors"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50
                focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-300
                hover:border-gray-300 transition-colors"
              placeholder="Enter note title"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100
                rounded-lg transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 
                rounded-lg hover:bg-gray-100 hover:border-gray-300 
                focus:outline-none focus:ring-1 focus:ring-gray-200
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default YouTubeLinkModal; 