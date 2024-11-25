import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const authAxios = axios.create();
authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const transcriptionService = {
  async getTranscription(videoId) {
    const response = await authAxios.get(`${API_URL}/videos/${videoId}/transcription`);
    return response.data;
  }
}; 