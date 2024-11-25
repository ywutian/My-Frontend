import { useState, useEffect } from 'react';
import VideoUpload from '../components/video/VideoUpload';
import VideoList from '../components/video/VideoList';
import { videoService } from '../services/videoService';
import SubjectSelectionModal from '../components/subject/SubjectSelectionModal';
import ErrorBoundary from '../components/common/ErrorBoundary';
import LiveTranscription from '../components/transcription/LiveTranscription';

function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInput, setSelectedInput] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showLiveTranscription, setShowLiveTranscription] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await videoService.getVideos();
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    loadVideos();
  };

  const handleSubjectSelect = (subjectId) => {
    try {
      console.log('Starting subject selection for:', subjectId);
      setShowSubjectModal(false);
      setSelectedInput('audio');
    } catch (error) {
      console.error('Error in handleSubjectSelect:', error);
    }
  };

  const handleInputSelect = (optionId) => {
    console.log('Input selected:', optionId);
    if (optionId === 'audio') {
      setShowSubjectModal(true);
    } else if (optionId === 'lecture') {
      setShowLiveTranscription(true);
      setSelectedInput('lecture');
    } else {
      setSelectedInput(optionId);
    }
  };

  const inputOptions = [
    {
      id: 'audio',
      icon: '🎙️',
      title: 'Record or Upload Audio',
      subtitle: 'Upload an audio file',
      bgColor: 'from-blue-500 to-blue-600'
    },
    {
      id: 'lecture',
      icon: '🎤',
      title: 'Record Live Lecture',
      subtitle: 'Real time transcript',
      bgColor: 'from-purple-500 to-purple-600',
      isNew: true
    },
    {
      id: 'youtube',
      icon: '▶️',
      title: 'YouTube Video',
      subtitle: 'Paste a YouTube link',
      bgColor: 'from-red-500 to-red-600'
    },
    {
      id: 'document',
      icon: '📄',
      title: 'Document Upload',
      subtitle: 'PDF,PPT,WORD,EXCEL,CSV,TXT',
      bgColor: 'from-green-500 to-green-600'
    }
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-[#1e3d58] via-[#057dcd] to-[#43b0f1]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
            {!showLiveTranscription ? (
              <>
                <h1 className="text-2xl font-bold mb-6 text-[#1e3d58]">Dashboard</h1>
                
                {/* Input Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {inputOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleInputSelect(option.id)}
                      className={`relative p-6 rounded-lg bg-gradient-to-r ${option.bgColor} text-white hover:shadow-lg transition-all duration-200 text-left`}
                    >
                      {option.isNew && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <h3 className="font-semibold mb-1">{option.title}</h3>
                      <p className="text-sm text-white/80">{option.subtitle}</p>
                    </button>
                  ))}
                </div>

                {/* 音频上传部分 */}
                {selectedInput === 'audio' && (
                  <div className="mt-8">
                    <VideoUpload onUploadSuccess={handleUploadSuccess} />
                  </div>
                )}

                {/* 视频列表部分 */}
                {loading ? (
                  <div className="text-[#1e3d58] text-center py-8">Loading...</div>
                ) : (
                  <div className="mt-8">
                    <VideoList videos={videos} />
                  </div>
                )}
              </>
            ) : (
              <LiveTranscription onClose={() => setShowLiveTranscription(false)} />
            )}
          </div>
        </div>

        <SubjectSelectionModal
          isOpen={showSubjectModal}
          onClose={() => setShowSubjectModal(false)}
          onSelect={handleSubjectSelect}
        />
      </div>
    </ErrorBoundary>
  );
}

export default Dashboard; 