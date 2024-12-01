// API 服务接口
const API_BASE_URL = process.env.REACT_APP_API_URL;

export const api = {
  // 笔记相关
  getNoteFromServer: async (noteId) => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}`);
    return response.json();
  },

  saveNoteToServer: async (note) => {
    const response = await fetch(`${API_BASE_URL}/notes/${note.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    });
    return response.json();
  },

  // 闪卡相关
  getFlashcardsFromServer: async (noteId) => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/flashcards`);
    return response.json();
  },

  saveFlashcardsToServer: async (noteId, flashcards) => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/flashcards`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flashcards)
    });
    return response.json();
  }
}; 