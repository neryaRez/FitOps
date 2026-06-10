import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { handleAuthCallback } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const completeLogin = async () => {
      try {
        const returnTo = await handleAuthCallback();

        if (isMounted) {
          navigate(returnTo || '/dashboard', { replace: true });
        }
      } catch (callbackError) {
        console.error('Auth callback failed:', callbackError);

        if (isMounted) {
          setError(callbackError.message || 'Login failed');
        }
      }
    };

    completeLogin();

    return () => {
      isMounted = false;
    };
  }, [handleAuthCallback, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-3">
            Login failed
          </h1>

          <p className="text-sm text-gray-600 mb-6">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="rounded-xl px-4 py-2 bg-black text-white"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm text-center">
        <h1 className="text-xl font-semibold mb-3">
          Completing login...
        </h1>

        <p className="text-sm text-gray-600">
          Please wait while we securely sign you in.
        </p>
      </div>
    </div>
  );
}