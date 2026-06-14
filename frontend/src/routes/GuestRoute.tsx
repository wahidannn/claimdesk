import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

export function GuestRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted text-sm text-slate-600">
        Loading session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
