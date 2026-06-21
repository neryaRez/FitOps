import { useState, useEffect } from 'react';
import { Brain, Dumbbell, Utensils, TrendingUp, Sparkles, RefreshCw, MessageCircle, ChevronRight } from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { getProfile } from '@/api/userApi';
import { getWeightLogs, getMeasurementLogs } from '@/api/progressApi';
import { getRecommendation, requestAnalysis } from '@/api/aiApi';
import { listCoachConversations } from '@/api/coachChatApi';
import { format } from 'date-fns';
import InsightCard from '@/components/insights/InsightCard';
import CoachChat from '@/components/insights/CoachChat';

const sections = [
  { key: 'bmiAnalysis',      icon: TrendingUp, label: 'BMI & Body Analysis',  color: 'blue'   },
  { key: 'fitnessPath',      icon: Dumbbell,   label: 'Your Fitness Path',     color: 'purple' },
  { key: 'mealGuidance',     icon: Utensils,   label: 'Nutrition & Meals',     color: 'green'  },
  { key: 'workoutPlan',      icon: Sparkles,   label: 'Workout Plan',          color: 'orange' },
  { key: 'progressInsights', icon: TrendingUp, label: 'Progress Insights',     color: 'indigo' },
];

export default function Insights() {
  const { user } = useCurrentUser();
  const [recommendation, setRecommendation] = useState(null);
  const [recentConvos, setRecentConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [tab, setTab] = useState('insights');

  const load = async () => {
    if (!user) return;

    try {
      const [rec, convosResult] = await Promise.all([
        getRecommendation(user.email),
        listCoachConversations(),
      ]);

      setRecommendation(rec);

      const convos = Array.isArray(convosResult)
        ? convosResult
        : Array.isArray(convosResult?.items)
          ? convosResult.items
          : Array.isArray(convosResult?.data)
            ? convosResult.data
            : Array.isArray(convosResult?.conversations)
              ? convosResult.conversations
              : [];

      const mine = convos
        // AWS backend already returns only the authenticated user's conversations.
        .sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0))
        .slice(0, 3);

      setRecentConvos(mine);
    } catch (err) {
      console.error('Failed to load AI insights:', err);
      setRecentConvos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleRegenerate = async () => {
    if (!user) return;
    setRegenerating(true);
    const [profile, weightLogs, measurementLogs] = await Promise.all([
      getProfile(user.email),
      getWeightLogs(user.email),
      getMeasurementLogs(user.email),
    ]);
    if (profile) {
      await requestAnalysis(user.email, profile, weightLogs, measurementLogs);
      await load();
    }
    setRegenerating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Insights</h1>
          <p className="text-white/50 text-sm mt-1">Personalised by your data, powered by AI</p>
        </div>
        {tab === 'insights' && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 shadow-md"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}
          >
            <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Analyzing…' : 'Refresh AI'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {[
          { key: 'insights', icon: Brain, label: 'AI Insights' },
          { key: 'coach',    icon: MessageCircle, label: 'Coach Chat' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? 'text-white shadow-md'
                : 'text-white/40 hover:text-white/70'
            }`}
            style={tab === key ? { background: 'linear-gradient(135deg, #00BFFF33, #4F6EF733)', border: '1px solid rgba(0,191,255,0.3)' } : {}}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── INSIGHTS TAB ── */}
      {tab === 'insights' && (
        <>
          {regenerating ? (
            <div className="rounded-2xl p-8 border border-white/15 flex flex-col items-center gap-4 text-center"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
              <div className="w-12 h-12 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
              <div>
                <p className="text-white font-bold text-base">AI is analyzing your data…</p>
                <p className="text-white/50 text-sm mt-1">Crafting your personalised report — ~15 seconds</p>
              </div>
            </div>
          ) : recommendation ? (
            <div className="space-y-4">
              {sections.map(({ key, icon, label, color }) => (
                <InsightCard
                  key={key}
                  icon={icon}
                  label={label}
                  color={color}
                  content={recommendation[key]}
                />
              ))}
              <p className="text-center text-xs text-white/25 pt-1">
                Last generated: {recommendation.generatedAt ? new Date(recommendation.generatedAt).toLocaleString() : '—'}
              </p>

              {/* Recent coach conversations */}
              {recentConvos.length > 0 && (
                <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between"
                    style={{ background: 'rgba(0,0,0,0.15)' }}>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-bold text-white">Recent Coach Sessions</span>
                    </div>
                    <button onClick={() => setTab('coach')}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                      Open Chat <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {recentConvos.map(conv => (
                      <div key={conv.id} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/80 font-medium">{conv.metadata?.title || 'Coach Session'}</p>
                          <p className="text-xs text-white/30 mt-0.5">
                            {conv.created_date ? format(new Date(conv.created_date), 'MMM d, yyyy · HH:mm') : ''}
                          </p>
                        </div>
                        <button onClick={() => setTab('coach')}
                          className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/50 hover:text-white hover:border-cyan-400/40 transition-colors">
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-10 text-center border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
              <Brain className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white font-bold mb-2">No insights yet</p>
              <p className="text-white/50 text-sm mb-6">Complete your profile and click below to generate your first AI report.</p>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #00BFFF, #4F6EF7)' }}
              >
                Generate AI Insights
              </button>
            </div>
          )}
        </>
      )}

      {/* ── COACH CHAT TAB ── */}
      {tab === 'coach' && user && (
        <CoachChat userId={user.email} />
      )}
    </div>
  );
}