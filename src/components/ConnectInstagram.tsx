import { Check, ExternalLink, Instagram, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, ApiError, type Account } from '../lib/api';
import { API_BASE } from '../lib/api';
import { track } from '../lib/analytics';

/**
 * Instagram connection screen.
 *
 * Connecting an account needs a browser round-trip to Meta, which cannot happen
 * inside the WebView. So this screen opens the real OAuth URL in the system browser
 * and then re-checks /me when the user comes back.
 *
 * On return the app must know whether the connection succeeded, and the reliable
 * signal is the backend itself - not a deep link that may or may not fire. So the
 * screen polls /me while it is foregrounded, with a manual refresh as a backstop.
 */
interface ConnectInstagramProps {
  onConnected: (account: Account) => void;
  onSkip?: () => void;
}

export function ConnectInstagram({ onConnected, onSkip }: ConnectInstagramProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  const check = async () => {
    setChecking(true);
    setError('');
    try {
      const me = await api.me();
      setAccount(me);
      if (me.connected) {
        track('connect.success', 'connect');
        onConnected(me);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Could not reach the server.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
    // Re-check whenever the app regains focus, which is what happens after the
    // user finishes the OAuth flow in the system browser.
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectInBrowser = () => {
    track('connect.start', 'connect');
    const url = `${API_BASE}/social-accounts/connect/instagram_login/`;
    window.open(url, '_system');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] shadow-sm">
            <Instagram className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1D1D1F]">
            Connect Instagram
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6E6E73]">
            Link the account whose reels you want to automate. Comments on those reels
            become DMs.
          </p>
        </div>

        {account?.connected ? (
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              {account.avatar_url ? (
                <img
                  src={account.avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-[#E5E5EA]"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F7]">
                  <Instagram className="h-6 w-6 text-[#6E6E73]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1D1D1F]">
                  @{account.ig_handle}
                </p>
                <p className="truncate text-xs text-[#6E6E73]">{account.account_name}</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                <Check className="h-3 w-3" /> linked
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F5F5F7] px-3 py-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-[11px] leading-relaxed text-[#6E6E73]">
                Webhook {account.webhook_healthy ? 'healthy' : 'not confirmed'} · messages
                are matched every minute
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
            <p className="text-sm leading-relaxed text-[#1D1D1F]">
              No Instagram account is linked yet. You will be taken to Instagram to
              approve access, then brought back here.
            </p>

            <button
              type="button"
              onClick={connectInBrowser}
              className="mt-4 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1D1D1F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
            >
              <ExternalLink className="h-4 w-4" /> Open Instagram
            </button>

            <button
              type="button"
              onClick={check}
              disabled={checking}
              className="mt-2 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#E5E5EA] bg-white px-4 py-2.5 text-sm font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7] disabled:opacity-50"
            >
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" /> I have connected it
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800"
          >
            {error}
          </div>
        )}

        {onSkip && !account?.connected && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-6 block w-full text-center text-xs text-[#6E6E73] underline underline-offset-2"
          >
            Continue without connecting
          </button>
        )}
      </div>
    </div>
  );
}
