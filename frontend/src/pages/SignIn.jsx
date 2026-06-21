import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { signIn, friendlyError } from '@/lib/cognitoAuth';
import { useAuth } from '@/lib/AuthContext';

export default function SignIn() {
  const { loginWithTokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await signIn(email.trim().toLowerCase(), password);
      loginWithTokens(tokens);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err?.name === 'UserNotConfirmedException') {
        navigate('/verify', { state: { email: email.trim().toLowerCase() } });
        return;
      }
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Sign in to your account">
      <h1 className="mb-6 text-2xl font-black text-white">Welcome back</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@example.com"
          />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-cyan-400/80 transition hover:text-cyan-300"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/45">
        Don't have an account?{' '}
        <Link to="/sign-up" className="font-semibold text-cyan-400 transition hover:text-cyan-300">
          Sign up free
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
