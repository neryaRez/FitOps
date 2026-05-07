import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { getProfile, upsertProfile } from '@/api/userApi';
import { requestAnalysis } from '@/api/aiApi';
import { getWeightLogs, getMeasurementLogs } from '@/api/progressApi';
import { Save, User, Target } from 'lucide-react';

const activityOptions = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const goalOptions = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'maintain_weight', label: 'Maintain Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'improve_fitness', label: 'Improve Fitness' },
];

export default function Settings() {
  const { user } = useCurrentUser();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user.email).then(p => {
      if (p) setForm({ ...p });
      setLoading(false);
    });
  }, [user]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!user || !form) return;
    setSaving(true);
    await upsertProfile(user.email, form);
    // Trigger AI re-analysis stub
    const [weightLogs, measurementLogs] = await Promise.all([
      getWeightLogs(user.email),
      getMeasurementLogs(user.email),
    ]);
    await requestAnalysis(user.email, form, weightLogs, measurementLogs);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-light border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No profile found. Please complete onboarding first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Update your profile and goals</p>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-brand" />
          <h3 className="font-semibold text-text-primary">Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name">
            <input className="settings-input" value={form.name || ''} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Age">
            <input className="settings-input" type="number" value={form.age || ''} onChange={e => set('age', Number(e.target.value))} />
          </Field>
          <Field label="Sex">
            <select className="settings-input" value={form.sex || 'male'} onChange={e => set('sex', e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Height (cm)">
            <input className="settings-input" type="number" value={form.heightCm || ''} onChange={e => set('heightCm', Number(e.target.value))} />
          </Field>
        </div>
      </div>

      {/* Goals */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <Target className="w-5 h-5 text-brand" />
          <h3 className="font-semibold text-text-primary">Goals & Activity</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Starting weight (kg)">
            <input className="settings-input" type="number" value={form.startingWeightKg || ''} onChange={e => set('startingWeightKg', Number(e.target.value))} />
          </Field>
          <Field label="Goal weight (kg)">
            <input className="settings-input" type="number" value={form.goalWeightKg || ''} onChange={e => set('goalWeightKg', Number(e.target.value))} />
          </Field>
          <Field label="Activity level">
            <select className="settings-input" value={form.activityLevel || 'moderate'} onChange={e => set('activityLevel', e.target.value)}>
              {activityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Primary goal">
            <select className="settings-input" value={form.primaryGoal || 'lose_weight'} onChange={e => set('primaryGoal', e.target.value)}>
              {goalOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-medium hover:bg-brand/90 transition-colors disabled:opacity-60 shadow-md"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
      </button>
      {saved && <p className="text-xs text-green-600">Profile updated and AI insights refreshed.</p>}

      <style>{`
        .settings-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
          background: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
          color: #1D1D2E;
        }
        .settings-input:focus { border-color: #4F6EF7; }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}