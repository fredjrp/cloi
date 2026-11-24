import type {
  AutomationRule,
  FunnelMetrics,
  RuleDraft,
  RuleStatus,
  ValidationErrors,
} from '../types/automation';

/**
 * Parses comma-separated keywords into normalized lowercase tokens.
 */
export function parseKeywords(keywordsInput: string): string[] {
  return keywordsInput
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
}

/**
 * Evaluates whether a viewer's Instagram comment triggers an automation rule.
 */
export function matchKeyword(commentText: string, rule: Pick<AutomationRule, 'keywords' | 'matchType' | 'status'>): {
  matched: boolean;
  matchedKeyword: string | null;
} {
  if (rule.status !== 'active') {
    return { matched: false, matchedKeyword: null };
  }

  const normalizedComment = commentText.trim().toLowerCase();
  if (!normalizedComment) {
    return { matched: false, matchedKeyword: null };
  }

  const tokens = parseKeywords(rule.keywords);
  for (const token of tokens) {
    if (rule.matchType === 'exact') {
      if (normalizedComment === token) {
        return { matched: true, matchedKeyword: token };
      }
    } else {
      // Word-boundary friendly substring check for practical IG comments like "Send me the GUIDE please!"
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      if (regex.test(normalizedComment)) {
        return { matched: true, matchedKeyword: token };
      }
    }
  }

  return { matched: false, matchedKeyword: null };
}

/**
 * Validates an email address cleanly without overly permissive passes.
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

/**
 * Validates an HTTPS/HTTP destination or email capture URL.
 */
export function isValidHttpUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validates a rule draft strictly. Never silently substitutes fallback values.
 */
