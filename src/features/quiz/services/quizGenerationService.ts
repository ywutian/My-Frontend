import { db } from '../../../db/db';
import { CONFIG, API_ROUTES } from '../../../shared/lib/config';
import type { QuizQuestion, Quiz } from '../../../shared/types/quiz';

export const generateQuiz = async (noteContent: string): Promise<QuizQuestion[]> => {
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
              text: `Generate 5 multiple choice questions based on the given note content.
                     Format the response as a JSON array with the following structure:
                     [
                       {
                         "question": "Question text",
                         "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
                         "correctAnswer": "A",
                         "explanation": "Why this is the correct answer"
                       }
                     ]
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
      throw new Error('Failed to generate quiz');
    }
    const data = await response.json();
    const rawContent = data.candidates[0].content.parts[0].text;
    // Strip markdown code fences if present
    const jsonStr = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Quiz generation error:', error);
    throw error;
  }
};

export const saveQuizResult = async (
  noteId: string | number,
  questions: QuizQuestion[],
  userAnswers: number[],
): Promise<number> => {
  try {
    if (!noteId) {
      throw new Error('noteId is required');
    }

    const numericNoteId = typeof noteId === 'string' ? parseInt(noteId, 10) : noteId;
    if (isNaN(numericNoteId)) {
      throw new Error('Invalid noteId format');
    }

    const score = calculateScore(questions, userAnswers);
    const quizRecord: Omit<Quiz, 'id'> = {
      noteId: numericNoteId,
      questions,
      userAnswers,
      date: new Date().toISOString(),
      score,
    };

    const id = await db.quizzes.add(quizRecord as Quiz);
    return id;
  } catch (error) {
    console.error('Error in saveQuizResult:', error);
    throw error;
  }
};

export const getQuizHistory = async (noteId: string | number): Promise<Quiz[]> => {
  try {
    const numericNoteId = typeof noteId === 'string' ? parseInt(noteId, 10) : noteId;
    if (isNaN(numericNoteId)) {
      return [];
    }

    const history = await db.quizzes.where({ noteId: numericNoteId }).toArray();
    return history;
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    return [];
  }
};

const calculateScore = (questions: QuizQuestion[], userAnswers: number[]): number => {
  return questions.reduce((score, question, index) => {
    return score + (question.correctAnswer === userAnswers[index] ? 1 : 0);
  }, 0);
};
