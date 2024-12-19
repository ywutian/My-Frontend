import { db } from '../db/db';

const SILICONFLOW_API_KEY = process.env.REACT_APP_SILICONFLOW_API_KEY;

export const generateFlashcards = async (noteContent) => {
  try {
    console.log('Generating flashcards for note content:', {
      contentLength: noteContent?.length,
      preview: noteContent?.substring(0, 100) + '...',
      fullContent: noteContent
    });

    const requestBody = {
      model: 'Qwen/Qwen2.5-7B-Instruct',
      messages: [
        {
          role: 'system',
          content: `Based on the provided note content, generate 5 flashcards. Each flashcard should have a question or key concept on the front and a detailed explanation on the back.
                   Format the response as a JSON array with the following structure:
                   [
                     {
                       "id": 1,
                       "front": "What is [key concept]?",
                       "back": "Detailed explanation of the concept"
                     }
                   ]
                   Make sure the flashcards cover the main points and important details from the note.`
        },
        {
          role: 'user',
          content: noteContent
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    console.log('Sending request to API:', {
      endpoint: 'https://api.siliconflow.cn/chat/completions',
      model: requestBody.model,
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens
    });

    const response = await fetch('https://api.siliconflow.cn/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('API response not OK:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error('Failed to generate flashcards');
    }

    const data = await response.json();
    console.log('API response received:', {
      responseStatus: response.status,
      choices: data.choices?.length,
      firstChoice: data.choices?.[0]
    });

    const flashcards = JSON.parse(data.choices[0].message.content);
    console.log('Generated flashcards:', {
      count: flashcards.length,
      cards: flashcards
    });

    return flashcards;
  } catch (error) {
    console.error('Flashcard generation error:', {
      error,
      message: error.message,
      noteContentLength: noteContent?.length
    });
    throw error;
  }
};

export const saveFlashcards = async (noteId, flashcards) => {
  try {
    const record = {
      noteId: parseInt(noteId),
      flashcards,
      date: new Date().toISOString(),
    };
    
    await db.flashcards.add(record);
    return record;
  } catch (error) {
    console.error('Error saving flashcards:', error);
    throw error;
  }
};

export const getFlashcardHistory = async (noteId) => {
  try {
    const history = await db.flashcards
      .where('noteId')
      .equals(parseInt(noteId))
      .toArray();
    
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error fetching flashcard history:', error);
    return [];
  }
};

export const deleteFlashcard = async (noteId, cardId) => {
  try {
    const history = await getFlashcardHistory(noteId);
    const mostRecent = history[0];
    
    if (mostRecent) {
      const updatedFlashcards = mostRecent.flashcards.filter(card => card.id !== cardId);
      await db.flashcards.put({
        ...mostRecent,
        flashcards: updatedFlashcards,
      });
    }
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
};