import { useState } from 'react';
import { Link } from 'react-router-dom';
import { videoService } from '../../services/videoService';
import ConfirmModal from '../common/ConfirmModal';
import { useToast } from '../../hooks/useToast';

function VideoList({ videos, onVideoDelete }) {
  const [deleteId, setDeleteId] = useState(null);
  const { showToast } = useToast();

  const handleDelete = async () => {
    try {
      await videoService.deleteVideo(deleteId);
      onVideoDelete(deleteId);
      showToast('Video deleted successfully');
    } catch (error) {
      showToast('Failed to delete video', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  if (!videos.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No videos uploaded yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-[#e8eef1] rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <Link to={`/video/${video.id}`}>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{video.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{video.description}</p>
                <div className="text-gray-500 text-xs">
                  Uploaded on {new Date(video.created_at).toLocaleDateString()}
                </div>
                <div className="mt-2 text-sm">
                  Status: <span className="font-medium">{video.status}</span>
                </div>
              </div>
            </Link>
            <div className="px-4 pb-4">
              <button
                onClick={() => setDeleteId(video.id)}
                className="text-[#057dcd] hover:text-[#43b0f1] text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone."
      />
    </>
  );
}

export default VideoList; 