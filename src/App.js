 import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import FolderPage from './pages/FolderPage';
import Login from './pages/Login';
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import MainView from './pages/MainView';
import TranscriptionPage from './pages/TranscriptionPage';
import Home from './pages/Home';
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
        <ThemeProvider>
          <Router>
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
                path="/notes"
                element={
                  <ProtectedRoute>
                    <Notes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes/:noteId"
                element={
                  <ProtectedRoute>
                    <NoteDetail />
                  </ProtectedRoute>
                }
              />
              <Route path="/mainview" element={<MainView />} />
              <Route
                path="/folders/:folderId"
                element={
                  <ProtectedRoute>
                    <FolderPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/transcription" element={<TranscriptionPage />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
