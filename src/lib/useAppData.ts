import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, type Account, type Funnel, type Rule } from './api';
import { clearToken } from './auth';
import type {
  AutomationRule,
  FunnelMetrics,
  MatchType,
  MetaAccountState,
  ReelPost,
  WeeklyTrendPoint,
} from '../types/automation';

/**
 * Loads the real account data and maps it onto the shapes the existing screens
 * already render, so replacing seedData does not mean rewriting every component.
 *
 * The mapping is deliberate rather than shallow:
 *  - the API speaks snake_case and the UI speaks camelCase
 *  - the API's match modes are `whole | partial`, the UI's are `exact | contains`
 *  - the API has no 7-day series, so the trend chart is derived from the funnel
 */

const MATCH_TO_UI: Record<string, MatchType> = {
  whole: 'exact',
  partial: 'contains',
  contains: 'contains',
  exact: 'exact',
};

const MATCH_TO_API: Record<MatchType, string> = {
  exact: 'whole',
  contains: 'partial',
};

export function ruleToAutomationRule(r: Rule): AutomationRule {
  return {
    id: r.id,
    name: r.name,
    postId: 'any',
    postTitle: r.ig_handle ? `@${r.ig_handle}` : 'Any reel',
    thumbnailUrl: '',
    keywords: r.keywords,
    matchType: MATCH_TO_UI[r.match_type] ?? 'exact',
    publicReply: r.public_reply,
    followGateEnabled: r.follow_gate_enabled,
    followGatePrompt: r.follow_gate_prompt,
    followGateButtonLabel: r.follow_gate_button_label || 'I followed',
    emailCaptureMode:
      r.email_capture_mode === 'external_link'
        ? 'external_link'
        : r.email_capture_mode === 'in_dm'
          ? 'in_dm'
          : 'none',
    emailPrompt: r.email_prompt,
    emailCollectionUrl: r.email_collection_url,
    destinationButtonLabel: r.destination_button_label || 'Open link',
    destinationUrl: r.destination_url,
    status: r.status,
    updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—',
    metrics: {
      commentsTriggered: r.metrics.comments_triggered,
      dmsSent: r.metrics.dms_sent,
      followersGained: r.metrics.followers_gained,
      emailsCaptured: r.metrics.emails_captured,
      linkClicks: r.metrics.link_clicks,
    },
  };
}

export function accountToMetaState(a: Account | null): MetaAccountState {
  return {
    connected: !!a?.connected,
    igHandle: a?.ig_handle ?? '',
    accountName: a?.account_name ?? '',
    avatarUrl: a?.avatar_url ?? '',
    followersCount: 0,
    metaPageName: a?.account_name ?? '',
    hourlyDmUsed: 0,
    hourlyDmLimit: 200,
    webhookHealthy: !!a?.webhook_healthy,
  };
}

export function funnelToMetrics(f: Funnel | null, rules: AutomationRule[]): FunnelMetrics {
  const base: FunnelMetrics = {
    commentsTriggered: f?.leads ?? 0,
    dmsSent: f?.leads ?? 0,
    followersGained: f?.followed ?? 0,
    emailsCaptured: f?.emails ?? 0,
    linkClicks: f?.clicked ?? 0,
    followConversionRate: f?.follow_rate ?? 0,
    emailCaptureRate: f?.email_rate ?? 0,
    linkCtr: f?.click_rate ?? 0,
    activeRulesCount: f?.active_rules ?? rules.filter((r) => r.status === 'active').length,
    totalRulesCount: f?.total_rules ?? rules.length,
  };
  return base;
}

/**
 * There is no historical series endpoint yet, so the chart shows the funnel spread
 * across the last seven days rather than inventing a made-up curve. When a real
 * series exists this is the only function that changes.
 */
export function funnelToTrends(f: Funnel | null): WeeklyTrendPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (!f) return days.map((day) => ({ day, dmsSent: 0, followersGained: 0, emailsCaptured: 0 }));
  const perDay = (n: number) => Math.round(n / 7);
  return days.map((day) => ({
    day,
    dmsSent: perDay(f.leads),
    followersGained: perDay(f.followed),
    emailsCaptured: perDay(f.emails),
  }));
}

export interface AppData {
  loading: boolean;
  error: string;
  account: MetaAccountState;
  rules: AutomationRule[];
  metrics: FunnelMetrics;
  trends: WeeklyTrendPoint[];
  posts: ReelPost[];
  rawRules: Rule[];
  refresh: () => Promise<void>;
}

export function useAppData(enabled: boolean): AppData {
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [account, setAccount] = useState<MetaAccountState>(accountToMetaState(null));
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [rawRules, setRawRules] = useState<Rule[]>([]);
  const [metrics, setMetrics] = useState<FunnelMetrics>(funnelToMetrics(null, []));
  const [trends, setTrends] = useState<WeeklyTrendPoint[]>(funnelToTrends(null));
  const [posts, setPosts] = useState<ReelPost[]>([]);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      // One round of parallel calls: three requests instead of three sequential waits.
      const [me, funnel, campaigns, postList] = await Promise.all([
        api.me().catch(() => null),
        api.metrics().catch(() => null),
        api.campaigns().catch(() => [] as Rule[]),
        api.posts().catch(() => []),
      ]);
      if (!mounted.current) return;

      const mapped = campaigns.map(ruleToAutomationRule);
      setAccount(accountToMetaState(me));
      setRawRules(campaigns);
      setRules(mapped);
      setMetrics(funnelToMetrics(funnel, mapped));
      setTrends(funnelToTrends(funnel));
      setPosts(
        postList.map((p) => ({
          id: p.id,
          title: p.title,
          caption: p.caption,
          publishedAt: p.published_at,
          thumbnailUrl: p.thumbnail_url,
          commentCount: 0,
        })),
      );
    } catch (err) {
      if (!mounted.current) return;
      if (err instanceof ApiError && err.status === 401) {
        await clearToken();
        setError('Your session expired. Please sign in again.');
      } else {
        setError(err instanceof ApiError ? err.detail : 'Could not load your data.');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  return { loading, error, account, rules, metrics, trends, posts, rawRules, refresh };
}

export { MATCH_TO_API };
