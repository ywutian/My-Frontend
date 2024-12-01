import { useState } from 'react';
import { FiChevronRight, FiPlay } from 'react-icons/fi';

function QuizPanel() {
  const [isQuizStarted, setIsQuizStarted] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Previous Quizzes button */}
      <div className="flex justify-end p-4 border-b">
        <button
          onClick={() => {/* 处理查看历史测验 */}}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-500 transition-colors"
        >
          <span>Previous Quizzes</span>
          <FiChevronRight />
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center bg-white">
        {!isQuizStarted ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Ready to Test Your Knowledge?
            </h2>
            <p className="text-gray-600 mb-8">
              Start a quiz to reinforce your understanding of this note
            </p>

            <button
              onClick={() => setIsQuizStarted(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FiPlay className="w-5 h-5" />
              <span className="font-medium">Start Quiz</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Quiz content will be added here */}
            <h3>Quiz in progress...</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizPanel; 