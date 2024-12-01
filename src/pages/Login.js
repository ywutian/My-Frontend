import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login, testCredentials } = useAuth();
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 直接使用测试账号登录
      await login({ password: '123456' });
      navigate('/dashboard');
    } catch (error) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          {error && (
            <p className="mt-2 text-center text-sm text-red-600">{error}</p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Test Login (123456)
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Test Account Credentials:</p>
          <p>Password: {testCredentials.password}</p>
        </div>
      </div>
    </div>
  );
}

export default Login; 