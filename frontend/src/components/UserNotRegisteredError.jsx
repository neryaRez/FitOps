import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function UserNotRegisteredError() {
  const { logout } = useAuth();

  return (
    <main className="min-h-screen overflow-hidden bg-[#07051A] font-inter text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(0,229,255,0.12),transparent_32%),radial-gradient(circle_at_78%_28%,rgba(255,136,55,0.14),transparent_28%),linear-gradient(135deg,#07051A_0%,#11103A_46%,#041122_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px] opacity-20" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-block text-2xl font-black tracking-tight">
            Fit<span className="text-cyan-400">Ops</span>
          </div>

          <div className="rounded-[2rem] border border-orange-400/20 bg-white/[0.055] p-8 shadow-2xl shadow-orange-950/20 backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/25 bg-orange-400/10">
              <AlertTriangle className="h-7 w-7 text-orange-300" />
            </div>

            <h1 className="text-2xl font-black text-white">Access Restricted</h1>

            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Your account is not registered to use FitOps. Please contact the
              administrator to request access, or verify you're signed in with the
              correct account.
            </p>

            <div className="mt-6 space-y-3">
              <button
                onClick={logout}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] active:scale-[0.99]"
              >
                Sign out
              </button>

              <Link
                to="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] py-3.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