export function validateRuleDraft(draft: RuleDraft): {
  valid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  if (!draft.name.trim()) {
    errors.name = 'Enter an automation name so clients can identify it in metrics.';
  }

  const keywords = parseKeywords(draft.keywords);
  if (keywords.length === 0) {
    errors.keywords = 'Add at least one trigger keyword (e.g. GUIDE, LINK).';
  }

  if (!draft.publicReply.trim()) {
    errors.publicReply = 'Provide a short public comment reply to confirm the DM was sent.';
  }

  if (draft.followGateEnabled && !draft.followGatePrompt.trim()) {
    errors.followGatePrompt = 'Enter the Follow-Gate message shown to non-followers.';
  }

  if (!draft.destinationButtonLabel.trim()) {
    errors.destinationButtonLabel = 'Enter a button label (e.g. Get the Link).';
  }

  if (!isValidHttpUrl(draft.destinationUrl)) {
    errors.destinationUrl = 'Enter a valid https:// destination URL.';
  }

  if (draft.emailCaptureMode === 'external_link' && !isValidHttpUrl(draft.emailCollectionUrl)) {
    errors.emailCollectionUrl = 'Enter a valid https:// email collection URL.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Computes aggregated retention and conversion funnel metrics across rules.
 */
export function computeFunnelMetrics(rules: AutomationRule[]): FunnelMetrics {
  const totals = rules.reduce(
    (acc, rule) => {
      acc.commentsTriggered += rule.metrics.commentsTriggered;
      acc.dmsSent += rule.metrics.dmsSent;
      acc.followersGained += rule.metrics.followersGained;
      acc.emailsCaptured += rule.metrics.emailsCaptured;
      acc.linkClicks += rule.metrics.linkClicks;
      if (rule.status === 'active') acc.activeRulesCount += 1;
      return acc;
    },
    {
      commentsTriggered: 0,
      dmsSent: 0,
      followersGained: 0,
      emailsCaptured: 0,
      linkClicks: 0,
      activeRulesCount: 0,
    }
  );

  const followConversionRate =
    totals.dmsSent > 0 ? Math.round((totals.followersGained / totals.dmsSent) * 1000) / 10 : 0;
  const emailCaptureRate =
    totals.dmsSent > 0 ? Math.round((totals.emailsCaptured / totals.dmsSent) * 1000) / 10 : 0;
  const linkCtr =
    totals.dmsSent > 0 ? Math.round((totals.linkClicks / totals.dmsSent) * 1000) / 10 : 0;

  return {
    ...totals,
    followConversionRate,
    emailCaptureRate,
    linkCtr,
    totalRulesCount: rules.length,
  };
}

/**
 * Filters automation rules by search query and status.
 */
export function filterRules(
  rules: AutomationRule[],
  searchQuery: string,
  statusFilter: 'all' | RuleStatus
): AutomationRule[] {
  const q = searchQuery.trim().toLowerCase();
  return rules.filter((rule) => {
    if (statusFilter !== 'all' && rule.status !== statusFilter) {
      return false;
    }
    if (!q) return true;
    return (
      rule.name.toLowerCase().includes(q) ||
      rule.keywords.toLowerCase().includes(q) ||
      rule.postTitle.toLowerCase().includes(q) ||
      rule.destinationUrl.toLowerCase().includes(q)
    );
  });
}

/**
 * Calculates onboarding completion percentage from boolean checklist steps.
 */
export function calculateOnboardingProgress(steps: {
  metaConnected: boolean;
  firstRuleConfigured: boolean;
  liveTestPassed: boolean;
}): {
  completedCount: number;
  totalCount: number;
  percent: number;
} {
  const values = [steps.metaConnected, steps.firstRuleConfigured, steps.liveTestPassed];
  const completedCount = values.filter(Boolean).length;
  return {
    completedCount,
    totalCount: values.length,
    percent: Math.round((completedCount / values.length) * 100),
  };
}

/**
 * Determines the next DM state transition in the Follow-Gate + Email Capture flow.
 */
export function resolveNextDmStage(params: {
  rule: Pick<AutomationRule, 'followGateEnabled' | 'emailCaptureMode'>;
  isFollowing: boolean;
  emailCollected: boolean;
}): 'follow_gate_wait' | 'email_gate_wait' | 'link_delivered' {
  if (params.rule.followGateEnabled && !params.isFollowing) {
    return 'follow_gate_wait';
  }
  if (params.rule.emailCaptureMode !== 'none' && !params.emailCollected) {
    return 'email_gate_wait';
  }
  return 'link_delivered';
}

const MAX_VIDEO_BYTES = 150 * 1024 * 1024; // 150 MB
const VIDEO_EXT_REGEX = /\.(mp4|mov|webm|m4v)$/i;

/**
 * Validates an uploaded project video file before attaching it to a rule.
 */
export function validateVideoFile(file: {
  type: string;
  size: number;
  name: string;
}): { valid: boolean; error?: string } {
  const isVideoMime = file.type.startsWith('video/');
  const hasVideoExt = VIDEO_EXT_REGEX.test(file.name);
  if (!isVideoMime && !hasVideoExt) {
    return {
      valid: false,
      error: 'Unsupported file format. Upload an MP4, MOV, or WebM video.',
    };
  }
  if (file.size <= 0) {
    return {
      valid: false,
      error: 'The selected video file is empty.',
    };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return {
      valid: false,
      error: 'Video exceeds the 150 MB client upload limit.',
    };
  }
  return { valid: true };
}

/**
 * Formats byte sizes cleanly for video attachment metadata.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Selects the user's top trending post/rule based on active status and engagement outcomes.
 */
export function getTrendingRule(rules: AutomationRule[]): AutomationRule | null {
  if (rules.length === 0) return null;
  const active = rules.filter((r) => r.status === 'active');
  const pool = active.length > 0 ? active : rules;

  const score = (rule: AutomationRule) =>
    rule.metrics.commentsTriggered +
    rule.metrics.followersGained * 2 +
    rule.metrics.linkClicks;

  return [...pool].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/**
 * Orders posts for vertical IG Reels feed scrolling, placing the trending post first.
 */
export function orderFeedReels(rules: AutomationRule[]): AutomationRule[] {
  if (rules.length <= 1) return [...rules];
  const trending = getTrendingRule(rules);
  if (!trending) return [...rules];
  return [trending, ...rules.filter((r) => r.id !== trending.id)];
}

export type WalkthroughViewerStage =
  | 'reel_watch'
  | 'comment_replied'
  | 'dm_thread'
  | 'unlocked_outcome'
  | 'in_app_form'
  | 'browser_pdf';

export function resolveWalkthroughStageMeta(stage: WalkthroughViewerStage): {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6;
  isDmOpen: boolean;
  isViewerFollowing: boolean;
  hasUnlockedFile: boolean;
  isFormOpen: boolean;
  isPdfOpened: boolean;
} {
  switch (stage) {
    case 'reel_watch':
      return {
        stepNumber: 1,
        isDmOpen: false,
        isViewerFollowing: false,
        hasUnlockedFile: false,
        isFormOpen: false,
        isPdfOpened: false,
      };
    case 'comment_replied':
      return {
        stepNumber: 2,
        isDmOpen: false,
        isViewerFollowing: false,
        hasUnlockedFile: false,
        isFormOpen: false,
        isPdfOpened: false,
      };
    case 'dm_thread':
      return {
        stepNumber: 3,
        isDmOpen: true,
        isViewerFollowing: false,
        hasUnlockedFile: false,
        isFormOpen: false,
        isPdfOpened: false,
      };
    case 'unlocked_outcome':
      return {
        stepNumber: 4,
        isDmOpen: true,
        isViewerFollowing: true,
        hasUnlockedFile: true,
        isFormOpen: false,
        isPdfOpened: false,
      };
    case 'in_app_form':
      return {
        stepNumber: 5,
        isDmOpen: true,
        isViewerFollowing: true,
        hasUnlockedFile: true,
        isFormOpen: true,
        isPdfOpened: false,
      };
    case 'browser_pdf':
      return {
        stepNumber: 6,
        isDmOpen: true,
        isViewerFollowing: true,
        hasUnlockedFile: true,
        isFormOpen: false,
        isPdfOpened: true,
      };
  }
}

