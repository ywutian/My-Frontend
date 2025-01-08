import React, { useState, useEffect } from 'react';
import { FiChevronRight, FiPlay, FiCheck, FiX, FiClock, FiRotateCcw, FiArrowLeft } from 'react-icons/fi';
import { generateQuiz, saveQuizResult, getQuizHistory } from '../../services/quizGenerationService';

const QuizPanel = ({ noteContent, noteId }) => {
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState(null);

  useEffect(() => {
    if (noteId) {
      console.log('Initial load of quiz history for noteId:', noteId);
      loadQuizHistory();
    }
  }, [noteId]);

  // 在组件开始时添加检查
  useEffect(() => {
    console.log('QuizPanel received noteId:', noteId);
    if (!noteId) {
      console.warn('QuizPanel: noteId is missing or invalid');
    }
  }, [noteId]);

  const loadQuizHistory = async () => {
    try {
      console.log('Loading quiz history for noteId:', noteId);
      const history = await getQuizHistory(noteId);
      console.log('Loaded quiz history:', history);
      setQuizHistory(history);
    } catch (error) {
      console.error('Failed to load quiz history:', error);
    }
  };

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      const quizQuestions = await generateQuiz(noteContent);
      setQuestions(quizQuestions);
      setIsQuizStarted(true);
      setUserAnswers(new Array(quizQuestions.length).fill(null));
      setCurrentQuestion(0);
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to start quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = async (answer) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestion] = answer;
    setUserAnswers(newUserAnswers);
    setSelectedAnswer(answer);
    setShowExplanation(true);

    // 如果是最后一题，保存测验结果
    if (currentQuestion === questions.length - 1) {
      try {
        // 添加 noteId 检查
        if (!noteId) {
          throw new Error('Cannot save quiz result: noteId is missing');
        }

        console.log('Saving quiz result...', {
          noteId,
          questionsCount: questions.length,
          answers: newUserAnswers,
        });

        const quizId = await saveQuizResult(noteId, questions, newUserAnswers);
        console.log('Quiz saved with ID:', quizId);
        setCurrentQuizId(quizId);
        await loadQuizHistory();
      } catch (error) {
        console.error('Failed to save quiz result:', error);
        // 可以添加一个用户提示
        alert('Failed to save quiz result. Please try again.');
      }
    }
  };

  const viewQuizHistory = (quizRecord) => {
    setQuestions(quizRecord.questions);
    setUserAnswers(quizRecord.userAnswers);
    setIsQuizStarted(true);
    setCurrentQuestion(0);
    setShowHistory(false);
    setCurrentQuizId(quizRecord.id);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  // 历史记录视图
  const HistoryView = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Quiz History</h3>
      {quizHistory.map((quiz) => (
        <div key={quiz.id} className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-sm text-gray-500">
                {new Date(quiz.date).toLocaleDateString()}
              </p>
              <p className="font-medium">
                Score: {quiz.score}/{quiz.questions.length}
              </p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => viewQuizHistory(quiz)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              >
                <FiClock className="inline mr-1" />
                View
              </button>
              <button
                onClick={startQuiz}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <FiRotateCcw className="inline mr-1" />
                Retake
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {(showHistory || (isQuizStarted && currentQuizId)) && (
            <button
              onClick={() => {
                setIsQuizStarted(false);
                setShowHistory(false);
                setCurrentQuizId(null);
                setQuestions([]);
                setUserAnswers([]);
                setCurrentQuestion(0);
                setSelectedAnswer(null);
                setShowExplanation(false);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Back to Quiz Generation"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <h2 className="text-xl font-semibold text-gray-800">Quiz</h2>
        </div>
        
        {!showHistory && (
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 
                       text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
            onClick={() => setShowHistory(true)}
          >
            <FiClock className="w-4 h-4" />
            <span>Quiz History</span>
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {showHistory ? (
          <HistoryView />
        ) : !isQuizStarted ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm w-full border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Ready to Test Your Knowledge?
              </h3>
              <p className="text-gray-600 mb-8">
                Take a quiz to reinforce your understanding of this note. We'll generate questions based on the content.
              </p>
              <button
                onClick={startQuiz}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 w-full justify-center
                  ${isLoading ? 'bg-gray-50 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiPlay className="w-5 h-5" />
                )}
                <span>Start Quiz</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-600 transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              {questions[currentQuestion].question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => {
                const optionLetter = option.charAt(0);
                const isCorrect = optionLetter === questions[currentQuestion].correctAnswer;
                const isSelected = selectedAnswer === optionLetter;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(optionLetter)}
                    disabled={showExplanation}
                    className={`w-full p-4 text-left rounded-lg border transition-all ${
                      showExplanation
                        ? isCorrect
                          ? 'border-gray-600 bg-gray-50 text-gray-800'
                          : isSelected
                            ? 'border-gray-400 bg-gray-50 text-gray-600'
                            : 'border-gray-200 opacity-50'
                        : isSelected
                          ? 'border-gray-400 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {showExplanation && (
                        <span className="flex-shrink-0">
                          {isCorrect ? (
                            <FiCheck className="w-5 h-5 text-gray-700" />
                          ) : isSelected ? (
                            <FiX className="w-5 h-5 text-gray-500" />
                          ) : null}
                        </span>
                      )}
                      <span className={showExplanation && !isCorrect && isSelected ? 'text-gray-500' : 'text-gray-700'}>
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900 mb-2">
                  {selectedAnswer === questions[currentQuestion].correctAnswer ? (
                    <span className="text-green-500">✓ Correct!</span>
                  ) : (
                    <span className="text-red-500">✗ Incorrect</span>
                  )}
                </p>
                <p className="text-gray-600">
                  {questions[currentQuestion].explanation}
                </p>
              </div>
            )}

            {/* Next button */}
            {showExplanation && currentQuestion < questions.length - 1 && (
              <button
                onClick={handleNextQuestion}
                className="w-full mt-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>Next Question</span>
                <FiChevronRight />
              </button>
            )}

            {/* Quiz completion */}
            {showExplanation && currentQuestion === questions.length - 1 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">
                  Quiz Completed!
                </h4>
                <p className="text-blue-600">
                  You've completed all questions. Great job!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPanel; 