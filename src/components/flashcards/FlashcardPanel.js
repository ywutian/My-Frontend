import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiRotateCw } from 'react-icons/fi';

function FlashcardPanel() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // 模拟闪卡数据
  const flashcards = [
    {
      id: 1,
      front: 'Concept of Tools',
      back: 'Tools are specialized features or commands designed to enhance productivity and efficiency in various tasks, often integrated into software and applications.'
    },
    {
      id: 2,
      front: 'What are the key discussion points?',
      back: 'The key points include new feature requirements, timeline adjustments, resource allocation, and quality metrics review.'
    },
    // ... 更多闪卡
  ];

  const handlePrevious = () => {
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : prev));
    setIsFlipped(false);
  };

  const handleNext = () => {
    setCurrentCardIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : prev));
    setIsFlipped(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main Flashcard Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Card Counter */}
        <div className="text-gray-500 mb-4">
          Card {currentCardIndex + 1} of {flashcards.length}
        </div>

        {/* Flashcard */}
        <div 
          className="w-full max-w-2xl aspect-[16/9] relative cursor-pointer group"
          onClick={handleFlip}
        >
          {/* Card Content */}
          <div 
            className={`absolute inset-0 bg-white rounded-xl shadow-lg p-8 flex items-center justify-center transform transition-all duration-500 ${
              isFlipped ? 'rotateY-180 opacity-0' : ''
            }`}
          >
            <h2 className="text-2xl font-semibold text-purple-600">
              {flashcards[currentCardIndex].front}
            </h2>
          </div>
          <div 
            className={`absolute inset-0 bg-white rounded-xl shadow-lg p-8 flex items-center justify-center transform transition-all duration-500 ${
              isFlipped ? '' : 'rotateY-180 opacity-0'
            }`}
          >
            <p className="text-lg text-gray-700">
              {flashcards[currentCardIndex].back}
            </p>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={currentCardIndex === 0}
          >
            <FiChevronLeft className="w-8 h-8 text-gray-400 hover:text-purple-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={currentCardIndex === flashcards.length - 1}
          >
            <FiChevronRight className="w-8 h-8 text-gray-400 hover:text-purple-500" />
          </button>
        </div>

        {/* Flip Button */}
        <button
          onClick={handleFlip}
          className="mt-4 flex items-center gap-2 text-purple-500 hover:text-purple-600"
        >
          <FiRotateCw className="w-4 h-4" />
          <span>Flip</span>
        </button>
      </div>

      {/* All Flashcards List */}
      <div className="border-t">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">All Flashcards</h3>
          <div className="space-y-4">
            {flashcards.map((card, index) => (
              <div 
                key={card.id}
                className="bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">Card {index + 1}</h4>
                  <button className="text-purple-500 hover:text-purple-600">
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Front</p>
                    <p className="mt-1">{card.front}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Back</p>
                    <p className="mt-1">{card.back}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashcardPanel; 