import { db } from '../db/db';

const SILICONFLOW_API_KEY = process.env.REACT_APP_SILICONFLOW_API_KEY;

export const generateQuiz = async (noteContent) => {
  try {
    const response = await fetch('https://api.siliconflow.cn/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
          {
            role: 'system',
            content: `Generate 5 multiple choice questions based on the given note content. 
                     Format the response as a JSON array with the following structure:
                     [
                       {
                         "question": "Question text",
                         "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
                         "correctAnswer": "A",
                         "explanation": "Why this is the correct answer"
                       }
                     ]`
          },
          {
            role: 'user',
            content: noteContent
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate quiz');
    }
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Quiz generation error:', error);
    throw error;
  }
};

export const saveQuizResult = async (noteId, questions, userAnswers) => {
  try {
    if (!noteId) {
      console.error('saveQuizResult: noteId is required but was:', noteId);
      throw new Error('noteId is required');
    }

    const numericNoteId = parseInt(noteId, 10);
    if (isNaN(numericNoteId)) {
      console.error('saveQuizResult: noteId must be a valid number, received:', noteId);
      throw new Error('Invalid noteId format');
    }

    console.log('Saving quiz with data:', {
      noteId: numericNoteId,
      questionsCount: questions?.length,
      answersCount: userAnswers?.length
    });

    const score = calculateScore(questions, userAnswers);
    const quizRecord = {
      noteId: numericNoteId,
      questions,
      userAnswers,
      date: new Date().toISOString(),
      score
    };
    
    const id = await db.quizzes.add(quizRecord);
    console.log('Quiz saved successfully with ID:', id);
    return id;
  } catch (error) {
    console.error('Error in saveQuizResult:', error);
    throw error;
  }
};

export const getQuizHistory = async (noteId) => {
  try {
    const numericNoteId = parseInt(noteId, 10);
    if (isNaN(numericNoteId)) {
      console.warn('Invalid noteId provided:', noteId);
      return [];
    }

    const history = await db.quizzes
      .where({ noteId: numericNoteId })
      .toArray();

    console.log('Quiz history query result:', {
      noteId: numericNoteId,
      historyCount: history.length,
      history
    });

    return history;
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    return [];
  }
};

const calculateScore = (questions, userAnswers) => {
  return questions.reduce((score, question, index) => {
    return score + (question.correctAnswer === userAnswers[index] ? 1 : 0);
  }, 0);
};