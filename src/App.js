import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import FolderPage from './pages/FolderPage';
import Login from './pages/Login';
import Notes from './pages/Notes';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notes" 
              element={
                <ProtectedRoute>
                  <Notes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/folders/:id" 
              element={
                <ProtectedRoute>
                  <FolderPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
