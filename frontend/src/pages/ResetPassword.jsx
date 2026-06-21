import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { confirmForgotPassword, friendlyError } from '@/lib/cognitoAuth';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const failing = PASSWORD_RULES.filter((r) => !r.test(password));
    if (failing.length > 0) {
      setError('Password must meet all requirements.');
      setShowRules(true);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await confirmForgotPassword(email.trim().toLowerCase(), code.trim(), password);
      navigate('/sign-in', {
        replace: true,
        state: { email: email.trim().toLowerCase(), fromReset: true },
      });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const allRulesMet = PASSWORD_RULES.every((r) => r.test(password));

  return (
    <AuthLayout subtitle="Create a new password">
      <h1 className="mb-6 text-2xl font-black text-white">Reset password</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!location.state?.email && (
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@example.com"
            />
          </Field>
        )}

        <Field label="Reset code">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={`${inputCls} text-center text-lg tracking-[0.3em]`}
            placeholder="000000"
          />
        </Field>

        <Field label="New password">
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setShowRules(true)}
              className={`${inputCls} pr-10`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/65"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {(showRules || password) && (
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                  <li key={rule.label} className="flex items-center gap-2 text-xs">
                    <CheckCircle
                      className={`h-3.5 w-3.5 flex-shrink-0 transition ${ok ? 'text-emerald-400' : 'text-white/25'}`}
                    />
                    <span className={ok ? 'text-white/70' : 'text-white/35'}>{rule.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Field>

        <Field label="Confirm new password">
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            placeholder="••••••••"
          />
        </Field>

        {error && <ErrorBox>{error}</ErrorBox>}

        <button
          type="submit"
          disabled={loading || !allRulesMet}
          className="mt-1 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            'Set new password'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/45">
        <Link to="/sign-in" className="font-semibold text-cyan-400 transition hover:text-cyan-300">
          ← Back to sign in
        </Link>
      </p>
    </AuthLayout>
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

function ErrorBox({ children }) {
  return (
    <p className="rounded-xl border border-orange-400/25 bg-orange-400/10 px-4 py-3 text-sm text-orange-300">
      {children}
    </p>
  );
}
