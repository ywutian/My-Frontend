import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { authService } from '../services/authService';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await authService.login(email, password);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1e3d58] via-[#057dcd] to-[#43b0f1]">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl">
        <h2 className="text-center text-3xl font-bold text-[#1e3d58]">Sign in</h2>
        {error && (
          <div className="bg-red-100/80 text-red-700 p-3 rounded backdrop-blur-sm">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              type="email"
              required
              className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-[#e8eef1] 
                placeholder-gray-500 text-[#1e3d58] focus:outline-none focus:ring-2 
                focus:ring-[#43b0f1] focus:border-transparent bg-white/70 backdrop-blur-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              required
              className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-[#e8eef1] 
                placeholder-gray-500 text-[#1e3d58] focus:outline-none focus:ring-2 
                focus:ring-[#43b0f1] focus:border-transparent bg-white/70 backdrop-blur-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent 
                text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#43b0f1] to-[#057dcd] 
                hover:from-[#057dcd] hover:to-[#43b0f1] focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-[#43b0f1] transition-all shadow-lg hover:shadow-xl"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login; 