import { Navigate } from 'react-router-dom';
import { LoadingState } from '../components/ui/Spinner';
import type { Role } from '../features/auth/types';
import { useAuth } from '../features/auth/useAuth';

type RoleRouteProps = {
  roles: Role[];
  children: JSX.Element;
};

export function RoleRoute({ roles, children }: RoleRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <LoadingState label="Loading session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
