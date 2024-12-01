import { useState } from 'react';
import VideoUpload from '../components/video/VideoUpload';
import SubjectSelectionModal from '../components/subject/SubjectSelectionModal';
import ErrorBoundary from '../components/common/ErrorBoundary';
import LiveTranscription from '../components/transcription/LiveTranscription';
import SettingsModal from '../components/settings/SettingsModal';
import NoteCard from '../components/notes/NoteCard';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
function Dashboard() {
  const [selectedInput, setSelectedInput] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showLiveTranscription, setShowLiveTranscription] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

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
      bgColor: 'bg-blue-500'
    },
    {
      id: 'lecture',
      icon: '🎤',
      title: 'Record Live Lecture',
      subtitle: 'Real time transcript',
      bgColor: 'bg-purple-500',
      isNew: true
    },
    {
      id: 'youtube',
      icon: '▶️',
      title: 'YouTube Video',
      subtitle: 'Paste a YouTube link',
      bgColor: 'bg-red-500'
    },
    {
      id: 'document',
      icon: '📄',
      title: 'Document Upload',
      subtitle: 'PDF,PPT,WORD,EXCEL,CSV,TXT',
      bgColor: 'bg-green-500'
    }
  ];

  const recentNotes = [
    {
      id: 1,
      title: "Meeting Notes - Product Review",
      date: "2024-03-20",
      preview: "Discussed new feature requirements and timeline...",
      subject: "Work"
    },
    {
      id: 2,
      title: "Physics Study Notes",
      date: "2024-03-19",
      preview: "Chapter 5: Quantum Mechanics fundamentals...",
      subject: "Study Notes"
    },
    {
      id: 3,
      title: "Project Planning",
      date: "2024-03-18",
      preview: "Q2 objectives and key milestones...",
      subject: "Work"
    }
  ];

  return (
    <ErrorBoundary>
      <div className="p-6">
        <div className={`rounded-lg shadow-xl p-6 ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800 text-white'
        }`}>
          {!showLiveTranscription ? (
            <>
              <h1 className="text-2xl font-bold mb-6 text-[#1e3d58]">Dashboard</h1>
              
              {/* Input Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {inputOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleInputSelect(option.id)}
                    className={`relative p-6 rounded-lg ${option.bgColor} text-white hover:shadow-lg transition-all duration-200 text-left`}
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

              {/* Recent Notes Section */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-[#1e3d58]">Recent Notes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onClick={() => navigate(`/notes/${note.id}`)}
                    />
                  ))}
                </div>
              </div>

              {/* 音频上传部分 */}
              {selectedInput === 'audio' && (
                <div className="mt-8">
                  <VideoUpload onUploadSuccess={() => {}} />
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

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </ErrorBoundary>
  );
}

export default Dashboard; 