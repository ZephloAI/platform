import { create } from 'zustand';
import apiClient from '../api/client';
import type { AuthState, User } from '../types';

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

export const useAuthStore = create<AuthState>((set) => ({
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
    const { token, id, email: userEmail } = response.data;
    const user: User = { id, email: userEmail };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    set({ user, token, isAuthenticated: true });
  },

  /**
   * Register a new account.
   * Automatically logs the user in after successful registration.
   */
  register: async (email: string, password: string) => {
    const response = await apiClient.post('/api/auth/register', { email, password });
    const { token, id, email: userEmail } = response.data;
    const user: User = { id, email: userEmail };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    set({ user, token, isAuthenticated: true });
  },

  /** Log out by clearing all auth state */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
