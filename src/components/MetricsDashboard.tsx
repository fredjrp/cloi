import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Mail,
  Pause,
  Play,
  Plus,
  Search,
  Smartphone,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type {
  AutomationRule,
  MetaAccountState,
  ReelPost,
  RuleDraft,
  RuleStatus,
  SimulatorStage,
  WeeklyTrendPoint,
} from '../types/automation';
import {
  computeFunnelMetrics,
  filterRules,
  getTrendingRule,
  isValidEmail,
  isValidHttpUrl,
  matchKeyword,
  resolveNextDmStage,
} from '../utils/automationLogic';
import { IPhoneIgMockup, type IPhoneScreenMode } from './IPhoneIgMockup';
import { SafeImage } from './SafeImage';

interface MetricsDashboardProps {
  account: MetaAccountState;
  posts: ReelPost[];
  rules: AutomationRule[];
  weeklyTrends: WeeklyTrendPoint[];
  onToggleRuleStatus: (ruleId: string) => void;
  onEditRule: (ruleId: string) => void;
  onQuickUpdateRule: (
    ruleId: string,
    updates: {
      keywords: string;
      destinationUrl: string;
      followGateEnabled: boolean;
      destinationButtonLabel?: string;
    }
  ) => void;
  onCreateNewRule: () => void;
  onDeleteRule: (ruleId: string) => void;
  onOpenOnboarding: () => void;
}

function toPreviewDraft(rule: AutomationRule, posts: ReelPost[]): RuleDraft {
  const fallbackThumb = posts[1]?.thumbnailUrl ?? posts[0]?.thumbnailUrl ?? '';
  return {
    id: rule.id,
    name: rule.name,
    postId: rule.postId,
    postTitle: rule.postTitle,
    thumbnailUrl: rule.thumbnailUrl || fallbackThumb,
    videoUrl: rule.videoUrl,
    videoName: rule.videoName,
    videoSizeBytes: rule.videoSizeBytes,
    caption: rule.caption,
    keywords: rule.keywords,
    matchType: rule.matchType,
    publicReply: rule.publicReply,
    followGateEnabled: rule.followGateEnabled,
    followGatePrompt: rule.followGatePrompt,
    followGateButtonLabel: rule.followGateButtonLabel,
    emailCaptureMode: rule.emailCaptureMode,
    emailPrompt: rule.emailPrompt,
    emailCollectionUrl: rule.emailCollectionUrl,
    destinationButtonLabel: rule.destinationButtonLabel,
    destinationUrl: rule.destinationUrl,
    status: rule.status,
  };
}

