import { ArrowLeft, Bug, CheckCircle2, Heart, Lightbulb, Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { API_BASE, ApiError } from '../lib/api';
import { deviceId, track } from '../lib/analytics';

/**
 * Feedback, reachable from anywhere including before sign-in.
 *
 * Deliberately accepts anonymous submissions: the person who cannot get past the
 * login screen is the one whose complaint matters most, and requiring an account to
 * report that is circular.
 */
type Kind = 'idea' | 'bug' | 'love';

interface FeedbackScreenProps {
  onClose: () => void;
  defaultEmail?: string;
}

const KINDS: { id: Kind; label: string; icon: typeof Lightbulb; hint: string }[] = [
  { id: 'idea', label: 'Suggestion', icon: Lightbulb, hint: 'Something that would make this better' },
  { id: 'bug', label: 'Problem', icon: Bug, hint: 'Something that is broken or confusing' },
  { id: 'love', label: 'Something good', icon: Heart, hint: 'Something that worked well' },
];

export function FeedbackScreen({ onClose, defaultEmail = '' }: FeedbackScreenProps) {
  const [kind, setKind] = useState<Kind>('idea');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/mobile/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: await deviceId(),
          kind,
          message: message.trim(),
          email: email.trim(),
          screen: 'feedback',
          app_version: (import.meta.env.VITE_APP_VERSION as string) || '1.0.0',
        }),
      });
      if (!res.ok) throw new ApiError(res.status, 'Could not send. Please try again.');
      await track('feedback.open', 'feedback', { kind, length: message.trim().length });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Could not send. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="sticky top-0 z-10 border-b border-[#E5E5EA] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F5F5F7]"
          >
            <ArrowLeft className="h-5 w-5 text-[#1D1D1F]" />
          </button>
          <h1 className="font-display text-sm font-semibold text-[#1D1D1F]">Send feedback</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {sent ? (
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="font-display text-lg font-semibold text-[#1D1D1F]">Thank you</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#6E6E73]">
              We read every message. If you left an email we will reply.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#1D1D1F] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm"
          >
            <p className="mb-3 text-xs font-medium text-[#1D1D1F]">What kind of feedback?</p>
            <div className="mb-5 grid grid-cols-3 gap-2">
              {KINDS.map((k) => {
                const Icon = k.icon;
                const active = kind === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-medium transition ${
                      active
                        ? 'border-[#0071E3] bg-[#0071E3]/5 text-[#0071E3]'
                        : 'border-[#E5E5EA] bg-white text-[#6E6E73]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {k.label}
                  </button>
                );
              })}
            </div>

            <label htmlFor="msg" className="mb-1.5 block text-xs font-medium text-[#1D1D1F]">
              Your message
            </label>
            <textarea
              id="msg"
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={KINDS.find((k) => k.id === kind)?.hint}
              className="mb-4 w-full rounded-xl border border-[#E5E5EA] bg-white px-3 py-2.5 text-sm text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
            />

            <label htmlFor="fb-email" className="mb-1.5 block text-xs font-medium text-[#1D1D1F]">
              Email <span className="font-normal text-[#A1A1A6]">optional, if you want a reply</span>
            </label>
            <input
              id="fb-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-4 w-full min-h-[44px] rounded-xl border border-[#E5E5EA] bg-white px-3 py-2.5 text-sm text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
            />

            {error && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !message.trim()}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0071E3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0062C4] disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {busy ? 'Sending…' : 'Send feedback'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
