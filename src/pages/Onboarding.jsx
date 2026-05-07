import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { upsertProfile } from '@/api/userApi';
import { requestAnalysis } from '@/api/aiApi';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = ['Personal', 'Body', 'Goals'];

const activityOptions = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Light', desc: '1–3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
  { value: 'active', label: 'Active', desc: '6–7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Hard exercise daily' },
];

const goalOptions = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'maintain_weight', label: 'Maintain Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'improve_fitness', label: 'Improve Fitness' },
];

export default function Onboarding() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', age: '', sex: 'male',
    heightCm: '', startingWeightKg: '', goalWeightKg: '',
    activityLevel: 'moderate', primaryGoal: 'lose_weight',
    startDate: new Date().toISOString().split('T')[0],
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    const profile = {
      ...form,
      userId: user.email,
      age: Number(form.age),
      heightCm: Number(form.heightCm),
      startingWeightKg: Number(form.startingWeightKg),
      goalWeightKg: Number(form.goalWeightKg),
    };
    await upsertProfile(user.email, profile);
    await requestAnalysis(user.email, profile);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-8">
        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${i <= step ? 'bg-brand text-white' : 'bg-surface text-muted-foreground'}`}>
                {i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? 'text-brand' : 'text-muted-foreground'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-brand' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Personal */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-text-primary">Tell us about you</h2>
            <Field label="Full name">
              <input className="fitops-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Age">
              <input className="fitops-input" type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="e.g. 28" />
            </Field>
            <Field label="Sex">
              <div className="flex gap-3">
                {['male', 'female', 'other'].map(s => (
                  <button key={s} onClick={() => set('sex', s)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${form.sex === s ? 'bg-brand text-white border-brand' : 'border-border text-muted-foreground hover:border-brand'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* Step 1: Body */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-text-primary">Your body stats</h2>
            <Field label="Height (cm)">
              <input className="fitops-input" type="number" value={form.heightCm} onChange={e => set('heightCm', e.target.value)} placeholder="e.g. 175" />
            </Field>
            <Field label="Starting weight (kg)">
              <input className="fitops-input" type="number" value={form.startingWeightKg} onChange={e => set('startingWeightKg', e.target.value)} placeholder="e.g. 80" />
            </Field>
            <Field label="Goal weight (kg)">
              <input className="fitops-input" type="number" value={form.goalWeightKg} onChange={e => set('goalWeightKg', e.target.value)} placeholder="e.g. 70" />
            </Field>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-text-primary">Your goals</h2>
            <Field label="Activity level">
              <div className="space-y-2">
                {activityOptions.map(o => (
                  <button key={o.value} onClick={() => set('activityLevel', o.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${form.activityLevel === o.value ? 'bg-brand-light border-brand text-brand' : 'border-border hover:border-brand'}`}>
                    <span className="font-medium">{o.label}</span>
                    <span className="text-muted-foreground ml-2">{o.desc}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Primary goal">
              <div className="grid grid-cols-2 gap-2">
                {goalOptions.map(o => (
                  <button key={o.value} onClick={() => set('primaryGoal', o.value)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.primaryGoal === o.value ? 'bg-brand text-white border-brand' : 'border-border text-muted-foreground hover:border-brand'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext} className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : 'Complete setup'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .fitops-input {
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
        .fitops-input:focus { border-color: #4F6EF7; }
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