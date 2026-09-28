import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { FullScreenSpinner } from '@/components/Spinner';
import { useAuth } from './useAuth';

/** Renders children only for a signed-in user; everyone else goes to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
