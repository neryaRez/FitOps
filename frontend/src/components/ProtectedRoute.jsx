import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useAuth } from '@/lib/AuthContext';

export default function ProtectedRoute() {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, authError, authChecked } =
    useAuth();
  const navigate = useNavigate();

  const loading = isLoadingAuth || isLoadingPublicSettings || !authChecked;

  useEffect(() => {
    if (!loading && !isAuthenticated && !authError) {
      navigate('/sign-in', { replace: true });
    }
  }, [loading, isAuthenticated, authError, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#07051A]">
        <div className="h-8 w-8 rounded-full border-4 border-white/10 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
}
