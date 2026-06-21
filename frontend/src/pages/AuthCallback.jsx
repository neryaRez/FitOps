import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

function clearAuthAttemptStorage() {
  localStorage.removeItem('fitops_cognito_pkce_verifier');
  localStorage.removeItem('fitops_cognito_oauth_state');
  localStorage.removeItem('fitops_cognito_return_to');
  sessionStorage.removeItem('fitops_cognito_pkce_verifier');
  sessionStorage.removeItem('fitops_cognito_oauth_state');
  sessionStorage.removeItem('fitops_cognito_return_to');
}

function AuthShell({ children }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07051A] text-white font-inter">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(0,229,255,0.18),transparent_32%),radial-gradient(circle_at_78%_28%,rgba(255,136,55,0.16),transparent_28%),linear-gradient(135deg,#07051A_0%,#11103A_46%,#041122_100%)]" />
        <div className="absolute left-[-18%] top-[42%] h-52 w-[140%] rotate-[-8deg] bg-gradient-to-r from-cyan-400/0 via-cyan-400/18 to-orange-400/0 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="text-2xl font-black tracking-tight">
              Fit<span className="text-cyan-400">Ops</span>
            </div>
            <p className="mt-2 text-sm text-white/45">Secure Cognito authentication</p>
          </div>

          <div className="rounded-[2rem] border border-white/12 bg-white/[0.055] p-7 text-center shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

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
        console.error('Auth callback failed:', {
          name: err?.name,
          message: err?.message,
        });
        setError(err?.message || 'Login failed.');
      }
    };

    run();
    // Intentional: callback must run once per page load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <AuthShell>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/25 bg-orange-400/10">
          <AlertTriangle className="h-7 w-7 text-orange-300" />
        </div>

        <h1 className="text-2xl font-black text-white">Login failed</h1>

        <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/62">
          {error}
        </p>

        <Link
          to="/"
          onClick={clearAuthAttemptStorage}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-4 text-sm font-extrabold text-white shadow-xl shadow-cyan-500/20 transition hover:scale-[1.01]"
        >
          Back to FitOps
          <ArrowRight className="h-4 w-4" />
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10">
        <Loader2 className="h-7 w-7 animate-spin text-cyan-300" />
      </div>

      <h1 className="text-2xl font-black text-white">Completing login</h1>

      <p className="mt-3 text-sm leading-6 text-white/55">
        We are securely verifying your session and preparing your dashboard.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white/70">
          <CheckCircle className="h-4 w-4 text-emerald-300" />
          Protected by Cognito OAuth
        </div>
      </div>
    </AuthShell>
  );
}
