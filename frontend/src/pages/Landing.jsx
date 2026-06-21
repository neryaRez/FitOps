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

const BACKGROUND_IMAGE =
  'https://media.base44.com/images/public/69ea569deb9059b940e51f3e/3053e376d_generated_image.png';

const HERO_IMAGE =
  'https://media.base44.com/images/public/69ea569deb9059b940e51f3e/cafb45b8e_generated_image.png';

const features = [
  {
    icon: TrendingUp,
    title: 'Weight tracking',
    desc: 'Log your weight and understand the long-term trend, not just one noisy number.',
    color: 'text-cyan-300',
  },
  {
    icon: Camera,
    title: 'Progress photos',
    desc: 'Keep private visual progress records next to your body data.',
    color: 'text-orange-300',
  },
  {
    icon: BarChart2,
    title: 'Measurements',
    desc: 'Track waist, chest, hips, arms and more in a clean dashboard.',
    color: 'text-violet-300',
  },
  {
    icon: Brain,
    title: 'AI insights',
    desc: 'Get practical guidance from your own profile and progress data.',
    color: 'text-emerald-300',
  },
];

const proofs = [
  'Private by design',
  'No frontend secrets',
  'AWS-native backend',
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
      {/* Background image preserved */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('${BACKGROUND_IMAGE}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="fixed inset-0 z-0 bg-[#07051A]/55" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_18%,rgba(0,229,255,0.20),transparent_32%),radial-gradient(circle_at_82%_26%,rgba(255,136,55,0.18),transparent_30%),linear-gradient(180deg,rgba(7,5,26,0.22)_0%,rgba(7,5,26,0.82)_100%)]" />

      <div className="relative z-10">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07051A]/78 backdrop-blur-xl">
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

        <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
          <div className="rounded-[2rem] border border-white/12 bg-white/[0.07] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
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

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
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
                <div key={proof} className="flex items-center gap-2 text-sm font-medium text-white/67">
                  <CheckCircle className="h-4 w-4 shrink-0 text-orange-300" />
                  {proof}
                </div>
              ))}
            </div>
          </div>

          {/* Image preserved, but now responsive */}
          <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-orange-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-5">
              <div className="mb-4 flex items-center justify-between px-1">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/38">
                    FitOps preview
                  </p>
                  <h2 className="mt-1 text-xl font-black text-white">Built for real progress</h2>
                </div>

                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  Secure
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.55rem] border border-white/10 bg-black/20">
                <img
                  src={HERO_IMAGE}
                  alt="FitOps fitness dashboard illustration"
                  className="block h-auto w-full object-contain"
                  loading="eager"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {features.map(({ icon: Icon, title, desc, color }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <Icon className={`mb-3 h-5 w-5 ${color}`} />
                    <h3 className="text-sm font-black text-white">{title}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/52">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 text-center backdrop-blur-xl sm:p-8">
            <Shield className="mx-auto mb-4 h-9 w-9 text-cyan-300" />
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Built like a real cloud project, not a toy app.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
              React frontend on S3 and CloudFront, authenticated API Gateway routes,
              Lambda backend, DynamoDB storage and AI through the backend boundary only.
            </p>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-[#07051A]/75 py-8 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-xs text-white/42 sm:flex-row sm:px-6 sm:text-left">
            <Logo />
            <span>© {new Date().getFullYear()} FitOps. AWS-native body tracking.</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
