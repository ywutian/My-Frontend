import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { videoService } from '../../services/videoService';
import Transcription from './Transcription';

function VideoDetail() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadVideo = useCallback(async () => {
    try {
      setLoading(true);
      const data = await videoService.getVideoById(id);
      setVideo(data);
    } catch (err) {
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
  if (!video) return <div className="text-center py-8">Video not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">{video.title}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="aspect-w-16 aspect-h-9 mb-4">
            <video
              controls
              className="w-full h-full rounded-lg"
              src={video.url}
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <h2 className="font-semibold mb-2">Details</h2>
            <p className="text-gray-600 text-sm mb-2">{video.description}</p>
            <div className="text-gray-500 text-sm">
              Uploaded on {new Date(video.created_at).toLocaleDateString()}
            </div>
            <div className="mt-2">
              Status: <span className="font-medium">{video.status}</span>
            </div>
          </div>
        </div>
        <div>
          <Transcription videoId={id} />
        </div>
      </div>
    </div>
  );
}

export default VideoDetail; 