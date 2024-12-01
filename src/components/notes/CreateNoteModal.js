import { useState } from 'react';
import { motion } from 'framer-motion';
import { transcribeAudio } from '../../services/transcriptionService';
import { generateNote } from '../../services/noteGenerationService';

function CreateNoteModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [files, setFiles] = useState([]);
  const [audioLanguage, setAudioLanguage] = useState('en');
  const [noteLanguage, setNoteLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const subjects = [
    { id: 'math', name: 'Mathematics', icon: '📐' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'history', name: 'History', icon: '📚' },
    { id: 'english', name: 'English', icon: '✏️' },
    { id: 'computer', name: 'Computer Science', icon: '💻' },
    { id: 'physics', name: 'Physics', icon: '⚡' },
    { id: 'chemistry', name: 'Chemistry', icon: '🧪' },
    { id: 'biology', name: 'Biology', icon: '🧬' },
    { id: 'other', name: 'Other', icon: '📋' }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文 (普通话)' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    if (files.length === 0) {
      setError('Please select an audio file');
      return;
    }
    
    formData.append('audio', files[0]);
    formData.append('audioLanguage', audioLanguage);
    formData.append('noteLanguage', noteLanguage);
    formData.append('title', title);
    formData.append('subject', subject);

    try {
      await onSubmit(formData);
    } catch (error) {
      setError(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl relative z-10 mx-4">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create Note from Files</h3>
          
          {/* Title Input */}
          <input
            type="text"
            placeholder="Enter note title (Optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 mb-4 border rounded-lg"
          />

          {/* Language Selection */}
          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* Audio Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audio Language:
              </label>
              <select
                value={audioLanguage}
                onChange={(e) => setAudioLanguage(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Note Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note Language:
              </label>
              <select
                value={noteLanguage}
                onChange={(e) => setNoteLanguage(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Selection */}
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 mb-4 border rounded-lg"
          >
            <option value="">Select Subject (Optional)</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.icon} {subject.name}
              </option>
            ))}
          </select>

          {/* File Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 text-center cursor-pointer"
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />
            <div className="text-purple-500 text-4xl mb-2">⬆️</div>
            <p className="text-gray-500">
              Drag and drop files here, or click to select files
            </p>
            {files.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {files.map(f => f.name).join(', ')}
              </div>
            )}
          </div>

          {/* 添加加载状态和错误提示 */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white p-4 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-center mt-2">Processing...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full py-2 rounded-lg transition-colors ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {isLoading ? 'Creating...' : 'Create Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateNoteModal; 