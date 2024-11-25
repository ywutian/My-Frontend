import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import VideoDetail from './components/video/VideoDetail';
import './App.css';
import ErrorBoundary from './components/common/ErrorBoundary';
import Toast from './components/common/Toast';
import { useToast } from './hooks/useToast';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { toast, showToast } = useToast();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/video/:id" 
                element={
                  <ProtectedRoute>
                    <VideoDetail />
                  </ProtectedRoute>
                } 
              />
            </Routes>
            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => showToast(null)}
              />
            )}
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
