import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

// 测试用户数据
const TEST_USER = {
  email: 'test@example.com',
  password: '123456',
  name: 'Test User'
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = async (credentials) => {
    try {
      // 简单的测试账号验证
      if (credentials.password === TEST_USER.password) {
        setIsAuthenticated(true);
        setUser(TEST_USER);
        return true;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout,
      // 导出测试账号信息，方便在其他组件中使用
      testCredentials: {
        email: TEST_USER.email,
        password: TEST_USER.password
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 