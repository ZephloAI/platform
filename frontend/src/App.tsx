import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ChatbotLayout from './components/ChatbotLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateChatbotPage from './pages/CreateChatbotPage';
import ChatbotDetailPage from './pages/ChatbotDetailPage';
import ChatPreviewPage from './pages/ChatPreviewPage';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Home pages - simple top nav, no sidebar */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chatbots/new" element={<CreateChatbotPage />} />
      </Route>

      {/* Chatbot detail pages - sidebar layout */}
      <Route
        path="/chatbots/:id"
        element={
          <ProtectedRoute>
            <ChatbotLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ChatbotDetailPage />} />
        <Route path="chat" element={<ChatPreviewPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
