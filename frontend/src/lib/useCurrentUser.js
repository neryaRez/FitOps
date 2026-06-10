import { useAuth } from '@/lib/AuthContext';

export function useCurrentUser() {
  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    authChecked,
    authError,
    checkUserAuth
  } = useAuth();

  return {
    user,
    currentUser: user,
    isAuthenticated,
    isLoading: isLoadingAuth || !authChecked,
    isLoadingAuth,
    authChecked,
    authError,
    refreshUser: checkUserAuth
  };
}

export default useCurrentUser;
