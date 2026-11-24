import { ArrowRight, Loader2, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { setToken, setWorkspace } from '../lib/auth';
import { track } from '../lib/analytics';

/**
 * Sign-in / sign-up screen.
 *
 * Which mode opens first depends on how the person arrived:
 *   - from the welcome slides (new user)  -> "Create account"
 *   - returning user, or "I already have" -> "Sign in"
 *
 * Both are on the same screen with a toggle, because someone who picked the wrong
 * door should not have to go back three steps to find the other one.
 */
export type AuthMode = 'signin' | 'signup';

interface LoginScreenProps {
  initialMode?: AuthMode;
  onSignedIn: () => void;
}

export function LoginScreen({ initialMode = 'signin', onSignedIn }: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isSignup = mode === 'signup';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    // Tell the user what is missing rather than leaving the button inert.
    if (!email.trim()) { setError('Enter your email address.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('That email address does not look right.'); return; }
    if (!password) { setError('Enter a password.'); return; }
    if (isSignup && password.length < 8) { setError('Use at least 8 characters for your password.'); return; }

    setError('');
    setBusy(true);
    track('auth.start', 'auth', { mode });
    try {
      const result = isSignup
        ? await api.signup(email.trim(), password, name.trim())
        : await api.login(email.trim(), password);
      await setToken(result.token, result.email);
      await setWorkspace(result.workspace_id);
      track('auth.success', 'auth', { mode });
      onSignedIn();
    } catch (err) {
      let msg = 'Something went wrong. Please try again.';
      if (err instanceof ApiError) {
        if (err.status === 0) msg = err.detail;
        else if (err.status === 401) msg = 'That email and password do not match an account.';
        else if (err.status === 409) msg = 'An account with that email already exists. Sign in instead.';
        else if (err.status === 403) msg = err.detail;
        else msg = err.detail;
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[#F5F5F7]">
      <header className="shrink-0 px-6 pb-2 text-center" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 36px)' }}>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D1D1F] shadow-sm">
          <span className="font-display text-2xl font-bold text-white">C</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#1D1D1F]">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-1.5 text-sm text-[#6E6E73]">
          {isSignup
            ? 'Free to start. Connect Instagram after this.'
            : 'Sign in to your CloiDm workspace.'}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)' }}>
        <form
          onSubmit={submit}
          className="mx-auto mt-6 w-full max-w-sm rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm"
        >
          {/* mode toggle */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-[#F5F5F7] p-1">
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`min-h-[36px] rounded-lg text-xs font-medium transition ${
                isSignup ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#6E6E73]'
              }`}
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`min-h-[36px] rounded-lg text-xs font-medium transition ${
                !isSignup ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#6E6E73]'
              }`}
            >
              Sign in
            </button>
          </div>

          {isSignup && (
            <>
              <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-[#1D1D1F]">
                Name <span className="font-normal text-[#A1A1A6]">optional</span>
              </label>
              <div className="relative mb-4">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1A6]" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full min-h-[44px] rounded-xl border border-[#E5E5EA] bg-white pl-10 pr-3 py-2.5 text-sm text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                />
              </div>
            </>
          )}

          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-[#1D1D1F]">
            Email
          </label>
          <div className="relative mb-4">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1A6]" />
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full min-h-[44px] rounded-xl border border-[#E5E5EA] bg-white pl-10 pr-3 py-2.5 text-sm text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
            />
          </div>

          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[#1D1D1F]">
            Password
          </label>
          <div className="relative mb-1.5">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1A6]" />
            <input
              id="password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
              className="w-full min-h-[44px] rounded-xl border border-[#E5E5EA] bg-white pl-10 pr-3 py-2.5 text-sm text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
            />
          </div>
          {isSignup && (
            <p className="mb-4 text-[11px] text-[#A1A1A6]">
              {password.length > 0 && password.length < 8
                ? `${8 - password.length} more characters needed`
                : 'At least 8 characters.'}
            </p>
          )}
          {!isSignup && <div className="mb-4" />}

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-800"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0071E3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0062C4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isSignup ? 'Creating…' : 'Signing in…'}
              </>
            ) : (
              <>
                {isSignup ? 'Create account' : 'Sign in'} <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {isSignup && (
            <p className="mt-4 text-center text-[11px] leading-relaxed text-[#A1A1A6]">
              By creating an account you agree to use Instagram's official login. We never
              see your Instagram password.
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
