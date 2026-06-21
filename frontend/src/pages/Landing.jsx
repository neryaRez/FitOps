import {
  ArrowRight,
  BarChart2,
  Brain,
  Camera,
  CheckCircle,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const features = [
  {
    icon: TrendingUp,
    title: 'Weight trends',
    desc: 'Track daily weight and understand real progress over time, not noisy one-off numbers.',
    accent: 'text-cyan-300',
    glow: 'shadow-cyan-500/10',
  },
  {
    icon: BarChart2,
    title: 'Body measurements',
    desc: 'Follow waist, chest, hips, arms and more with clean long-term history.',
    accent: 'text-violet-300',
    glow: 'shadow-violet-500/10',
  },
  {
    icon: Camera,
    title: 'Progress photos',
    desc: 'Keep private visual progress records alongside your numeric body data.',
    accent: 'text-orange-300',
    glow: 'shadow-orange-500/10',
  },
  {
    icon: Brain,
    title: 'AI coach',
    desc: 'Use your profile and progress data to get practical, personalised guidance.',
    accent: 'text-emerald-300',
    glow: 'shadow-emerald-500/10',
  },
];

const stats = [
  ['Private by design', 'Cognito auth + protected API'],
  ['AWS-native', 'S3, CloudFront, API Gateway, Lambda'],
  ['Progress-focused', 'Weight, measurements, photos and AI'],
];

const proofs = [
  'No frontend secrets',
  'Private user data boundary',
  'Built for long-term tracking',
  'AI through backend only',
];

function Logo() {
  return (
    <span className="text-xl sm:text-2xl font-black tracking-tight">
      Fit<span className="text-cyan-400">Ops</span>
    </span>
  );
}

export default function Landing() {
  const { navigateToLogin, navigateToSignUp } = useAuth();

  const handleLogin = () => navigateToLogin('/dashboard');
  const handleSignUp = () => navigateToSignUp('/dashboard');

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07051A] text-white font-inter">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(0,229,255,0.18),transparent_32%),radial-gradient(circle_at_82%_25%,rgba(255,136,55,0.18),transparent_30%),linear-gradient(135deg,#07051A_0%,#11103A_45%,#041122_100%)]" />
        <div className="absolute left-[-12%] top-[32%] h-56 w-[130%] rotate-[-8deg] bg-gradient-to-r from-cyan-400/0 via-cyan-400/18 to-orange-400/0 blur-2xl" />
        <div className="absolute left-[-10%] top-[48%] h-40 w-[120%] rotate-[7deg] bg-gradient-to-r from-orange-400/0 via-orange-400/16 to-cyan-400/0 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07051A]/75 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Logo />

            <nav className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleLogin}
                className="rounded-full px-3 py-2 text-sm font-semibold text-white/70 transition hover:text-white sm:px-4"
              >
                Sign in
              </button>

              <button
                onClick={handleSignUp}
                className="rounded-full border border-cyan-400/60 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200 shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-400/20 sm:px-5"
              >
                Get started
              </button>
            </nav>
          </div>
        </header>

        <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.06fr_0.94fr] lg:py-16">
          <div className="rounded-[2rem] border border-white/12 bg-white/[0.055] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Body intelligence platform
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[0.98] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your body.
              <br />
              Your data.
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-white to-orange-300 bg-clip-text text-transparent">
                Your progress.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
              Track weight, measurements and private progress photos in one clean dashboard.
              FitOps turns consistent body tracking into a focused, data-driven routine.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSignUp}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 text-base font-extrabold text-white shadow-xl shadow-cyan-500/20 transition hover:scale-[1.015]"
              >
                Start tracking free
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={handleLogin}
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-4 text-base font-bold text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                I already have an account
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {proofs.map((proof) => (
                <div key={proof} className="flex items-center gap-2 text-sm font-medium text-white/65">
                  <CheckCircle className="h-4 w-4 shrink-0 text-orange-300" />
                  {proof}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-orange-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#0B102D]/78 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/35">
                    Live dashboard preview
                  </p>
                  <h2 className="mt-1 text-xl font-black text-white">Today’s progress</h2>
                </div>

                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  Secure
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {stats.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/[0.055] p-4"
                  >
                    <p className="text-xs text-white/45">{label}</p>
                    <p className="mt-2 text-sm font-bold leading-5 text-white/88">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Weight trend</p>
                    <p className="text-xs text-white/40">Clean tracking over noisy guesses</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-cyan-300" />
                </div>

                <div className="flex h-28 items-end gap-2">
                  {[34, 48, 40, 62, 54, 70, 66, 82].map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-xl bg-gradient-to-t from-cyan-500/35 to-cyan-200/85"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {features.map(({ icon: Icon, title, desc, accent, glow }) => (
                  <div
                    key={title}
                    className={`rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-xl ${glow}`}
                  >
                    <Icon className={`mb-3 h-6 w-6 ${accent}`} />
                    <h3 className="text-sm font-black text-white">{title}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/50">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 text-center backdrop-blur-xl sm:p-8">
            <Shield className="mx-auto mb-4 h-9 w-9 text-cyan-300" />
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Built like a real cloud project, not a toy app.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
              React frontend on S3 and CloudFront, authenticated API Gateway routes,
              Lambda backend, DynamoDB storage and AI through the backend boundary only.
            </p>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-[#07051A]/70 py-8 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-xs text-white/40 sm:flex-row sm:px-6 sm:text-left">
            <Logo />
            <span>© {new Date().getFullYear()} FitOps. AWS-native body tracking.</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
