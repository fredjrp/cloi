import {
  BarChart3,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Film,
  Grid,
  Heart,
  Home,
  MessageCircle,
  Music,
  Pause,
  Play,
  Search,
  Send,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { AutomationRule, MetaAccountState, RuleStatus } from '../types/automation';
import {
  computeFunnelMetrics,
  filterRules,
  getTrendingRule,
  orderFeedReels,
} from '../utils/automationLogic';
import { SafeImage } from './SafeImage';

interface MobileApkPreviewProps {
  account: MetaAccountState;
  rules: AutomationRule[];
  onToggleRuleStatus: (ruleId: string) => void;
  onQuickUpdateRule: (
    ruleId: string,
    updates: { keywords: string; destinationUrl: string; followGateEnabled: boolean }
  ) => void;
}

type ApkTab = 'feed' | 'reels' | 'profile';
type EditOrigin = 'reel' | 'posts-list' | 'ig-grid' | null;

export function MobileApkPreview({
  account,
  rules,
  onToggleRuleStatus,
  onQuickUpdateRule,
}: MobileApkPreviewProps) {
  const [apkTab, setApkTab] = useState<ApkTab>('feed');
  const [isApkDataOpen, setIsApkDataOpen] = useState(false);

  // Per-reel like & double-tap heart burst state
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [burstReelId, setBurstReelId] = useState<string | null>(null);
  const [burstKey, setBurstKey] = useState(0);

  // Posts tab search & filter state
  const [postsSearch, setPostsSearch] = useState('');
  const [postsStatusFilter, setPostsStatusFilter] = useState<'all' | RuleStatus>('all');

  // Target reel ID when jumping from Posts search -> Feed Reels scroller
  const [pendingFocusReelId, setPendingFocusReelId] = useState<string | null>(null);
  const feedContainerRef = useRef<HTMLDivElement | null>(null);

  // Origin-aware inline contextual editor state (unfolds right where tapped)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editOrigin, setEditOrigin] = useState<EditOrigin>(null);
  const [sheetKeywords, setSheetKeywords] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetFollowGate, setSheetFollowGate] = useState(true);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [savedToastRuleId, setSavedToastRuleId] = useState<string | null>(null);

  const summary = computeFunnelMetrics(rules);
  const trendingRule = getTrendingRule(rules);
  const feedReels = orderFeedReels(rules);
  const filteredPosts = filterRules(rules, postsSearch, postsStatusFilter);
  const handleClean = account.igHandle.replace('@', '');
  const isFeedMode = apkTab === 'feed';

  useEffect(() => {
    if (apkTab !== 'feed' || !pendingFocusReelId) return;
    const targetIdx = feedReels.findIndex((r) => r.id === pendingFocusReelId);
    if (targetIdx < 0) {
      setPendingFocusReelId(null);
      return;
    }
    const scrollToReel = () => {
      const container = feedContainerRef.current;
      if (!container || container.clientHeight === 0) return false;
      container.scrollTop = targetIdx * container.clientHeight;
      return true;
    };
    if (scrollToReel()) {
      setPendingFocusReelId(null);
      return;
    }
    const rafId = window.requestAnimationFrame(() => {
      scrollToReel();
      setPendingFocusReelId(null);
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [apkTab, pendingFocusReelId, feedReels]);

  const triggerReelLike = (ruleId: string, fromDoubleTap = false) => {
    const currentlyLiked = Boolean(likedReels[ruleId]);
    setLikedReels((prev) => ({
      ...prev,
      [ruleId]: fromDoubleTap ? true : !currentlyLiked,
    }));
    if (fromDoubleTap || !currentlyLiked) {
      setBurstReelId(ruleId);
      setBurstKey((k) => k + 1);
      window.setTimeout(() => {
        setBurstReelId((curr) => (curr === ruleId ? null : curr));
      }, 680);
    }
  };

  const toggleInlineEditor = (rule: AutomationRule, origin: Exclude<EditOrigin, null>) => {
    if (editingRuleId === rule.id && editOrigin === origin) {
      setEditingRuleId(null);
      setEditOrigin(null);
      setSheetError(null);
      return;
    }
    setEditingRuleId(rule.id);
    setEditOrigin(origin);
    setSheetKeywords(rule.keywords);
    setSheetUrl(rule.destinationUrl);
    setSheetFollowGate(rule.followGateEnabled);
    setSheetError(null);
    setSavedToastRuleId(null);
  };

  const handleSaveInline = (e: React.FormEvent, ruleId: string) => {
    e.preventDefault();
    if (!sheetKeywords.trim()) {
      setSheetError('Please add at least one comment word.');
      return;
    }
    try {
      const parsed = new URL(sheetUrl.trim());
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('Invalid');
      }
    } catch {
      setSheetError('Please enter a valid https:// link.');
      return;
    }

    onQuickUpdateRule(ruleId, {
      keywords: sheetKeywords.trim(),
      destinationUrl: sheetUrl.trim(),
      followGateEnabled: sheetFollowGate,
    });
    setEditingRuleId(null);
    setEditOrigin(null);
    setSheetError(null);
    setSavedToastRuleId(ruleId);
    window.setTimeout(() => {
      setSavedToastRuleId((curr) => (curr === ruleId ? null : curr));
    }, 2400);
  };

  const handleWatchInFeed = (ruleId: string) => {
    setEditingRuleId(null);
    setEditOrigin(null);
    setPendingFocusReelId(ruleId);
    setApkTab('feed');
  };

  const renderInlineEditor = (
    rule: AutomationRule,
    origin: Exclude<EditOrigin, null>,
    transformOrigin: string,
    frosted = false
  ) => (
    <motion.form
      key={`inline-edit-${origin}-${rule.id}`}
      data-testid="apk-inline-editor"
      onSubmit={(e) => handleSaveInline(e, rule.id)}
      initial={{ opacity: 0, scale: 0.96, y: origin === 'reel' ? 8 : -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: origin === 'reel' ? 6 : -4 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin }}
      className={`rounded-2xl p-3.5 space-y-2.5 border text-[#1D1D1F] ${
        frosted
          ? 'bg-white/95 backdrop-blur-md border-white/40 shadow-xl'
          : 'bg-[#F5F5F7] border-[#E5E5EA]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#1D1D1F] truncate">
          Editing: {rule.name}
        </span>
        <button
          type="button"
          onClick={() => {
            setEditingRuleId(null);
            setEditOrigin(null);
            setSheetError(null);
          }}
          aria-label="Close inline editor"
          className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] rounded-lg cursor-pointer"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <div>
        <label
          htmlFor={`apk-kw-${origin}-${rule.id}`}
          className="block text-[11px] font-medium text-[#1D1D1F] mb-1"
        >
          Comment Word
        </label>
        <input
          id={`apk-kw-${origin}-${rule.id}`}
          type="text"
          value={sheetKeywords}
          onChange={(e) => setSheetKeywords(e.target.value)}
          className="w-full min-h-[38px] px-3 text-xs font-mono-tabular bg-white border border-[#E5E5EA] rounded-xl outline-none focus:border-[#0071E3]"
        />
      </div>

      <div>
        <label
          htmlFor={`apk-url-${origin}-${rule.id}`}
          className="block text-[11px] font-medium text-[#1D1D1F] mb-1"
        >
          Your Link (where the button goes)
        </label>
        <input
          id={`apk-url-${origin}-${rule.id}`}
          type="url"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          className="w-full min-h-[38px] px-3 text-xs font-mono-tabular bg-white border border-[#E5E5EA] rounded-xl outline-none focus:border-[#0071E3]"
        />
      </div>

      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] font-medium text-[#1D1D1F]">
          Ask them to follow you first
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={sheetFollowGate}
          aria-label="Toggle follow step"
          onClick={() => setSheetFollowGate((prev) => !prev)}
          className={`w-10 h-5.5 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
            sheetFollowGate ? 'bg-[#0071E3]' : 'bg-[#D1D1D6]'
          }`}
        >
          <span
            className={`block w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform ${
              sheetFollowGate ? 'translate-x-4.5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {sheetError && <p className="text-[11px] text-[#DC2626]">{sheetError}</p>}

      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => {
            setEditingRuleId(null);
            setEditOrigin(null);
            setSheetError(null);
          }}
          className="flex-1 min-h-[38px] bg-white border border-[#E5E5EA] text-[#1D1D1F] text-xs font-medium rounded-xl cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 min-h-[38px] bg-[#0071E3] hover:bg-[#0062C4] text-white text-xs font-medium rounded-xl cursor-pointer"
        >
          Save Changes
        </button>
      </div>
    </motion.form>
  );

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: Warm, Non-Technical Pocket Companion Guide (5 cols) */}
      <section className="lg:col-span-5 bg-white border border-[#E5E5EA] rounded-2xl p-6 space-y-5">
        <div>
          <h1 className="text-xl font-display font-semibold text-[#1D1D1F]">
            Android Pocket App (.apk)
          </h1>
          <p className="mt-1.5 text-sm text-[#6E6E73] leading-relaxed">
            Your Feed works just like Instagram Reels—scroll vertically from video to video, like, toggle status, or adjust your magic word right on the Reel you’re watching.
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#E5E5EA]">
          <div>
            <h2 className="text-xs font-semibold text-[#1D1D1F]">
              01. Full-Screen IG Reels Feed
            </h2>
            <p className="mt-1 text-xs text-[#6E6E73] leading-relaxed">
              No cluttered grids on your Feed—just swipe or scroll naturally through your Reels starting with your trending post.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-[#1D1D1F]">
              02. Search & Jump in Posts
            </h2>
            <p className="mt-1 text-xs text-[#6E6E73] leading-relaxed">
              Looking for a specific Reel? Open the Posts tab to search by post title or comment word, edit inline, or jump directly to it in your Feed.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-[#1D1D1F]">
              03. Numbers Only When You Ask
            </h2>
            <p className="mt-1 text-xs text-[#6E6E73] leading-relaxed">
              Tap Numbers at the top anytime to peek at followers gained and link clicks, or keep it closed while you watch your Reels.
            </p>
          </div>
        </div>
      </section>

      {/* Right: Authentic Instagram-Style Android (.apk) Interactive Phone (7 cols) */}
      <section className="lg:col-span-7 flex justify-center">
        <div
          data-testid="apk-device-frame"
          className="w-full max-w-[376px] rounded-[42px] p-[9px] bg-gradient-to-b from-[#2E2E32] via-[#1B1B1E] to-[#262629] ring-1 ring-black/25 shadow-[0_22px_44px_-12px_rgba(0,0,0,0.24)] relative"
        >
          <div
            className={`rounded-[34px] overflow-hidden flex flex-col h-[670px] relative transition-colors duration-200 ${
              isFeedMode ? 'bg-black text-white' : 'bg-white text-[#1D1D1F]'
            }`}
          >
            {/* Android Top Status Bar with Punch-Hole Camera */}
            <div
              className={`px-5 pt-2.5 pb-1.5 flex items-center justify-between text-[11px] font-semibold shrink-0 z-20 transition-colors ${
                isFeedMode ? 'bg-black text-white' : 'bg-white text-[#1D1D1F]'
              }`}
            >
              <span className="font-mono-tabular">9:41</span>
              <span
                className={`w-3 h-3 rounded-full ring-1 ${
                  isFeedMode ? 'bg-[#121214] ring-white/15' : 'bg-[#1C1C1E] ring-black/15'
                }`}
                aria-hidden="true"
              />
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <svg viewBox="0 0 14 10" className="w-3 h-2.5 fill-current">
                  <rect x="0" y="7" width="2.2" height="3" rx="0.6" />
                  <rect x="3.6" y="5" width="2.2" height="5" rx="0.6" />
                  <rect x="7.2" y="2.5" width="2.2" height="7.5" rx="0.6" />
                  <rect x="10.8" y="0" width="2.2" height="10" rx="0.6" />
                </svg>
                <svg viewBox="0 0 22 11" className="w-4.5 h-2.5">
                  <rect
                    x="0.5"
                    y="0.5"
                    width="18"
                    height="10"
                    rx="2.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                  <rect x="2" y="2" width="14" height="7" rx="1.2" fill="currentColor" />
                  <path
                    d="M19.5 3.5v4a1.2 1.2 0 0 0 1-1.2v-1.6a1.2 1.2 0 0 0-1-1.2z"
                    fill="currentColor"
                    opacity="0.5"
                  />
                </svg>
              </div>
            </div>

            {/* Compact IG-Vibe App Top Bar (<= 46px) with Optional Numbers Dropdown Trigger */}
            <div
              className={`h-[46px] px-4 border-b flex items-center justify-between shrink-0 relative z-20 transition-colors ${
                isFeedMode
                  ? 'bg-black/95 border-white/10 text-white'
                  : 'bg-white border-[#EFEFEF] text-[#1D1D1F]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#962FBF] shrink-0">
                  <div className={`p-[1.5px] rounded-full ${isFeedMode ? 'bg-black' : 'bg-white'}`}>
                    <SafeImage
                      src={account.avatarUrl}
                      alt={account.accountName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-sm font-display font-bold tracking-tight truncate">
                  {isFeedMode ? 'Reels' : handleClean}
                </span>
              </div>

              <button
                type="button"
                data-testid="apk-data-dropdown-toggle"
                aria-expanded={isApkDataOpen}
                onClick={() => setIsApkDataOpen((prev) => !prev)}
                className={`min-h-[34px] px-2.5 rounded-lg inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  isFeedMode
                    ? isApkDataOpen
                      ? 'bg-white text-[#1D1D1F]'
                      : 'bg-white/12 text-white hover:bg-white/20'
                    : isApkDataOpen
                    ? 'bg-[#0071E3] text-white'
                    : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Numbers</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isApkDataOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Optional Top-Anchored Numbers Dropdown (Appears Directly Beneath Header When Tapped) */}
            <AnimatePresence>
              {isApkDataOpen && (
                <motion.div
                  key="apk-numbers-dropdown"
                  data-testid="apk-data-dropdown-panel"
                  initial={{ opacity: 0, scaleY: 0.92, y: -6 }}
                  animate={{ opacity: 1, scaleY: 1, y: 0 }}
                  exit={{ opacity: 0, scaleY: 0.92, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: 'top right' }}
                  className="absolute top-[78px] left-3 right-3 z-30 bg-white/95 backdrop-blur-md text-[#1D1D1F] border border-[#E5E5EA] rounded-2xl p-3.5 shadow-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-display font-semibold text-[#1D1D1F]">
                      Your Last 30 Days
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsApkDataOpen(false)}
                      aria-label="Close numbers dropdown"
                      className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] rounded-lg cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#F5F5F7] rounded-xl p-2.5">
                      <p className="text-[10px] font-medium text-[#6E6E73]">New Followers</p>
                      <p className="mt-0.5 text-base font-display font-semibold text-[#1D1D1F] font-mono-tabular">
                        +{summary.followersGained.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-[#16A34A] font-medium font-mono-tabular">
                        {summary.followConversionRate}% followed
                      </p>
                    </div>
                    <div className="bg-[#F5F5F7] rounded-xl p-2.5">
                      <p className="text-[10px] font-medium text-[#6E6E73]">Link Clicks</p>
                      <p className="mt-0.5 text-base font-display font-semibold text-[#1D1D1F] font-mono-tabular">
                        {summary.linkClicks.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-[#0071E3] font-medium font-mono-tabular">
                        {summary.emailsCaptured} emails saved
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Mobile Screen Area */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              <AnimatePresence initial={false}>
                {/* TAB 1: FULL-SCREEN VERTICAL IG REELS FEED (NO "YOUR POSTS" LIST/GRID HERE) */}
                {apkTab === 'feed' && (
                  <motion.div
                    key="apk-tab-feed"
                    ref={feedContainerRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    data-testid="apk-reels-feed"
                    className="absolute inset-0 h-full w-full overflow-y-auto snap-y snap-mandatory bg-black"
                  >
                    {feedReels.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center px-6 text-center space-y-2 text-white">
                        <Film className="w-7 h-7 text-white/70" aria-hidden="true" />
                        <p className="text-sm font-semibold">No Reels yet</p>
                        <p className="text-xs text-white/70">
                          Create your first post to watch and manage it here.
                        </p>
                      </div>
                    ) : (
                      feedReels.map((rule, index) => {
                        const isTrending = trendingRule?.id === rule.id;
                        const isLiked = Boolean(likedReels[rule.id]);
                        const isEditingThisReel =
                          editingRuleId === rule.id && editOrigin === 'reel';
                        const primaryWord = rule.keywords.split(',')[0]?.trim() || 'GUIDE';
                        const baseLikes = 412 - index * 64;
                        const displayCaption =
                          rule.caption?.trim() ||
                          `Comment “${primaryWord}” below and I’ll send it right to your DMs!`;

                        return (
                          <article
                            key={rule.id}
                            data-testid={`apk-reel-slide-${rule.id}`}
                            aria-label={`${rule.name} Reel`}
                            className="relative h-full w-full snap-start snap-always shrink-0 overflow-hidden bg-black select-none"
                          >
                            {/* Full-Bleed IG Reel Media Surface (Double-Tap to Like) */}
                            <div
                              data-testid={`apk-reel-media-${rule.id}`}
                              onDoubleClick={() => triggerReelLike(rule.id, true)}
                              className="absolute inset-0 cursor-pointer"
                            >
                              {rule.videoUrl ? (
                                <video
                                  src={rule.videoUrl}
                                  poster={rule.thumbnailUrl}
                                  muted
                                  playsInline
                                  loop
                                  autoPlay
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <SafeImage
                                  src={rule.thumbnailUrl}
                                  alt={rule.postTitle}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>

                            {/* Measured IG Contrast Scrims */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/85 pointer-events-none" />

                            {/* Double-Tap Heart Burst Animation */}
                            <AnimatePresence>
                              {burstReelId === rule.id && (
                                <motion.div
                                  key={`${rule.id}-${burstKey}`}
                                  initial={{ scale: 0.35, opacity: 0, rotate: -10 }}
                                  animate={{
                                    scale: [0.35, 1.25, 1],
                                    opacity: [0, 1, 1],
                                    rotate: [-10, 8, 0],
                                  }}
                                  exit={{ scale: 1.4, opacity: 0 }}
                                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                                >
                                  <Heart
                                    className="w-20 h-20 fill-[#FF3040] text-[#FF3040] drop-shadow-[0_6px_18px_rgba(255,48,64,0.5)]"
                                    aria-hidden="true"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Top Reel Context Strip (Reel Position + Quick Posts Search Shortcut) */}
                            <div className="relative z-10 px-3.5 pt-2.5 flex items-center justify-between text-white">
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/90">
                                {isTrending ? (
                                  <>
                                    <TrendingUp className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
                                    <span>Your Trending Post</span>
                                  </>
                                ) : (
                                  <span>
                                    Reel {index + 1} of {feedReels.length}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setApkTab('reels')}
                                aria-label="Search posts"
                                className="px-2.5 py-1 rounded-lg bg-black/45 hover:bg-black/65 text-[11px] font-medium text-white inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Search className="w-3 h-3" aria-hidden="true" />
                                Find Post
                              </button>
                            </div>

                            {/* Origin-Aware Inline Editor Unfolding Inside the Active Reel */}
                            <AnimatePresence>
                              {isEditingThisReel && (
                                <div className="absolute inset-x-3 bottom-3 z-30">
                                  {renderInlineEditor(rule, 'reel', 'bottom center', true)}
                                </div>
                              )}
                            </AnimatePresence>

                            {/* Bottom IG Reels HUD + Right Engagement Column */}
                            <div className="absolute inset-x-0 bottom-0 z-10 px-3.5 pb-3.5 flex items-end justify-between gap-3">
                              {/* Bottom-Left Creator, Magic Word & Caption */}
                              <div className="min-w-0 flex-1 space-y-1.5 text-white">
                                {savedToastRuleId === rule.id && editOrigin === null && (
                                  <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4ADE80]">
                                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    Updated! Synced on this Reel.
                                  </div>
                                )}

                                <div className="flex items-center gap-2 flex-wrap">
                                  <SafeImage
                                    src={account.avatarUrl}
                                    alt={account.accountName}
                                    className="w-7 h-7 rounded-full object-cover border border-white/50 shrink-0"
                                  />
                                  <span className="text-xs font-semibold truncate">
                                    {handleClean}
                                  </span>
                                  <button
                                    type="button"
                                    aria-expanded={isEditingThisReel}
                                    onClick={() => toggleInlineEditor(rule, 'reel')}
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-white/60 bg-black/35 hover:bg-black/55 text-white whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    Edit Word
                                  </button>
                                </div>

                                <p className="text-xs font-semibold truncate">{rule.name}</p>
                                <p className="text-[11.5px] text-white/90 leading-snug line-clamp-2">
                                  {displayCaption}
                                </p>

                                <div className="flex items-center gap-2 text-[10px] text-white/80 font-mono-tabular">
                                  <span className="inline-flex items-center gap-1">
                                    <Music className="w-3 h-3 shrink-0" aria-hidden="true" />
                                    Word: {primaryWord}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>+{rule.metrics.followersGained} follows</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{rule.metrics.linkClicks} clicks</span>
                                </div>
                              </div>

                              {/* Right-Side Vertical IG Engagement Column */}
                              <div className="flex flex-col items-center gap-2.5 text-white shrink-0">
                                <motion.button
                                  type="button"
                                  onClick={() => triggerReelLike(rule.id, false)}
                                  whileTap={{ scale: 0.85 }}
                                  animate={isLiked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                                  transition={{ duration: 0.25 }}
                                  aria-label={`Like ${rule.name}`}
                                  aria-pressed={isLiked}
                                  className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                                >
                                  <Heart
                                    className={`w-6 h-6 transition-colors ${
                                      isLiked ? 'fill-[#FF3040] text-[#FF3040]' : 'text-white'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <span className="text-[10px] font-mono-tabular">
                                    {baseLikes + (isLiked ? 1 : 0)}
                                  </span>
                                </motion.button>

                                <button
                                  type="button"
                                  onClick={() => toggleInlineEditor(rule, 'reel')}
                                  aria-label={`Edit magic word for ${rule.name}`}
                                  className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                                >
                                  <MessageCircle className="w-6 h-6" aria-hidden="true" />
                                  <span className="text-[10px] font-mono-tabular">
                                    {rule.metrics.commentsTriggered}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onToggleRuleStatus(rule.id)}
                                  aria-label={`Toggle automation status for ${rule.name}, currently ${rule.status}`}
                                  className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                                >
                                  {rule.status === 'active' ? (
                                    <Pause className="w-5 h-5 text-[#4ADE80]" aria-hidden="true" />
                                  ) : (
                                    <Play className="w-5 h-5 text-[#FBBF24]" aria-hidden="true" />
                                  )}
                                  <span className="text-[10px]">
                                    {rule.status === 'active' ? 'Live' : 'Paused'}
                                  </span>
                                </button>

                                <span className="min-h-[32px] flex items-center justify-center opacity-90" aria-hidden="true">
                                  <Send className="w-5 h-5" />
                                </span>
                                <span className="min-h-[28px] flex items-center justify-center opacity-80" aria-hidden="true">
                                  <Bookmark className="w-5 h-5" />
                                </span>
                              </div>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </motion.div>
                )}

                {/* TAB 2: POSTS SEARCH & DIRECTORY (FIND A SPECIFIC REEL, EDIT INLINE, OR JUMP TO FEED) */}
                {apkTab === 'reels' && (
                  <motion.div
                    key="apk-tab-reels"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 h-full overflow-y-auto bg-[#FAFAFA]"
                  >
                    {/* Sticky Search & Filter Header inside Posts */}
                    <div className="sticky top-0 z-10 bg-white border-b border-[#EFEFEF] p-3 space-y-2.5">
                      <div className="relative">
                        <Search
                          className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          aria-hidden="true"
                        />
                        <label htmlFor="apk-posts-search" className="sr-only">
                          Search posts or magic words
                        </label>
                        <input
                          id="apk-posts-search"
                          type="text"
                          value={postsSearch}
                          onChange={(e) => setPostsSearch(e.target.value)}
                          placeholder="Search posts or magic words..."
                          className="w-full min-h-[40px] pl-9 pr-8 text-xs bg-[#F5F5F7] border border-transparent focus:border-[#0071E3] focus:bg-white rounded-xl outline-none text-[#1D1D1F]"
                        />
                        {postsSearch && (
                          <button
                            type="button"
                            onClick={() => setPostsSearch('')}
                            aria-label="Clear post search"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      <div
                        className="grid grid-cols-3 gap-1 p-1 bg-[#F5F5F7] rounded-lg"
                        role="group"
                        aria-label="Filter mobile posts"
                      >
                        {(
                          [
                            { id: 'all', label: 'All' },
                            { id: 'active', label: 'Live' },
                            { id: 'paused', label: 'Paused' },
                          ] as const
                        ).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setPostsStatusFilter(tab.id)}
                            className={`py-1 text-[11px] font-medium rounded-md cursor-pointer transition-colors ${
                              postsStatusFilter === tab.id
                                ? 'bg-white text-[#1D1D1F] shadow-xs'
                                : 'text-[#6E6E73]'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3">
                      {filteredPosts.length === 0 ? (
                        <div className="bg-white border border-[#EFEFEF] rounded-2xl p-6 text-center space-y-2.5">
                          <p className="text-xs font-semibold text-[#1D1D1F]">No matching posts</p>
                          <p className="text-[11px] text-[#6E6E73]">
                            Try another keyword or clear your search filter.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setPostsSearch('');
                              setPostsStatusFilter('all');
                            }}
                            className="px-3.5 py-2 text-xs font-medium text-white bg-[#0071E3] rounded-xl cursor-pointer"
                          >
                            Clear Search
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white border border-[#EFEFEF] rounded-2xl overflow-hidden divide-y divide-[#EFEFEF]">
                          {filteredPosts.map((rule) => {
                            const isEditingRow =
                              editingRuleId === rule.id && editOrigin === 'posts-list';
                            return (
                              <div key={rule.id} className="px-3.5 py-3 space-y-2.5">
                                <div className="flex items-center justify-between gap-2.5">
                                  <button
                                    type="button"
                                    aria-expanded={isEditingRow}
                                    onClick={() => toggleInlineEditor(rule, 'posts-list')}
                                    className="min-h-[48px] flex-1 flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                                  >
                                    <SafeImage
                                      src={rule.thumbnailUrl}
                                      alt={rule.postTitle}
                                      className="w-10 h-12 rounded-lg object-cover shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold text-[#1D1D1F] truncate">
                                        {rule.name}
                                      </p>
                                      <p className="text-[11px] font-mono-tabular text-[#6E6E73] truncate">
                                        {rule.keywords.split(',')[0]?.trim()} ·{' '}
                                        {rule.status === 'active' ? 'Live' : 'Paused'}
                                      </p>
                                    </div>
                                    <ChevronRight
                                      className={`w-4 h-4 text-[#6E6E73] shrink-0 transition-transform duration-150 ${
                                        isEditingRow ? 'rotate-90 text-[#0071E3]' : ''
                                      }`}
                                      aria-hidden="true"
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleWatchInFeed(rule.id)}
                                    aria-label={`Watch ${rule.name} in Feed`}
                                    className="min-h-[36px] px-2.5 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-[11px] font-medium rounded-lg inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    <Play className="w-3 h-3" aria-hidden="true" />
                                    Watch
                                  </button>
                                </div>

                                <AnimatePresence>
                                  {isEditingRow &&
                                    renderInlineEditor(rule, 'posts-list', 'top center')}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* TAB 3: IG PAGE GRID */}
                {apkTab === 'profile' && (
                  <motion.div
                    key="apk-tab-profile"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 h-full overflow-y-auto bg-white"
                  >
                    <div className="px-4 pt-3 pb-2.5 flex items-center gap-4">
                      <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#962FBF] shrink-0">
                        <div className="p-[2px] bg-white rounded-full">
                          <SafeImage
                            src={account.avatarUrl}
                            alt={account.accountName}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 text-left pl-1">
                        <div>
                          <p className="text-sm font-bold text-[#1D1D1F] font-mono-tabular">142</p>
                          <p className="text-[11px] text-[#1D1D1F]">posts</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1D1D1F] font-mono-tabular">
                            {account.followersCount.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-[#1D1D1F]">followers</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1D1D1F] font-mono-tabular">318</p>
                          <p className="text-[11px] text-[#1D1D1F]">following</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-3 space-y-0.5 text-xs">
                      <p className="font-semibold text-[#1D1D1F]">{account.accountName}</p>
                      <p className="text-[#6E6E73]">Digital creator</p>
                      <p className="text-[#1D1D1F]">Systems, templates & visual guides</p>
                    </div>

                    <div className="grid grid-cols-3 border-t border-[#EFEFEF]">
                      <div className="py-2 flex justify-center text-[#8E8E8E]">
                        <Grid className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="py-2 flex justify-center text-[#1D1D1F] border-b-[1.5px] border-[#1D1D1F]">
                        <Film className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="py-2 flex justify-center text-[#8E8E8E]">
                        <Bookmark className="w-4 h-4" aria-hidden="true" />
                      </div>
                    </div>

                    {/* Inline Contextual Editor Anchored Right With Grid */}
                    <AnimatePresence>
                      {editOrigin === 'ig-grid' &&
                        editingRuleId &&
                        (() => {
                          const targetRule = rules.find((r) => r.id === editingRuleId);
                          if (!targetRule) return null;
                          return (
                            <div className="p-3 border-b border-[#EFEFEF]">
                              {renderInlineEditor(targetRule, 'ig-grid', 'top center')}
                            </div>
                          );
                        })()}
                    </AnimatePresence>

                    <div className="grid grid-cols-3 gap-[1.5px] bg-white pt-[1.5px]">
                      {rules.map((rule) => (
                        <button
                          key={rule.id}
                          type="button"
                          onClick={() => toggleInlineEditor(rule, 'ig-grid')}
                          aria-label={`Edit ${rule.name}`}
                          className={`relative aspect-[3/4] bg-[#F5F5F7] overflow-hidden cursor-pointer text-left ${
                            editingRuleId === rule.id && editOrigin === 'ig-grid'
                              ? 'ring-2 ring-inset ring-[#0071E3]'
                              : ''
                          }`}
                        >
                          <SafeImage
                            src={rule.thumbnailUrl}
                            alt={rule.postTitle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent p-1.5 flex items-end">
                            <span className="text-[10px] font-mono-tabular font-semibold text-white truncate">
                              {rule.keywords.split(',')[0]?.trim()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Instagram-Style Mobile Bottom Tab Bar (Thumb Zone, <= 60px) */}
            <div
              className={`h-15 backdrop-blur-md border-t grid grid-cols-3 items-center shrink-0 transition-colors ${
                isFeedMode
                  ? 'bg-black/95 border-white/10 text-white'
                  : 'bg-white/95 border-[#EFEFEF] text-[#1D1D1F]'
              }`}
            >
              {(
                [
                  { id: 'feed', label: 'Feed', icon: Home },
                  { id: 'reels', label: 'Posts', icon: Search },
                  { id: 'profile', label: 'IG Page', icon: User },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = apkTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setApkTab(tab.id)}
                    className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                      isActive
                        ? isFeedMode
                          ? 'text-white font-semibold'
                          : 'text-[#1D1D1F] font-semibold'
                        : isFeedMode
                        ? 'text-white/55'
                        : 'text-[#8E8E8E]'
                    }`}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="text-[10px]">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
