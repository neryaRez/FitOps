import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useAuth } from '@/lib/AuthContext';

export default function ProtectedRoute() {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, authError, navigateToLogin } = useAuth();

  const loading = isLoadingAuth || isLoadingPublicSettings;

  useEffect(() => {
    if (!loading && !isAuthenticated && !authError) {
      navigateToLogin();
    }
  }, [loading, isAuthenticated, authError]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-brand-light border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') return <UserNotRegisteredError />;
  if (authError?.type === 'auth_required' || !isAuthenticated) {
    navigateToLogin();
    return null;
  }

  return <Outlet />;
}