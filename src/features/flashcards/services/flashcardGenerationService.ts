import { db } from '../../../db/db';
import { CONFIG, API_ROUTES } from '../../../shared/lib/config';
import type { Flashcard } from '../../../shared/types/quiz';

interface GeneratedFlashcard {
  id: number;
  front: string;
  back: string;
}

interface FlashcardRecord {
  id?: number;
  noteId: number;
  flashcards: GeneratedFlashcard[];
  date: string;
}

export const generateFlashcards = async (noteContent: string): Promise<GeneratedFlashcard[]> => {
  try {
    const response = await fetch(
      `${API_ROUTES.GEMINI_GENERATE}?key=${CONFIG.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `Based on the provided note content, generate 5 flashcards. Each flashcard should have a question or key concept on the front and a detailed explanation on the back.
                   Format the response as a JSON array with the following structure:
                   [
                     {
                       "id": 1,
                       "front": "What is [key concept]?",
                       "back": "Detailed explanation of the concept"
                     }
                   ]
                   Make sure the flashcards cover the main points and important details from the note.
                   IMPORTANT: Return ONLY the JSON array, no markdown code fences or extra text.`,
            }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: noteContent }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to generate flashcards');
    }

    const data = await response.json();
    const rawContent = data.candidates[0].content.parts[0].text;
    // Strip markdown code fences if present
    const jsonStr = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const flashcards: GeneratedFlashcard[] = JSON.parse(jsonStr);
    return flashcards;
  } catch (error) {
    console.error('Flashcard generation error:', error);
    throw error;
  }
};

export const saveFlashcards = async (
  noteId: string | number,
  flashcards: GeneratedFlashcard[],
): Promise<FlashcardRecord> => {
  try {
    const record: FlashcardRecord = {
      noteId: typeof noteId === 'string' ? parseInt(noteId, 10) : noteId,
      flashcards,
      date: new Date().toISOString(),
    };

    await db.flashcards.add(record as never);
    return record;
  } catch (error) {
    console.error('Error saving flashcards:', error);
    throw error;
  }
};

export const getFlashcardHistory = async (
  noteId: string | number,
): Promise<FlashcardRecord[]> => {
  try {
    const numericNoteId = typeof noteId === 'string' ? parseInt(noteId, 10) : noteId;
    const history = (await db.flashcards
      .where('noteId')
      .equals(numericNoteId)
      .toArray()) as FlashcardRecord[];

    return history.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch (error) {
    console.error('Error fetching flashcard history:', error);
    return [];
  }
};

export const deleteFlashcard = async (
  noteId: string | number,
  cardId: number,
): Promise<void> => {
  try {
    const history = await getFlashcardHistory(noteId);
    const mostRecent = history[0];

    if (mostRecent) {
      const updatedFlashcards = mostRecent.flashcards.filter((card) => card.id !== cardId);
      await db.flashcards.put({
        ...mostRecent,
        flashcards: updatedFlashcards,
      } as never);
    }
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
};
