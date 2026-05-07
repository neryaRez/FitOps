import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, TrendingUp, Camera, Brain, BarChart2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const features = [
  {
    icon: TrendingUp,
    title: 'Weight Tracking',
    desc: 'Log your daily weight and watch your trend line move in the right direction.',
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    glowColor: 'shadow-cyan-500/20',
  },
  {
    icon: Camera,
    title: 'Progress Photos',
    desc: 'Upload front, side, and back photos to visually document your transformation.',
    iconColor: 'text-orange-400',
    borderColor: 'border-orange-500/40',
    glowColor: 'shadow-orange-500/20',
  },
  {
    icon: BarChart2,
    title: 'Body Measurements',
    desc: 'Track neck, chest, waist, hips, arms and thighs with precision.',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    glowColor: 'shadow-purple-500/20',
  },
  {
    icon: Brain,
    title: 'AI Insights',
    desc: 'Personalised fitness path, meal guidance and workout plans powered by AI.',
    iconColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    glowColor: 'shadow-yellow-500/20',
  },
];

const proofs = [
  'No subscriptions required to start',
  'Built for long-term body recomposition',
  'AI-ready architecture — Phase 2 coming',
  'Privacy-first design',
];

export default function Landing() {
  const handleLogin = () => base44.auth.redirectToLogin('/dashboard');
  const handleSignUp = () => base44.auth.redirectToLogin('/dashboard');

  return (
    <div className="min-h-screen font-inter text-white relative" style={{ backgroundColor: '#0F0C29' }}>
      {/* Fixed background image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('https://media.base44.com/images/public/69ea569deb9059b940e51f3e/3053e376d_generated_image.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Dark overlay */}
      <div className="fixed inset-0 z-0" style={{ background: 'rgba(15,12,41,0.42)' }} />
      {/* Content */}
      <div className="relative z-10">

        {/* ── Nav ── */}
        <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md" style={{ background: 'rgba(15,12,41,0.7)' }}>
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <span className="font-bold text-lg tracking-tight text-white select-none">
              Fit<span className="text-cyan-400">Ops</span>
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogin}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-2"
              >
                Sign in
              </button>
              <button
                onClick={handleSignUp}
                className="text-sm font-semibold px-5 py-2 rounded-lg border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-[#0F0C29] transition-all"
              >
                Get started
              </button>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-6 pt-14 pb-10">
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Left: text card */}
            <div
              className="flex-1 rounded-2xl p-8 border border-white/15"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
            >
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                Your body.<br />
                Your data.<br />
                <span className="text-orange-400">Your progress.</span>
              </h1>
              <p className="mt-5 text-sm text-white/70 leading-relaxed max-w-sm">
                Track weight, measurements, and photos in one clean dashboard. Built for real, long-term progress — with AI personalisation coming in Phase 2.
              </p>
              <button
                onClick={handleSignUp}
                className="mt-8 flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}
              >
                Start tracking free <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogin}
                className="mt-3 text-xs text-white/50 hover:text-white transition-colors"
              >
                Already have an account →
              </button>
            </div>

            {/* Right: hero image */}
            <div
              className="flex-1 rounded-2xl overflow-hidden border border-white/15 w-full max-w-sm lg:max-w-none"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}
            >
              <img
                src="https://media.base44.com/images/public/69ea569deb9059b940e51f3e/cafb45b8e_generated_image.png"
                alt="FitOps trainer"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Trust badges */}
          <div
            className="mt-6 rounded-2xl p-5 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {proofs.map(p => (
                <div key={p} className="flex items-center gap-2.5 text-sm text-white/80">
                  <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-5xl mx-auto px-6 py-16" style={{ background: 'transparent' }}>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Everything you need to track your body
            </h2>
            <p className="mt-3 text-sm text-white/60 max-w-md mx-auto">
              A focused, distraction-free toolkit built for people serious about body recomposition.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map(({ icon: Icon, title, desc, iconColor, borderColor, glowColor }) => (
              <div
                key={title}
                className={`rounded-2xl p-6 border ${borderColor} shadow-xl ${glowColor} transition-all hover:scale-[1.02]`}
                style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
              >
                <div className="mb-4">
                  <Icon className={`w-8 h-8 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/10 py-8" style={{ background: 'rgba(15,12,41,0.6)' }}>
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <span className="font-bold text-sm text-white">
              Fit<span className="text-cyan-400">Ops</span>
            </span>
            <span>© {new Date().getFullYear()} FitOps. Built for AWS migration-ready architecture.</span>
          </div>
        </footer>

      </div>
    </div>
  );
}