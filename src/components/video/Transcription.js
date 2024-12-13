import { useState, useEffect, useRef } from 'react';
import { transcriptionService } from '../../services/transcriptionService';

function Transcription({ videoId }) {
  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const loadTranscription = async () => {
    try {
      setLoading(true);
      const data = await transcriptionService.getTranscription(videoId);
      setTranscription(data);
      if (data.status === 'completed') {
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError('Failed to load transcription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTranscription();
    // Set up polling if transcription is processing
    intervalRef.current = setInterval(loadTranscription, 10000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadTranscription]);

  if (loading)
    return <div className="text-center py-4">Loading transcription...</div>;
  if (error)
    return <div className="text-center py-4 text-red-600">{error}</div>;
  if (!transcription)
    return <div className="text-center py-4">No transcription available</div>;

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h2 className="font-semibold mb-4">Transcription</h2>
      {transcription.status === 'processing' ? (
        <div className="text-center py-4">
          <p>Transcription in progress...</p>
          <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {transcription.segments.map((segment, index) => (
            <div key={index} className="p-2 hover:bg-gray-50">
              <div className="text-gray-500 text-sm mb-1">
                {formatTimestamp(segment.start)} -{' '}
                {formatTimestamp(segment.end)}
              </div>
              <p>{segment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default Transcription;
