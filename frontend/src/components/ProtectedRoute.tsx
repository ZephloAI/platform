import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ============================================================
// ProtectedRoute Component
// Redirects to /login if the user is not authenticated.
// Wrap any route that requires authentication with this.
// ============================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  // Not logged in? Send them to the login page.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
