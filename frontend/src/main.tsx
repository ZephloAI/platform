import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './config/msalConfig';
import apiClient from './api/client';
import { useAuthStore } from './stores/authStore';
import { useOrgStore } from './stores/orgStore';
import App from './App';
import './index.css';

// ============================================================
// Application Entry Point
// Sets up React Query, React Router, OAuth providers, and
// handles Microsoft redirect callback before rendering.
// ============================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

/**
 * Handle the Microsoft OAuth redirect response.
 * After Microsoft redirects back with an auth code, MSAL exchanges it
 * for tokens. We then send the ID token to our backend and log the user in.
 */
async function handleMsalRedirect() {
  const response = await msalInstance.handleRedirectPromise();
  if (response?.idToken) {
    try {
      // If the user came from an invite link, that token survives the
      // Microsoft redirect via sessionStorage. Send it so the backend can
      // join them to the inviting org atomically.
      const invitationToken =
        sessionStorage.getItem('pendingInvitationToken') ?? undefined;
      const res = await apiClient.post('/api/auth/oauth', {
        provider: 'microsoft',
        id_token: response.idToken,
        invitation_token: invitationToken,
      });
      if (invitationToken) sessionStorage.removeItem('pendingInvitationToken');

      const { token, id, email, first_name, last_name, onboarding_completed } = res.data;
      const user = { id, email, first_name, last_name, onboarding_completed };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      useAuthStore.setState({ user, token, isAuthenticated: true });
      useOrgStore.getState().fetchOrganizations();

      // Redirect to dashboard after successful Microsoft login
      window.location.replace('/dashboard');
    } catch {
      // If backend auth fails, just continue to the app — user will see login page
    }
  }
}

// Initialize MSAL, process any redirect response, then render the app.
msalInstance.initialize().then(() => {
  return handleMsalRedirect();
}).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
        <MsalProvider instance={msalInstance}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </QueryClientProvider>
        </MsalProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
});
