import React, { useState, useRef } from 'react';
import ProgressBar from '../common/ProgressBar';

function AudioUploadModal({ isOpen, onClose, onUpload }) {
  const [audioFile, setAudioFile] = useState(null);
  const [noteLanguage, setNoteLanguage] = useState('en');
  const [audioLanguage, setAudioLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!audioFile) return;
    
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('audioLanguage', audioLanguage);
    formData.append('noteLanguage', noteLanguage);
    formData.append('title', title.trim());
    
    await onUpload(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {!isLoading ? (
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upload Audio</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title or leave empty for AI generated title"
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audio Language
              </label>
              <select
                value={audioLanguage}
                onChange={(e) => setAudioLanguage(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="en">English</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note Language
              </label>
              <select
                value={noteLanguage}
                onChange={(e) => setNoteLanguage(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="en">English</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
          
          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith('audio/')) {
                setAudioFile(file);
              }
            }}
          >
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setAudioFile(file);
                }
              }}
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <span className="text-4xl mb-2">🎵</span>
              {audioFile ? (
                <span className="text-gray-600">{audioFile.name}</span>
              ) : (
                <>
                  <span className="text-gray-600">
                    Drag & drop or click to upload audio file
                  </span>
                  <span className="text-sm text-gray-400 mt-2">
                    Supports MP3, WAV, M4A
                  </span>
                </>
              )}
            </label>
          </div>
          
          {/* Buttons */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsLoading(true);
                handleSubmit();
              }}
              disabled={!audioFile}
              className={`px-4 py-2 bg-blue-500 text-white rounded-lg ml-2 hover:bg-blue-600
                ${!audioFile ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Upload
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AudioUploadModal; 