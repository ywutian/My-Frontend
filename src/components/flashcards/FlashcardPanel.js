import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiRotateCw, FiPlay, FiTrash2, FiPlus } from 'react-icons/fi';
import { generateFlashcards, saveFlashcards, getFlashcardHistory } from '../../services/flashcardGenerationService';

function FlashcardPanel({ noteContent, noteId }) {
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardHistory, setFlashcardHistory] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load flashcard history and auto-generate if none exists
  useEffect(() => {
    const initializeFlashcards = async () => {
      if (noteId) {
        try {
          const history = await getFlashcardHistory(noteId);
          setFlashcardHistory(history);
          
          // If there are existing flashcards, use the most recent set
          if (history && history.length > 0) {
            const mostRecent = history[history.length - 1];
            setFlashcards(mostRecent.flashcards);
          } else {
            // Auto-generate if no flashcards exist
            await startFlashcardGeneration();
          }
        } catch (error) {
          console.error('Failed to initialize flashcards:', error);
        }
      }
    };

    initializeFlashcards();
  }, [noteId]);

  const startFlashcardGeneration = async () => {
    if (!noteContent) {
      console.error('No note content available');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Generating new flashcards:', {
        noteId,
        contentLength: noteContent.length,
        preview: noteContent.substring(0, 100)
      });

      const generatedCards = await generateFlashcards(noteContent);
      setFlashcards(prevCards => [...prevCards, ...generatedCards]);
      
      if (noteId) {
        await saveFlashcards(noteId, generatedCards);
        const updatedHistory = await getFlashcardHistory(noteId);
        setFlashcardHistory(updatedHistory);
      }
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFlashcard = async (cardId) => {
    try {
      const updatedFlashcards = flashcards.filter(card => card.id !== cardId);
      setFlashcards(updatedFlashcards);
      
      if (noteId) {
        await saveFlashcards(noteId, updatedFlashcards);
        const updatedHistory = await getFlashcardHistory(noteId);
        setFlashcardHistory(updatedHistory);
      }

      // Adjust current index if necessary
      if (currentCardIndex >= updatedFlashcards.length) {
        setCurrentCardIndex(Math.max(0, updatedFlashcards.length - 1));
      }
    } catch (error) {
      console.error('Failed to delete flashcard:', error);
    }
  };

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
      {flashcards.length > 0 ? (
        <div className="flex-1 flex flex-col">
          {/* Flashcard Display */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            <div className="text-gray-500 mb-4">
              Card {currentCardIndex + 1} of {flashcards.length}
            </div>

            <div 
              className="w-full max-w-2xl aspect-[16/9] relative cursor-pointer group"
              onClick={handleFlip}
            >
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

            {/* Navigation buttons */}
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={handleFlip}
                className="flex items-center gap-2 text-purple-500 hover:text-purple-600"
              >
                <FiRotateCw className="w-4 h-4" />
                <span>Flip</span>
              </button>
            </div>
          </div>

          {/* All Flashcards List */}
          <div className="border-t">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">All Flashcards</h3>
                <button
                  onClick={startFlashcardGeneration}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Generate More</span>
                </button>
              </div>

              <div className="space-y-4">
                {flashcards.map((card, index) => (
                  <div 
                    key={card.id}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Card {index + 1}</h4>
                      <button 
                        onClick={() => deleteFlashcard(card.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FiTrash2 className="w-4 h-4" />
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
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Generating flashcards...</p>
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlashcardPanel; 