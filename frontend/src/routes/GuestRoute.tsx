import { Navigate } from 'react-router-dom';
import { LoadingState } from '../components/ui/Spinner';
import { useAuth } from '../features/auth/useAuth';

export function GuestRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <LoadingState label="Loading session..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
