import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { upsertProfile } from '@/api/userApi';
import { requestAnalysis } from '@/api/aiApi';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

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
    name: '',
    age: '',
    sex: 'male',
    heightCm: '',
    startingWeightKg: '',
    goalWeightKg: '',
    activityLevel: 'moderate',
    primaryGoal: 'lose_weight',
    startDate: new Date().toISOString().split('T')[0],
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

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
    <div className="min-h-screen bg-[#07051A] font-inter text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(0,229,255,0.15),transparent_32%),radial-gradient(circle_at_78%_28%,rgba(255,136,55,0.13),transparent_28%),linear-gradient(135deg,#07051A_0%,#11103A_46%,#041122_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px] opacity-20" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-7 text-center text-2xl font-black tracking-tight">
            Fit<span className="text-cyan-400">Ops</span>
          </div>

          {/* Card */}
          <div className="rounded-[2rem] border border-white/12 bg-white/[0.055] p-7 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
            {/* Step indicator */}
            <div className="mb-8 flex items-center gap-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      i <= step
                        ? 'bg-cyan-400 text-[#07051A]'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold transition-colors ${
                      i === step ? 'text-cyan-400' : 'text-white/35'
                    }`}
                  >
                    {label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-px flex-1 transition-colors ${
                        i < step ? 'bg-cyan-400/50' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 0: Personal */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-black text-white">Tell us about you</h2>
                <Field label="Full name">
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Age">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.age}
                    onChange={(e) => set('age', e.target.value)}
                    placeholder="e.g. 28"
                  />
                </Field>
                <Field label="Sex">
                  <div className="flex gap-2">
                    {['male', 'female', 'other'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('sex', s)}
                        className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold capitalize transition-colors ${
                          form.sex === s
                            ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300'
                            : 'border-white/12 bg-white/[0.04] text-white/50 hover:border-white/25 hover:text-white/75'
                        }`}
                      >
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
                <h2 className="text-xl font-black text-white">Your body stats</h2>
                <Field label="Height (cm)">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.heightCm}
                    onChange={(e) => set('heightCm', e.target.value)}
                    placeholder="e.g. 175"
                  />
                </Field>
                <Field label="Starting weight (kg)">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.startingWeightKg}
                    onChange={(e) => set('startingWeightKg', e.target.value)}
                    placeholder="e.g. 80"
                  />
                </Field>
                <Field label="Goal weight (kg)">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.goalWeightKg}
                    onChange={(e) => set('goalWeightKg', e.target.value)}
                    placeholder="e.g. 70"
                  />
                </Field>
              </div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-black text-white">Your goals</h2>
                <Field label="Activity level">
                  <div className="space-y-2">
                    {activityOptions.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => set('activityLevel', o.value)}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                          form.activityLevel === o.value
                            ? 'border-cyan-400/60 bg-cyan-400/10 text-white'
                            : 'border-white/12 bg-white/[0.03] text-white/60 hover:border-white/22 hover:text-white/80'
                        }`}
                      >
                        <span className="font-semibold">{o.label}</span>
                        <span className="ml-2 text-white/40">{o.desc}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Primary goal">
                  <div className="grid grid-cols-2 gap-2">
                    {goalOptions.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => set('primaryGoal', o.value)}
                        className={`rounded-xl border py-3 text-sm font-semibold transition-colors ${
                          form.primaryGoal === o.value
                            ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300'
                            : 'border-white/12 bg-white/[0.03] text-white/50 hover:border-white/22 hover:text-white/75'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex items-center justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-white/45 transition hover:text-white/75"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01]"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Complete setup'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-cyan-400/60 focus:bg-white/[0.09] focus:ring-1 focus:ring-cyan-400/25';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
        {label}
      </label>
      {children}
    </div>
  );
}
