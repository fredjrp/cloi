import { AlertTriangle, ArrowLeft, Loader2, RefreshCw, TrendingDown } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, type ChurnFunnel } from '../lib/api';

/**
 * Where people give up.
 *
 * The funnel is the only screen here that is about the product rather than the
 * customer, and it earns its place: without it you learn that sign-up is broken
 * from users, months later, instead of from a number on the day it changed.
 *
 * Reads are per-install ("sessions"), not per-event, so opening the app five times
 * still counts as one person.
 */
interface ChurnScreenProps {
  onClose: () => void;
}

const LABELS: Record<string, string> = {
  'app.open': 'Opened the app',
  'welcome.view': 'Saw the walkthrough',
  'welcome.complete': 'Finished the walkthrough',
  'auth.start': 'Started signing up',
  'auth.success': 'Account created',
  'connect.start': 'Started connecting Instagram',
  'connect.success': 'Instagram connected',
  'campaign.start': 'Started a campaign',
  'campaign.saved': 'Saved a campaign',
  'feedback.open': 'Sent feedback',
};

export function ChurnScreen({ onClose }: ChurnScreenProps) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ChurnFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (window: number) => {
    setLoading(true);
    setError('');
    try {
      setData(await api.funnel(window));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Could not load the funnel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const top = data?.steps[0]?.sessions ?? 0;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="sticky top-0 z-10 border-b border-[#E5E5EA] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F5F5F7]"
            >
              <ArrowLeft className="h-5 w-5 text-[#1D1D1F]" />
            </button>
            <h1 className="font-display text-sm font-semibold text-[#1D1D1F]">Where people leave</h1>
          </div>
          <button
            type="button"
            onClick={() => load(days)}
            aria-label="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F5F5F7]"
          >
            <RefreshCw className={`h-4 w-4 text-[#6E6E73] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* window */}
        <div className="mb-5 inline-flex rounded-xl bg-white p-1 ring-1 ring-[#E5E5EA]">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`min-h-[34px] rounded-lg px-3 text-xs font-medium transition ${
                days === d ? 'bg-[#1D1D1F] text-white' : 'text-[#6E6E73]'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#6E6E73]" />
          </div>
        ) :!data || top === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D1D1D6] bg-white/60 px-6 py-16 text-center">
            <p className="font-display text-base font-semibold text-[#1D1D1F]">Not enough data yet</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#6E6E73]">
              The funnel fills in as people use the app. Nothing has been recorded in the
              last {days} days.
            </p>
          </div>
        ) : (
          <>
            {data.worst_drop && data.worst_drop.sessions < top && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs font-semibold text-amber-900">Biggest drop-off</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                    <span className="font-medium">
                      {data.worst_drop.drop_from_previous_pct}% left at “{LABELS[data.worst_drop.step] ?? data.worst_drop.step}”
                    </span>
                    . That is the step to fix first.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {data.steps.map((step) => {
                const pct = top ? Math.round((step.sessions / top) * 100) : 0;
                const dropped = step.drop_from_previous_pct ?? 0;
                const isWorst = data.worst_drop?.step === step.step;
                return (
                  <div key={step.step} className="rounded-xl bg-white p-3 ring-1 ring-[#E5E5EA]">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-[#1D1D1F]">
                        {LABELS[step.step] ?? step.step}
                      </span>
                      <span className="shrink-0 font-mono-tabular text-xs text-[#6E6E73]">
                        {step.sessions}
                        <span className="ml-1 text-[#A1A1A6]">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#F5F5F7]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isWorst ? 'bg-amber-500' : 'bg-[#0071E3]'
                        }`}
                        style={{ width: `${Math.max(pct, step.sessions > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                    {dropped > 0 && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700">
                        <TrendingDown className="h-3 w-3" />
                        {dropped}% left here
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-[#A1A1A6]">
              Counts are per install, not per event. Sign-up steps are attributed back to
              the install that performed them.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
