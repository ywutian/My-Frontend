import React from 'react';

const ProgressBar = ({ progress, status }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-96 shadow-2xl">
        {/* Status and Percentage */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-800">{status}</span>
          <span className="text-lg font-bold text-blue-600">{progress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
            style={{ 
              width: `${progress}%`,
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' 
            }}
          />
        </div>

        {/* Processing Message */}
        <p className="text-sm text-gray-500 text-center">
          Please wait while we process your audio...
        </p>
      </div>
    </div>
  );
};

export default ProgressBar; 