export function MetricsDashboard({
  account,
  posts,
  rules,
  weeklyTrends,
  onToggleRuleStatus,
  onEditRule,
  onQuickUpdateRule,
  onCreateNewRule,
  onDeleteRule,
  onOpenOnboarding,
}: MetricsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RuleStatus>('all');
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(
    weeklyTrends[weeklyTrends.length - 1]?.day ?? 'Sun'
  );

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editOrigin, setEditOrigin] = useState<'trending' | 'list' | null>(null);
  const [editKeywords, setEditKeywords] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editButtonLabel, setEditButtonLabel] = useState('');
  const [editFollowGate, setEditFollowGate] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [savedRuleId, setSavedRuleId] = useState<string | null>(null);

  const trendingRule = getTrendingRule(rules);
  const [previewRuleId, setPreviewRuleId] = useState<string | null>(trendingRule?.id ?? null);

  const previewRule =
    rules.find((r) => r.id === previewRuleId) ?? trendingRule ?? rules[0] ?? null;

  // Interactive iPhone state for the Trending Post showcase
  const [screenMode, setScreenMode] = useState<IPhoneScreenMode>('reel');
  const [viewerFollowing, setViewerFollowing] = useState(false);
  const [simComment, setSimComment] = useState(() => {
    const firstWord = previewRule?.keywords.split(',')[0]?.trim() || 'GRID';
    return `Send me the ${firstWord} please!`;
  });
  const [simStage, setSimStage] = useState<SimulatorStage>('idle');
  const [simMatchedWord, setSimMatchedWord] = useState<string | null>(null);
  const [simMismatchNotice, setSimMismatchNotice] = useState<string | null>(null);
  const [simEmailInput, setSimEmailInput] = useState('');
  const [simEmailError, setSimEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewRule) return;
    const firstWord = previewRule.keywords.split(',')[0]?.trim() || 'GUIDE';
    setSimComment(`Send me the ${firstWord} please!`);
    setSimStage('idle');
    setSimMatchedWord(null);
    setSimMismatchNotice(null);
    setSimEmailInput('');
    setSimEmailError(null);
  }, [previewRule?.id]);

  const summary = computeFunnelMetrics(rules);
  const visibleRules = filterRules(rules, searchQuery, statusFilter);
  const maxDailyDms = Math.max(...weeklyTrends.map((d) => d.dmsSent), 1);
  const activeDayStats = weeklyTrends.find((d) => d.day === selectedDay) ?? weeklyTrends[0];

  const funnelStages = [
    {
      label: 'People who commented',
      count: summary.commentsTriggered,
      rateLabel: '100% started',
      widthPct: 100,
    },
    {
      label: 'Messages delivered',
      count: summary.dmsSent,
      rateLabel:
        summary.commentsTriggered > 0
          ? `${Math.round((summary.dmsSent / summary.commentsTriggered) * 100)}% reached`
          : '0% reached',
      widthPct:
        summary.commentsTriggered > 0
          ? Math.round((summary.dmsSent / summary.commentsTriggered) * 100)
          : 0,
    },
    {
      label: 'New followers gained',
      count: summary.followersGained,
      rateLabel: `${summary.followConversionRate}% followed you`,
      widthPct:
        summary.dmsSent > 0 ? Math.round((summary.followersGained / summary.dmsSent) * 100) : 0,
    },
    {
      label: 'Emails saved',
      count: summary.emailsCaptured,
      rateLabel: `${summary.emailCaptureRate}% shared email`,
      widthPct:
        summary.dmsSent > 0 ? Math.round((summary.emailsCaptured / summary.dmsSent) * 100) : 0,
    },
    {
      label: 'Link button taps',
      count: summary.linkClicks,
      rateLabel: `${summary.linkCtr}% tapped your link`,
      widthPct:
        summary.dmsSent > 0 ? Math.round((summary.linkClicks / summary.dmsSent) * 100) : 0,
    },
  ];

  const resetPreviewFlow = () => {
    setSimStage('idle');
    setSimMatchedWord(null);
    setSimMismatchNotice(null);
    setSimEmailInput('');
    setSimEmailError(null);
  };

  const handleRunPreviewComment = () => {
    if (!previewRule) return;
    setSimMismatchNotice(null);
    setSimEmailError(null);

    const result = matchKeyword(simComment, {
      keywords: previewRule.keywords,
      matchType: previewRule.matchType,
      status: 'active',
    });

    if (!result.matched) {
      setSimStage('idle');
      setSimMatchedWord(null);
      setSimMismatchNotice(
        `Try commenting one of your magic words (${previewRule.keywords || 'GUIDE'}).`
      );
      return;
    }

    setSimMatchedWord(result.matchedKeyword);
    const nextStage = resolveNextDmStage({
      rule: {
        followGateEnabled: previewRule.followGateEnabled,
        emailCaptureMode: previewRule.emailCaptureMode,
      },
      isFollowing: viewerFollowing,
      emailCollected: false,
    });
    setSimStage(nextStage);
    setScreenMode('dm');
  };

  const handlePreviewFollowVerified = () => {
    if (!previewRule) return;
    setViewerFollowing(true);
    const nextStage = resolveNextDmStage({
      rule: {
        followGateEnabled: previewRule.followGateEnabled,
        emailCaptureMode: previewRule.emailCaptureMode,
      },
      isFollowing: true,
      emailCollected: false,
    });
    setSimStage(nextStage);
  };

  const handlePreviewEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewRule) return;
    if (previewRule.emailCaptureMode === 'in_dm' && !isValidEmail(simEmailInput)) {
      setSimEmailError('Please enter a valid email address.');
      return;
    }
    setSimEmailError(null);
    setSimStage('link_delivered');
  };

  const previewDraft: RuleDraft | null = previewRule ? toPreviewDraft(previewRule, posts) : null;
  const isShowingTrending = Boolean(
    trendingRule && previewRule && trendingRule.id === previewRule.id
  );

  const openInlineEditor = (rule: AutomationRule, origin: 'trending' | 'list') => {
    if (editingRuleId === rule.id && editOrigin === origin) {
      setEditingRuleId(null);
      setEditOrigin(null);
      setEditError(null);
      return;
    }
    setPreviewRuleId(rule.id);
    setEditingRuleId(rule.id);
    setEditOrigin(origin);
    setEditKeywords(rule.keywords);
    setEditUrl(rule.destinationUrl);
    setEditButtonLabel(rule.destinationButtonLabel || 'Get the Link');
    setEditFollowGate(rule.followGateEnabled);
    setEditError(null);
  };

  const closeInlineEditor = () => {
    setEditingRuleId(null);
    setEditOrigin(null);
    setEditError(null);
  };

  const handleSaveInlineEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRuleId) return;
    if (!editKeywords.trim()) {
      setEditError('Please add at least one comment word.');
      return;
    }
    if (!isValidHttpUrl(editUrl)) {
      setEditError('Please enter a valid link starting with https://');
      return;
    }
    const targetId = editingRuleId;
    onQuickUpdateRule(targetId, {
      keywords: editKeywords.trim(),
      destinationUrl: editUrl.trim(),
      followGateEnabled: editFollowGate,
      destinationButtonLabel: editButtonLabel.trim() || 'Get the Link',
    });
    setEditingRuleId(null);
    setEditOrigin(null);
    setEditError(null);
    setSavedRuleId(targetId);
    window.setTimeout(() => {
      setSavedRuleId((curr) => (curr === targetId ? null : curr));
    }, 2000);
  };

  const renderInlineEditor = (
    rule: AutomationRule,
    origin: 'trending' | 'list',
    idSuffix: string
  ) => (
    <motion.form
      key={`exe-editor-${rule.id}-${origin}`}
      data-testid="exe-inline-editor"
      onSubmit={handleSaveInlineEditor}
      initial={{ opacity: 0, scaleY: 0.92, y: -6 }}
      animate={{ opacity: 1, scaleY: 1, y: 0 }}
      exit={{ opacity: 0, scaleY: 0.92, y: -4 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin: origin === 'trending' ? 'top right' : 'top center' }}
      className="mt-4 pt-4 border-t border-[#E5E5EA] space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-display font-semibold text-[#1D1D1F]">
            Quick Edit — {rule.name}
          </p>
          <p className="text-[11px] text-[#6E6E73]">
            Changes update your iPhone preview right away.
          </p>
        </div>
        <button
          type="button"
          onClick={closeInlineEditor}
          aria-label="Close inline editor"
          className="p-1.5 rounded-lg text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor={`exe-keywords-${idSuffix}`}
            className="block text-[11px] font-medium text-[#6E6E73]"
          >
            Comment Word
          </label>
          <input
            id={`exe-keywords-${idSuffix}`}
            type="text"
            value={editKeywords}
            onChange={(e) => setEditKeywords(e.target.value)}
            placeholder="GUIDE, LINK"
            className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-transparent focus:border-[#0071E3] focus:bg-white rounded-xl outline-none font-mono-tabular text-[#1D1D1F]"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor={`exe-link-${idSuffix}`}
            className="block text-[11px] font-medium text-[#6E6E73]"
          >
            Your Link
          </label>
          <input
            id={`exe-link-${idSuffix}`}
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-transparent focus:border-[#0071E3] focus:bg-white rounded-xl outline-none font-mono-tabular text-[#1D1D1F]"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F5F5F7] rounded-xl px-3.5 py-2.5">
        <div>
          <p className="text-xs font-medium text-[#1D1D1F]">Ask them to follow you first</p>
          <p className="text-[11px] text-[#6E6E73]">
            People tap Follow before your link button unlocks
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={editFollowGate}
          onClick={() => setEditFollowGate((prev) => !prev)}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
            editFollowGate ? 'bg-[#0071E3]' : 'bg-[#D1D1D6]'
          }`}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
              editFollowGate ? 'translate-x-5.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {editError && <p className="text-xs text-[#DC2626]">{editError}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => onEditRule(rule.id)}
          className="text-xs font-medium text-[#0071E3] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          Change Video
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={closeInlineEditor}
            className="px-3.5 py-2 text-xs font-medium text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0062C4] rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </motion.form>
  );

  return (
    <div className="space-y-5">
      {/* Warm Social Creator Header */}
      <section className="bg-white border border-[#E5E5EA] rounded-2xl p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#962FBF] shrink-0">
            <div className="p-[2px] bg-white rounded-full">
              <SafeImage
                src={account.avatarUrl}
                alt={`${account.accountName} profile`}
                className="w-11 h-11 rounded-full object-cover"
                fallbackLabel="IG"
              />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-[#1D1D1F]">
              Hey, {account.accountName}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#6E6E73]">
              <span className="font-medium text-[#1D1D1F]">{account.igHandle}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                {account.followersCount.toLocaleString()} followers
              </span>
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <span className="text-[#16A34A] font-medium w-full sm:w-auto">
                {account.connected ? 'Instagram connected' : 'Reconnect Instagram'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="px-3.5 py-2 text-xs font-medium text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-xl whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            Setup Guide
          </button>
          <button
            type="button"
            onClick={onCreateNewRule}
            className="px-3.5 py-2 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0062C4] rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            New Post
          </button>
        </div>
      </section>

      {/* Main Social Stage: Trending Post + Data Dropdown + Posts Feed (Left) & Live iPhone Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Social Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Trending Post Spotlight */}
          {trendingRule && (
            <section
              aria-label="Your trending Instagram post"
              className="bg-white border border-[#E5E5EA] rounded-2xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-[#0071E3]">
                  <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Your Trending Post</span>
                </div>
                <span className="text-xs text-[#6E6E73]">{trendingRule.updatedAt}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                {trendingRule.videoUrl ? (
                  <video
                    src={trendingRule.videoUrl}
                    poster={trendingRule.thumbnailUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-24 h-32 rounded-xl object-cover bg-black shrink-0"
                  />
                ) : (
                  <SafeImage
                    src={trendingRule.thumbnailUrl}
                    alt={trendingRule.postTitle}
                    className="w-24 h-32 rounded-xl object-cover shrink-0"
                  />
                )}

                <div className="min-w-0 flex-1 space-y-2.5">
                  <div>
                    <h2 className="text-lg font-display font-semibold text-[#1D1D1F] leading-snug">
                      {trendingRule.name}
                    </h2>
                    <p className="text-xs text-[#6E6E73] mt-0.5 truncate">
                      {trendingRule.postTitle} · Magic word:{' '}
                      <span className="font-mono-tabular font-medium text-[#1D1D1F]">
                        {trendingRule.keywords.split(',')[0]?.trim()}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6E6E73] font-mono-tabular">
                    <span>
                      <strong className="text-[#1D1D1F] font-semibold">
                        {trendingRule.metrics.commentsTriggered.toLocaleString()}
                      </strong>{' '}
                      comments
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#16A34A] font-medium">
                      +{trendingRule.metrics.followersGained.toLocaleString()} new followers
                    </span>
                    <span aria-hidden="true" className="hidden sm:inline">
                      ·
                    </span>
                    <span className="w-full sm:w-auto">
                      <strong className="text-[#1D1D1F] font-semibold">
                        {trendingRule.metrics.linkClicks.toLocaleString()}
                      </strong>{' '}
                      link taps
                    </span>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewRuleId(trendingRule.id);
                        setScreenMode('reel');
                      }}
                      className="px-3.5 py-2 text-xs font-medium text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                      Show on iPhone
                    </button>
                    <button
                      type="button"
                      onClick={() => openInlineEditor(trendingRule, 'trending')}
                      aria-expanded={editingRuleId === trendingRule.id && editOrigin === 'trending'}
                      className={`px-3.5 py-2 text-xs font-medium rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        editingRuleId === trendingRule.id && editOrigin === 'trending'
                          ? 'bg-[#0071E3] text-white'
                          : 'text-[#0071E3] bg-[#0071E3]/10 hover:bg-[#0071E3]/15'
                      }`}
                    >
                      {editingRuleId === trendingRule.id && editOrigin === 'trending'
                        ? 'Editing Post'
                        : 'Edit Post'}
                    </button>
                    {savedRuleId === trendingRule.id && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#16A34A]">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Saved
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {editingRuleId === trendingRule.id &&
                  editOrigin === 'trending' &&
                  renderInlineEditor(trendingRule, 'trending', 'trending')}
              </AnimatePresence>
            </section>
          )}

          {/* Optional Data Dropdown (Closed by Default — User Opens Only When Wanted) */}
          <section className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden">
            <button
              type="button"
              data-testid="insights-dropdown-toggle"
              aria-expanded={isDataOpen}
              onClick={() => setIsDataOpen((prev) => !prev)}
              className="w-full p-4 sm:px-6 flex items-center justify-between gap-4 text-left hover:bg-[#F5F5F7]/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#0071E3] shrink-0">
                  <BarChart3 className="w-4.5 h-4.5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-display font-semibold text-[#1D1D1F]">
                    See your numbers & activity
                  </p>
                  <p className="text-xs text-[#6E6E73] mt-0.5">
                    {isDataOpen
                      ? 'Showing your last 30 days of followers, messages, and link taps'
                      : 'Optional breakdown — tap whenever you want to check growth & charts'}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0071E3] whitespace-nowrap shrink-0">
                <span>{isDataOpen ? 'Hide Data' : 'View Data'}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isDataOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isDataOpen && (
                <motion.div
                  key="insights-dropdown-panel"
                  data-testid="insights-dropdown-panel"
                  initial={{ opacity: 0, scaleY: 0.94, y: -6 }}
                  animate={{ opacity: 1, scaleY: 1, y: 0 }}
                  exit={{ opacity: 0, scaleY: 0.94, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: 'top center' }}
                  className="p-5 sm:p-6 pt-0 border-t border-[#E5E5EA] space-y-6"
                >
                {/* Friendly 4-Card Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
                  <div className="bg-[#F5F5F7] rounded-xl p-4">
                    <p className="text-[11px] font-medium text-[#6E6E73]">Comments</p>
                    <p className="mt-1 text-2xl font-display font-semibold text-[#1D1D1F] font-mono-tabular">
                      {summary.commentsTriggered.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[#6E6E73]">Last 30 days</p>
                  </div>

                  <div className="bg-[#F5F5F7] rounded-xl p-4">
                    <p className="text-[11px] font-medium text-[#6E6E73]">New Followers</p>
                    <p className="mt-1 text-2xl font-display font-semibold text-[#1D1D1F] font-mono-tabular">
                      +{summary.followersGained.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[#16A34A] font-medium font-mono-tabular">
                      {summary.followConversionRate}% followed
                    </p>
                  </div>

                  <div className="bg-[#F5F5F7] rounded-xl p-4">
                    <p className="text-[11px] font-medium text-[#6E6E73]">Emails Saved</p>
                    <p className="mt-1 text-2xl font-display font-semibold text-[#1D1D1F] font-mono-tabular">
                      {summary.emailsCaptured.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[#6E6E73] font-mono-tabular">
                      {summary.emailCaptureRate}% shared
                    </p>
                  </div>

                  <div className="bg-[#F5F5F7] rounded-xl p-4">
                    <p className="text-[11px] font-medium text-[#6E6E73]">Link Clicks</p>
                    <p className="mt-1 text-2xl font-display font-semibold text-[#1D1D1F] font-mono-tabular">
                      {summary.linkClicks.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[#0071E3] font-medium font-mono-tabular">
                      {summary.linkCtr}% tapped link
                    </p>
                  </div>
                </div>

                {/* Message Journey Breakdown */}
                <div className="space-y-3 pt-2 border-t border-[#E5E5EA]">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-display font-semibold text-[#1D1D1F]">
                      How comments turn into followers & clicks
                    </h3>
                    <span className="text-xs text-[#6E6E73]">Last 30 days</span>
                  </div>

                  <div className="space-y-3">
                    {funnelStages.map((stage) => (
                      <div key={stage.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#1D1D1F]">{stage.label}</span>
                          <div className="flex items-center gap-3 font-mono-tabular">
                            <span className="text-[#6E6E73]">{stage.rateLabel}</span>
                            <span className="font-semibold text-[#1D1D1F] w-12 text-right">
                              {stage.count.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0071E3] rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(stage.widthPct, 4)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7-Day Activity Pulse */}
                <div className="space-y-3 pt-4 border-t border-[#E5E5EA]">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-display font-semibold text-[#1D1D1F]">
                      Weekly Activity
                    </h3>
                    <span className="text-xs text-[#6E6E73]">Tap a day to peek</span>
                  </div>

                  <div className="grid grid-cols-7 gap-2 items-end h-32 pt-2">
                    {weeklyTrends.map((point) => {
                      const totalHeight = Math.round((point.dmsSent / maxDailyDms) * 100);
                      const followerHeight = Math.round(
                        (point.followersGained / maxDailyDms) * 100
                      );
                      const isSelected = point.day === selectedDay;
                      return (
                        <button
                          key={point.day}
                          type="button"
                          onClick={() => setSelectedDay(point.day)}
                          aria-label={`Inspect ${point.day}: ${point.dmsSent} DMs sent, ${point.followersGained} followers gained`}
                          aria-pressed={isSelected}
                          className={`flex flex-col items-center gap-1.5 h-full justify-end p-1 rounded-lg transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#F5F5F7]' : 'hover:bg-[#F5F5F7]/60'
                          }`}
                        >
                          <div className="w-full max-w-[24px] h-20 flex items-end justify-center relative">
                            <div
                              className={`w-full rounded-t-md transition-all duration-200 ${
                                isSelected ? 'bg-[#0071E3]/25' : 'bg-[#E5E5EA]'
                              }`}
                              style={{ height: `${Math.max(totalHeight, 12)}%` }}
                            />
                            <div
                              className={`w-full rounded-t-md absolute bottom-0 transition-all duration-200 ${
                                isSelected ? 'bg-[#0071E3]' : 'bg-[#6E6E73]/55'
                              }`}
                              style={{ height: `${Math.max(followerHeight, 8)}%` }}
                            />
                          </div>
                          <span
                            className={`text-[11px] font-medium ${
                              isSelected ? 'text-[#0071E3]' : 'text-[#6E6E73]'
                            }`}
                          >
                            {point.day}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {activeDayStats && (
                    <div className="pt-3 border-t border-[#E5E5EA] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-[#1D1D1F]">{activeDayStats.day} Summary</span>
                      <div className="flex items-center gap-3 text-[#6E6E73] font-mono-tabular">
                        <span>{activeDayStats.dmsSent} DMs</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#0071E3] font-medium">
                          +{activeDayStats.followersGained} follows
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{activeDayStats.emailsCaptured} emails</span>
                      </div>
                    </div>
                  )}
                </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Friendly Social Posts List */}
          <section className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-display font-semibold text-[#1D1D1F]">
                  Your Posts
                </h2>
                <p className="text-xs text-[#6E6E73] mt-0.5">
                  Tap any post to preview it on the iPhone or adjust its magic word.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative">
                  <Search
                    className="w-3.5 h-3.5 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <label htmlFor="rule-search" className="sr-only">
                    Search posts or magic words
                  </label>
                  <input
                    id="rule-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find a post..."
                    className="w-full sm:w-44 pl-8 pr-3 py-1.5 text-xs bg-[#F5F5F7] border border-transparent focus:border-[#0071E3] focus:bg-white rounded-lg outline-none text-[#1D1D1F]"
                  />
                </div>

                <div
                  className="flex items-center gap-1 p-1 bg-[#F5F5F7] rounded-lg shrink-0"
                  role="group"
                  aria-label="Filter posts by status"
                >
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'active', label: 'Live' },
                      { id: 'paused', label: 'Paused' },
                    ] as const
                  ).map((item) => {
                    const isSelected = statusFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setStatusFilter(item.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-white text-[#1D1D1F] shadow-xs'
                            : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {visibleRules.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-sm font-medium text-[#1D1D1F]">No posts match your search</p>
                <p className="text-xs text-[#6E6E73]">
                  Clear your filter or add a new Instagram post with a magic word.
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2 text-xs font-medium text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-lg cursor-pointer"
                  >
                    Show All
                  </button>
                  <button
                    type="button"
                    onClick={onCreateNewRule}
                    className="px-4 py-2 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0062C4] rounded-lg cursor-pointer"
                  >
                    New Post
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E5EA]">
                {visibleRules.map((rule) => {
                  const isOnPhone = previewRule?.id === rule.id;
                  const isEditingRow = editingRuleId === rule.id && editOrigin === 'list';
                  return (
                    <div
                      key={rule.id}
                      className={`p-4 sm:px-6 transition-colors ${
                        isOnPhone ? 'bg-[#0071E3]/[0.03]' : 'hover:bg-[#F5F5F7]/60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {rule.videoUrl ? (
                            <video
                              src={rule.videoUrl}
                              poster={rule.thumbnailUrl}
                              muted
                              playsInline
                              preload="metadata"
                              className="w-12 h-16 rounded-xl object-cover shrink-0 bg-black"
                            />
                          ) : (
                            <SafeImage
                              src={rule.thumbnailUrl}
                              alt={rule.postTitle}
                              className="w-12 h-16 rounded-xl object-cover shrink-0"
                            />
                          )}

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewRuleId(rule.id);
                                  setScreenMode('reel');
                                }}
                                className="text-sm font-semibold text-[#1D1D1F] hover:text-[#0071E3] text-left truncate max-w-[240px] cursor-pointer"
                              >
                                {rule.name}
                              </button>
                              <span className="text-xs text-[#6E6E73] font-mono-tabular">
                                · {rule.keywords.split(',')[0]?.trim()}
                              </span>
                              {savedRuleId === rule.id && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#16A34A]">
                                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                  Saved
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6E6E73]">
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3 h-3 text-[#0071E3]" aria-hidden="true" />
                                {rule.followGateEnabled ? 'Follow first' : 'Direct DM'}
                              </span>
                              {rule.emailCaptureMode !== 'none' && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-[#6E6E73]" aria-hidden="true" />
                                    Email ask
                                  </span>
                                </>
                              )}
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-tabular">
                                {rule.metrics.dmsSent.toLocaleString()} DMs · +
                                {rule.metrics.followersGained.toLocaleString()} follows
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleRuleStatus(rule.id)}
                            aria-label={`Toggle status for ${rule.name}, currently ${rule.status}`}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                              rule.status === 'active'
                                ? 'text-[#16A34A] bg-[#16A34A]/10'
                                : 'text-[#D97706] bg-[#D97706]/10'
                            }`}
                          >
                            {rule.status === 'active' ? (
                              <>
                                <Pause className="w-3 h-3" aria-hidden="true" />
                                Live
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" aria-hidden="true" />
                                Paused
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPreviewRuleId(rule.id);
                              setScreenMode('reel');
                            }}
                            aria-label={`Preview ${rule.name} on iPhone`}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                              isOnPhone
                                ? 'bg-[#0071E3] text-white'
                                : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'
                            }`}
                          >
                            {isOnPhone ? 'On iPhone' : 'Preview'}
                          </button>

                          <button
                            type="button"
                            onClick={() => openInlineEditor(rule, 'list')}
                            aria-expanded={isEditingRow}
                            aria-label={`Edit ${rule.name}`}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                              isEditingRow
                                ? 'bg-[#0071E3] text-white'
                                : 'text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA]'
                            }`}
                          >
                            {isEditingRow ? 'Editing' : 'Edit'}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteRule(rule.id)}
                            aria-label={`Delete ${rule.name}`}
                            className="p-1.5 text-[#6E6E73] hover:text-[#DC2626] rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isEditingRow && renderInlineEditor(rule, 'list', `row-${rule.id}`)}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Sticky iPhone Preview Showing the Trending Post (5 cols) */}
        <aside className="lg:col-span-5 lg:sticky lg:top-20">
          {previewDraft ? (
            <IPhoneIgMockup
              account={account}
              draft={previewDraft}
              posts={posts}
              screenMode={screenMode}
              onChangeScreenMode={setScreenMode}
              viewerFollowing={viewerFollowing}
              onToggleViewerFollowing={(following) => {
                setViewerFollowing(following);
                resetPreviewFlow();
              }}
              simComment={simComment}
              onChangeSimComment={setSimComment}
              onSubmitComment={handleRunPreviewComment}
              simStage={simStage}
              simMatchedWord={simMatchedWord}
              simMismatchNotice={simMismatchNotice}
              onVerifyFollow={handlePreviewFollowVerified}
              simEmailInput={simEmailInput}
              onChangeSimEmailInput={setSimEmailInput}
              simEmailError={simEmailError}
              onSubmitEmail={handlePreviewEmailSubmit}
              onCompleteExternalEmail={() => setSimStage('link_delivered')}
              onReset={resetPreviewFlow}
              onTriggerUpload={() => {
                if (previewRule) onEditRule(previewRule.id);
              }}
              allowThumbnailPreview={true}
              previewTitle={isShowingTrending ? 'Trending on Instagram' : previewDraft.name}
              previewSubtitle={
                isShowingTrending
                  ? 'Your top post live on iPhone — like, comment, or test messages'
                  : 'Previewing your selected Instagram post on iPhone'
              }
            />
          ) : (
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-8 text-center space-y-3">
              <p className="text-sm font-display font-semibold text-[#1D1D1F]">
                No posts yet
              </p>
              <p className="text-xs text-[#6E6E73]">
                Create your first post to preview your Instagram page and messages on iPhone.
              </p>
              <button
                type="button"
                onClick={onCreateNewRule}
                className="px-4 py-2 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0062C4] rounded-xl cursor-pointer"
              >
                New Post
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
