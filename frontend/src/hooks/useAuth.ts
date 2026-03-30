import { useAuthStore } from '../stores/authStore';

// ============================================================
// useAuth Hook
// Convenience wrapper around the Zustand auth store.
// Provides a simple API for components to access auth state.
// ============================================================

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const oauthLogin = useAuthStore((state) => state.oauthLogin);
  const register = useAuthStore((state) => state.register);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);

  return { user, token, isAuthenticated, login, oauthLogin, register, updateUser, logout };
}
