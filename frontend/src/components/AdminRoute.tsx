import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ============================================================
// AdminRoute — gates children to platform admins only.
// Falls back to /dashboard for non-admins so the route behaves
// like it doesn't exist when a user types the URL manually.
// ============================================================

interface AdminRouteProps {
  children: React.ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_platform_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;
