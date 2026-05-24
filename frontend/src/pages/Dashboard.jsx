import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Target, Zap, CalendarDays, Activity, Plus, TrendingUp, Camera, BarChart2 } from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { getProfile } from '@/api/userApi';
import { getWeightLogs } from '@/api/progressApi';
import { getRecommendation, analyzeBMI } from '@/api/aiApi';
import StatCard from '@/components/ui/StatCard';
import AIInsightsCard from '@/components/dashboard/AIInsightsCard';
import QuickLogWeight from '@/components/dashboard/QuickLogWeight';

export default function Dashboard() {
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [showWeightLog, setShowWeightLog] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const [p, wl, rec] = await Promise.all([
      getProfile(user.email),
      getWeightLogs(user.email),
      getRecommendation(user.email),
    ]);
    setProfile(p);
    setWeightLogs(wl || []);
    setRecommendation(rec);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const latestWeight = weightLogs.length > 0
    ? [...weightLogs].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  const goalProgress = profile && latestWeight
    ? Math.max(0, Math.min(100, Math.round(
        ((profile.startingWeightKg - latestWeight.weightKg) /
         (profile.startingWeightKg - profile.goalWeightKg)) * 100
      )))
    : 0;

  const bmiData = profile ? analyzeBMI(profile) : null;

  const streak = weightLogs.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-xl font-semibold text-white mb-3">Welcome to FitOps!</h2>
        <p className="text-white/50 mb-6">Complete your profile to get started.</p>
        <Link to="/onboarding" className="text-white px-6 py-3 rounded-xl font-semibold transition-all" style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}>
          Set up profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 md:pb-0 text-white">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-sm">Good to see you,</p>
          <h1 className="text-2xl font-semibold text-white">{profile.name} 👋</h1>
        </div>
        <button
          onClick={() => setShowWeightLog(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}
        >
          <Plus className="w-4 h-4" /> Log weight
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Current weight" value={latestWeight?.weightKg ?? profile.startingWeightKg} unit="kg" icon={Scale} gradient="from-blue-500 to-cyan-400" />
        <StatCard label="Goal weight" value={profile.goalWeightKg} unit="kg" icon={Target} gradient="from-purple-500 to-pink-400" />
        <StatCard label="Goal progress" value={`${goalProgress}%`} icon={Activity} gradient="from-green-500 to-emerald-400" />
        <StatCard label="BMI" value={bmiData?.bmi} icon={BarChart2} gradient="from-orange-400 to-yellow-400" />
        <StatCard label="Total logs" value={streak} icon={Zap} gradient="from-rose-500 to-pink-400" />
        <StatCard label="Last log" value={latestWeight?.date ?? '—'} icon={CalendarDays} gradient="from-indigo-500 to-blue-400" />
      </div>

      {/* Progress bar */}
      {profile && (
        <div className="rounded-2xl p-5 border border-white/15" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/80">Weight goal progress</span>
            <span className="text-sm font-semibold text-cyan-400">{goalProgress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5">
            <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${goalProgress}%`, background: 'linear-gradient(90deg, #00BFFF, #4F6EF7)' }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/40">
            <span>Start: {profile.startingWeightKg} kg</span>
            <span>Goal: {profile.goalWeightKg} kg</span>
          </div>
        </div>
      )}

      {/* Quick shortcuts */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { to: '/progress', icon: TrendingUp, label: 'View Progress', color: 'text-cyan-400', border: 'border-cyan-500/40' },
          { to: '/progress?tab=measurements', icon: BarChart2, label: 'Measurements', color: 'text-purple-400', border: 'border-purple-500/40' },
          { to: '/progress?tab=photos', icon: Camera, label: 'Photos', color: 'text-orange-400', border: 'border-orange-500/40' },
        ].map(({ to, icon: Icon, label, color, border }) => (
          <Link key={to} to={to}
            className={`rounded-2xl p-4 border ${border} flex flex-col items-center gap-2 hover:scale-[1.03] transition-all text-center`}
            style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
          >
            <Icon className={`w-6 h-6 ${color}`} />
            <span className="text-xs font-medium text-white/80">{label}</span>
          </Link>
        ))}
      </div>

      {/* AI Insights */}
      <AIInsightsCard recommendation={recommendation} />

      {/* Quick log modal */}
      {showWeightLog && (
        <QuickLogWeight
          userId={user?.email}
          onClose={() => setShowWeightLog(false)}
          onSaved={() => { setShowWeightLog(false); load(); }}
        />
      )}
    </div>
  );
}