import { Link } from 'react-router-dom';

export default function AuthLayout({ children, subtitle }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07051A] font-inter text-white">
      {/* Background layers */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(0,229,255,0.18),transparent_32%),radial-gradient(circle_at_78%_28%,rgba(255,136,55,0.16),transparent_28%),linear-gradient(135deg,#07051A_0%,#11103A_46%,#041122_100%)]" />
        <div className="absolute left-[-18%] top-[42%] h-52 w-[140%] -rotate-[8deg] bg-gradient-to-r from-cyan-400/0 via-cyan-400/18 to-orange-400/0 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-7 text-center">
            <Link to="/" className="inline-block text-2xl font-black tracking-tight">
              Fit<span className="text-cyan-400">Ops</span>
            </Link>
            {subtitle && (
              <p className="mt-2 text-sm text-white/45">{subtitle}</p>
            )}
          </div>

          {/* Glass card */}
          <div className="rounded-[2rem] border border-white/12 bg-white/[0.055] p-7 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
