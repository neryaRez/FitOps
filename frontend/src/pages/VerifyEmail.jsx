import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MailCheck, Loader2, RefreshCw } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { confirmSignUp, resendConfirmationCode, friendlyError } from '@/lib/cognitoAuth';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email ?? '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await confirmSignUp(email.trim().toLowerCase(), code.trim());
      navigate('/sign-in', {
        replace: true,
        state: { email: email.trim().toLowerCase(), fromVerify: true },
      });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    setError('');
    setResending(true);
    try {
      await resendConfirmationCode(email.trim().toLowerCase());
      setResent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout subtitle="Verify your email address">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10">
          <MailCheck className="h-7 w-7 text-cyan-300" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Check your email</h1>
          <p className="mt-1 text-sm text-white/50">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-white/80">{email || 'your email'}</span>
          </p>
        </div>
      </div>

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

        <Field label="Verification code">
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

        {error && <ErrorBox>{error}</ErrorBox>}

        {resent && (
          <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            A new code has been sent to your email.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="mt-1 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Verify email'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="inline-flex items-center gap-1.5 text-sm text-white/45 transition hover:text-white/70 disabled:opacity-60"
        >
          {resending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Resend code
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-white/35">
        <Link to="/sign-in" className="text-white/45 transition hover:text-white/70">
          Back to sign in
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
