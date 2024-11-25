import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance with auth header
const authAxios = axios.create();
authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const videoService = {
  async uploadVideo(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await authAxios.post(`${API_URL}/videos/upload`, formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(percentCompleted);
      }
    });
    return response.data;
  },

  async getVideos() {
    const response = await authAxios.get(`${API_URL}/videos`);
    return response.data;
  },

  async getVideoById(id) {
    const response = await authAxios.get(`${API_URL}/videos/${id}`);
    return response.data;
  }
}; 