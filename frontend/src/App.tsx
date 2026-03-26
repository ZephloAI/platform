import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ChatbotLayout from './components/ChatbotLayout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardAssistant from './components/DashboardAssistant';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateChatbotPage from './pages/CreateChatbotPage';
import ChatbotDetailPage from './pages/ChatbotDetailPage';
import ChatPreviewPage from './pages/ChatPreviewPage';
import OrganizationSettingsPage from './pages/OrganizationSettingsPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import OnboardingPage from './pages/OnboardingPage';

function App() {
  return (
    <>
    <DashboardAssistant />
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invitations/accept/:token" element={<AcceptInvitationPage />} />

      {/* Onboarding - full screen, no layout wrapper */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Home pages - simple top nav, no sidebar */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/agents/new" element={<CreateChatbotPage />} />
      </Route>

      {/* Organization settings - own sidebar layout */}
      <Route
        path="/organizations/:orgId/settings"
        element={
          <ProtectedRoute>
            <OrganizationSettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Agent detail pages - sidebar layout */}
      <Route
        path="/agents/:id"
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
    </>
  );
}

export default App;
