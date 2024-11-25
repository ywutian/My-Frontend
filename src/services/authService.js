import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const authService = {
  async login(email, password) {
    // 模拟登录验证
    if (email === '123456@gmail.com' && password === '123456') {
      return {
        token: 'fake-jwt-token',
        user: {
          id: 1,
          email: '123456',
          name: 'Test User'
        }
      };
    }
    throw new Error('Invalid credentials');
  },

  async register(email, password) {
    // 模拟注册
    return {
      token: 'fake-jwt-token',
      user: {
        id: 1,
        email,
        name: 'New User'
      }
    };
  },

  async logout() {
    localStorage.removeItem('token');
  }
}; 