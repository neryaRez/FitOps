import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function AuthCallback() {
  const { handleAuthCallback } = useAuth();
  const didRunRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    const run = async () => {
      try {
        await handleAuthCallback();
      } catch (err) {
        console.error('Auth callback failed:', err);
        setError(err?.message || 'Login failed.');
      }
    };

    run();
    // Intentional: callback must run once per page load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-md w-full rounded-3xl border border-gray-200 shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Login failed</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link
            to="/"
            onClick={() => {
              localStorage.removeItem('fitops_cognito_pkce_verifier');
              localStorage.removeItem('fitops_cognito_oauth_state');
              localStorage.removeItem('fitops_cognito_return_to');
              sessionStorage.removeItem('fitops_cognito_pkce_verifier');
              sessionStorage.removeItem('fitops_cognito_oauth_state');
              sessionStorage.removeItem('fitops_cognito_return_to');
            }}
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-white font-semibold"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-md w-full rounded-3xl border border-gray-200 shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Completing login...</h1>
        <p className="text-gray-600">Please wait.</p>
      </div>
    </div>
  );
}
