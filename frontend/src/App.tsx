import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateChatbotPage from './pages/CreateChatbotPage';
import ChatbotDetailPage from './pages/ChatbotDetailPage';
import ChatPreviewPage from './pages/ChatPreviewPage';

// ============================================================
// App - Root component with route definitions
// ============================================================

function App() {
  return (
    <Routes>
      {/* Public routes - no auth required */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes - wrapped in Layout with nav bar */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chatbots/new" element={<CreateChatbotPage />} />
        <Route path="/chatbots/:id" element={<ChatbotDetailPage />} />
        <Route path="/chatbots/:id/chat" element={<ChatPreviewPage />} />
      </Route>

      {/* Redirect root to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
