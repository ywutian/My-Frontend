import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiRotateCw, FiPlay, FiTrash2, FiPlus, FiCopy, FiEdit2, FiCheck } from 'react-icons/fi';
import { generateFlashcards, saveFlashcards, getFlashcardHistory } from '../../services/flashcardGenerationService';

function FlashcardPanel({ noteContent, noteId }) {
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardHistory, setFlashcardHistory] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [editedContent, setEditedContent] = useState({ front: '', back: '' });

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

  const copyFlashcard = async (card) => {
    try {
      const newCard = {
        ...card,
        id: Date.now().toString(), // 生成新的ID
      };
      const updatedFlashcards = [...flashcards, newCard];
      setFlashcards(updatedFlashcards);
      
      if (noteId) {
        await saveFlashcards(noteId, updatedFlashcards);
        const updatedHistory = await getFlashcardHistory(noteId);
        setFlashcardHistory(updatedHistory);
      }
    } catch (error) {
      console.error('Failed to copy flashcard:', error);
    }
  };

  const updateFlashcard = async (cardId, updatedContent) => {
    try {
      const updatedFlashcards = flashcards.map(card => 
        card.id === cardId ? { ...card, ...updatedContent } : card
      );
      setFlashcards(updatedFlashcards);
      
      if (noteId) {
        await saveFlashcards(noteId, updatedFlashcards);
        const updatedHistory = await getFlashcardHistory(noteId);
        setFlashcardHistory(updatedHistory);
      }
      setEditingCard(null);
    } catch (error) {
      console.error('Failed to update flashcard:', error);
    }
  };

  const startEditing = (card) => {
    setEditingCard(card.id);
    setEditedContent({ front: card.front, back: card.back });
  };

  const saveEdit = async (cardId) => {
    await updateFlashcard(cardId, editedContent);
    setEditingCard(null);
    setEditedContent({ front: '', back: '' });
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
    <div className="h-full bg-gradient-flashcard overflow-x-hidden">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-white/20">
        <div style={{ maxWidth: '56rem' }} className="mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <FiPlay className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 
                         bg-clip-text text-transparent">
                Flashcards
              </h2>
            </div>

            <button
              onClick={startFlashcardGeneration}
              disabled={isLoading}
              className={`group relative flex items-center gap-2 px-6 py-3 rounded-xl
                bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                text-white shadow-lg shadow-blue-500/20 transition-all duration-200
                hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiPlus className="w-4 h-4 text-white" />
              )}
              <span className="font-medium">Generate More</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-transparent custom-scrollbar" style={{ height: 'calc(100% - 73px)' }}>
        <div style={{ maxWidth: '56rem' }} className="mx-auto px-4 sm:px-6 py-6">
          {flashcards.length > 0 && flashcards[currentCardIndex] ? (
            <div className="space-y-8">
              {/* Flashcard Display */}
              <div className="glass-card rounded-xl p-8">
                <div className="text-center mb-8">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium
                               bg-blue-50 text-blue-600 border border-blue-100">
                    Card {currentCardIndex + 1} of {flashcards.length}
                  </span>
                </div>

                <div className="w-full aspect-[16/9] relative cursor-pointer group">
                  <div 
                    onClick={handleFlip}
                    className={`absolute inset-0 card-content rounded-xl p-10
                             flex items-center justify-center transition-all duration-300
                             ${isFlipped ? 'opacity-0 rotate-y-180' : 'opacity-100 rotate-y-0'}`}
                  >
                    <h2 className="text-2xl font-semibold text-gray-800 max-w-2xl text-center leading-relaxed">
                      {flashcards[currentCardIndex]?.front || 'Loading...'}
                    </h2>
                  </div>
                  <div 
                    onClick={handleFlip}
                    className={`absolute inset-0 card-content rounded-xl p-10
                             flex items-center justify-center transition-all duration-300
                             ${isFlipped ? 'opacity-100 rotate-y-0' : 'opacity-0 rotate-y-180'}`}
                  >
                    <p className="text-lg text-gray-700 max-w-2xl text-center leading-relaxed">
                      {flashcards[currentCardIndex]?.back || 'Loading...'}
                    </p>
                  </div>

                  {/* Navigation buttons */}
                  <button
                    onClick={handlePrevious}
                    disabled={currentCardIndex === 0}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5
                             disabled:opacity-30 focus:outline-none"
                  >
                    <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center
                                shadow-sm hover:shadow-md transition-all duration-300
                                hover:scale-110">
                      <FiChevronLeft className="w-6 h-6 text-gray-600" />
                    </div>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentCardIndex === flashcards.length - 1}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5
                             disabled:opacity-30 focus:outline-none"
                  >
                    <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center
                                shadow-sm hover:shadow-md transition-all duration-300
                                hover:scale-110">
                      <FiChevronRight className="w-6 h-6 text-gray-600" />
                    </div>
                  </button>
                </div>

                {/* Flip button */}
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleFlip}
                    className={`group relative flex items-center gap-2 px-6 py-3 rounded-xl
                      bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                      text-white shadow-lg shadow-blue-500/20 transition-all duration-200
                      hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5`}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <FiRotateCw className="w-4 h-4" />
                    <span className="font-medium">Flip Card</span>
                  </button>
                </div>
              </div>

              {/* All Flashcards List */}
              <div className="glass-card rounded-xl p-8">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 
                             bg-clip-text text-transparent mb-6 flex items-center gap-2">
                  <span>All Flashcards</span>
                  <span className="text-sm font-normal text-gray-500">({flashcards.length} cards)</span>
                </h3>
                <div className="space-y-4">
                  {flashcards.map((card, index) => (
                    <div key={card.id} 
                      className="card-content rounded-xl transition-all duration-200 hover:shadow-lg"
                    >
                      {/* Card Header */}
                      <div className="flex justify-between items-center p-4 border-b border-gray-100">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                                      bg-blue-50 text-blue-600 border border-blue-100">
                          Card {index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => copyFlashcard(card)}
                            className="p-2 rounded-lg hover:bg-blue-50 group transition-colors"
                            title="Copy card"
                          >
                            <FiCopy className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                          </button>
                          {editingCard === card.id ? (
                            <button 
                              onClick={() => saveEdit(card.id)}
                              className="p-2 rounded-lg hover:bg-green-50 group transition-colors"
                              title="Save changes"
                            >
                              <FiCheck className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => startEditing(card)}
                              className="p-2 rounded-lg hover:bg-blue-50 group transition-colors"
                              title="Edit card"
                            >
                              <FiEdit2 className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteFlashcard(card.id)}
                            className="p-2 rounded-lg hover:bg-red-50 group transition-colors"
                            title="Delete card"
                          >
                            <FiTrash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                          {editingCard === card.id ? (
                            <>
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-blue-600">Front</label>
                                <textarea
                                  className="w-full p-4 rounded-xl bg-white/70 border border-gray-200 
                                           focus:border-blue-300 focus:ring focus:ring-blue-200 
                                           focus:ring-opacity-50 transition-all resize-none
                                           text-gray-700 leading-relaxed"
                                  value={editedContent.front}
                                  rows={4}
                                  onChange={(e) => setEditedContent(prev => ({ ...prev, front: e.target.value }))}
                                  placeholder="Enter the front content..."
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-blue-600">Back</label>
                                <textarea
                                  className="w-full p-4 rounded-xl bg-white/70 border border-gray-200 
                                           focus:border-blue-300 focus:ring focus:ring-blue-200 
                                           focus:ring-opacity-50 transition-all resize-none
                                           text-gray-700 leading-relaxed"
                                  value={editedContent.back}
                                  rows={4}
                                  onChange={(e) => setEditedContent(prev => ({ ...prev, back: e.target.value }))}
                                  placeholder="Enter the back content..."
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-5 rounded-xl bg-gradient-to-br from-white/80 to-white/50 
                                           backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200
                                           border border-white/60">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                  <h4 className="text-sm font-medium text-blue-600">Front</h4>
                                </div>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {card.front}
                                </p>
                              </div>
                              <div className="p-5 rounded-xl bg-gradient-to-br from-white/80 to-white/50 
                                           backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200
                                           border border-white/60">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                  <h4 className="text-sm font-medium text-blue-600">Back</h4>
                                </div>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {card.back}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="glass-card p-10 rounded-xl w-full max-w-xl mx-4 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 
                             flex items-center justify-center shadow-lg shadow-blue-500/20 
                             ring-4 ring-white/50">
                  <FiPlay className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 
                             bg-clip-text text-transparent mb-4">
                  {isLoading ? 'Generating Flashcards' : 'No Flashcards Yet'}
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  {isLoading 
                    ? 'Please wait while we create your study materials...'
                    : 'Click "Generate More" to create flashcards from your note.'}
                </p>
                {isLoading && (
                  <div className="w-10 h-10 mx-auto border-3 border-blue-500/30 border-t-blue-500 
                               rounded-full animate-spin" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FlashcardPanel; 