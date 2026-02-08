import axios from 'axios';

// ============================================================
// Axios API Client
// Configured with auth interceptors and error handling
// ============================================================

// Create an axios instance pointing at our backend API.
// In development, Vite proxies /api requests to localhost:8000.
// In production, nginx does the proxying.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
// Attach the JWT token to every outgoing request if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response Interceptor ---
// If we get a 401 (unauthorized), the token is invalid or expired.
// Clear auth state and redirect to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
