import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const folderService = {
  getFolder: async (id) => {
    const response = await axios.get(`${API_URL}/folders/${id}`);
    return response.data;
  },

  updateFolder: async (id, data) => {
    const response = await axios.put(`${API_URL}/folders/${id}`, data);
    return response.data;
  },

  deleteFolder: async (id) => {
    await axios.delete(`${API_URL}/folders/${id}`);
  },

  moveFolder: async (id, direction) => {
    const response = await axios.post(`${API_URL}/folders/${id}/move`, { direction });
    return response.data;
  }
}; 