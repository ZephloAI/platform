import { create } from 'zustand';
import apiClient from '../api/client';
import type { AuthState, User } from '../types';
import { useOrgStore } from './orgStore';

// ============================================================
// Auth Store (Zustand)
// Manages user authentication state with localStorage persistence
// ============================================================

// Helper: safely parse user from localStorage
function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initialize state from localStorage so sessions survive page refresh
  user: getStoredUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  /**
   * Log in with email and password.
   * Stores token and user info in both Zustand state and localStorage.
   */
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
    const { token, id, email: userEmail, first_name, last_name, onboarding_completed, is_platform_admin } = response.data;
    const user: User = { id, email: userEmail, first_name, last_name, onboarding_completed, is_platform_admin };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    set({ user, token, isAuthenticated: true });

    // Fetch organizations after login
    useOrgStore.getState().fetchOrganizations();
  },

  /**
   * Register a new account.
   * If invitationToken is passed, the backend joins the inviting org
   * atomically and skips onboarding — no personal org is created.
   */
  register: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    invitationToken?: string,
  ) => {
    const response = await apiClient.post('/api/auth/register', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      invitation_token: invitationToken,
    });
    const { token, id, email: userEmail, first_name, last_name, onboarding_completed, is_platform_admin } = response.data;
    const user: User = { id, email: userEmail, first_name, last_name, onboarding_completed, is_platform_admin };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    set({ user, token, isAuthenticated: true });

    // Fetch organizations after registration
    useOrgStore.getState().fetchOrganizations();
  },

  /**
   * Log in via OAuth provider (Google or Microsoft).
   * If invitationToken is passed, brand-new users are joined to the inviting
   * org atomically (and skip onboarding).
   */
  oauthLogin: async (provider: string, idToken: string, invitationToken?: string) => {
    const response = await apiClient.post('/api/auth/oauth', {
      provider,
      id_token: idToken,
      invitation_token: invitationToken,
    });
    const { token, id, email: userEmail, first_name, last_name, onboarding_completed, is_platform_admin } = response.data;
    const user: User = { id, email: userEmail, first_name, last_name, onboarding_completed, is_platform_admin };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    set({ user, token, isAuthenticated: true });

    // Fetch organizations after OAuth login
    useOrgStore.getState().fetchOrganizations();
  },

  /**
   * Update user fields in state and localStorage.
   */
  updateUser: (updates: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  /** Log out by clearing all auth state */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    useOrgStore.getState().clearOrganizations();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
