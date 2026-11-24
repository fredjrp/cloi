import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Film,
  Heart,
  Instagram,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  Video,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import type {
  MetaAccountState,
  NavView,
  ReelPost,
  RuleDraft,
} from '../types/automation';
import {
  calculateOnboardingProgress,
  isValidEmail,
  resolveWalkthroughStageMeta,
  validateVideoFile,
  type WalkthroughViewerStage,
} from '../utils/automationLogic';
import { SafeImage } from './SafeImage';

const DEFAULT_WALKTHROUGH_VIDEO = '/src/assets/videos/walkthrough_reel.mp4';

type SignupPhase = 'ready' | 'confirm_ig' | 'pulling' | 'done';

interface OnboardingWizardProps {
  account: MetaAccountState;
  posts: ReelPost[];
  onToggleMetaConnection: (connected: boolean) => void;
  onCompleteOnboarding: (newRule: RuleDraft, targetView?: NavView) => void;
  onCancelToOverview: () => void;
  /**
   * When set, this wizard is running BEFORE the user has an account (first launch).
   * Pressing "Connect to Instagram" then hands off to the real sign-up instead of
   * running the simulated confirm/pull/done animation.
   */
  onRequestAuth?: () => void;
}

export function OnboardingWizard({
  account,
  posts,
  onToggleMetaConnection,
  onCompleteOnboarding,
  onCancelToOverview,
  onRequestAuth,
}: OnboardingWizardProps) {
  const [activeStep, setActiveStep] = useState<'walkthrough' | 'signup'>('walkthrough');
  const [viewerStage, setViewerStage] = useState<WalkthroughViewerStage>('reel_watch');
  const [signupPhase, setSignupPhase] = useState<SignupPhase>('ready');
  const [experiencedFullFlow, setExperiencedFullFlow] = useState(false);

  // Viewer interaction states inside the immersive phone
  const [viewerLiked, setViewerLiked] = useState(false);
  const [heartBurstKey, setHeartBurstKey] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // In-app IG browser n8n form state (viewer perspective)
  const [viewerName, setViewerName] = useState('Alex Rivera');
  const [viewerEmail, setViewerEmail] = useState('alex@creativestudio.com');
  const [formError, setFormError] = useState<string | null>(null);

  const [videoNotice, setVideoNotice] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // A brand-new user has no posts yet - this wizard runs BEFORE sign-up. Without a
  // fallback the very first render throws on `starterPost.id`, so the onboarding a
  // new user is supposed to see is the one screen that never opens.
  const DEMO_POST: ReelPost = {
    id: 'demo',
    title: 'Your first reel',
    caption: 'Comment a keyword and get the link in your DMs.',
    publishedAt: '',
    thumbnailUrl: '',
    commentCount: 0,
  };
  const starterPost = posts[0] ?? posts[1] ?? DEMO_POST;
  const [draft, setDraft] = useState<RuleDraft>({
    name: 'Creator Grid & Growth PDF',
    postId: starterPost.id === 'demo' ? 'any' : starterPost.id,
    postTitle: starterPost.title,
    thumbnailUrl: starterPost.thumbnailUrl,
    videoUrl: DEFAULT_WALKTHROUGH_VIDEO,
    videoName: 'walkthrough_reel.mp4',
    caption: 'Want my full playbook? Comment "GUIDE" below and I will DM you the link.',
    keywords: 'GUIDE',
    matchType: 'contains',
    publicReply: 'Just sent it! Check your DMs.',
    followGateEnabled: true,
    followGatePrompt: `Hey! Happy to share it. Tap Follow in the header above so I can unlock your guide.`,
    followGateButtonLabel: 'Follow',
    emailCaptureMode: 'external_link',
    emailPrompt: 'Fill out the quick form to open your PDF.',
    emailCollectionUrl: 'https://n8n.studiokairo.co/form/creator-guide',
    destinationButtonLabel: 'Get the PDF',
    destinationUrl: 'https://studiokairo.co/creator-guide.pdf',
    status: 'active',
  });

  const primaryWord = draft.keywords.split(',')[0]?.trim().toUpperCase() || 'GUIDE';
  const handleClean = account.igHandle.replace('@', '');
  const stageMeta = resolveWalkthroughStageMeta(viewerStage);
  const isIgLinked = signupPhase === 'done';

  const progress = calculateOnboardingProgress({
    metaConnected: isIgLinked,
    firstRuleConfigured: experiencedFullFlow,
    liveTestPassed: isIgLinked,
  });

  const triggerReelLike = (fromDoubleTap = false) => {
    const next = fromDoubleTap ? true : !viewerLiked;
    setViewerLiked(next);
    if (fromDoubleTap || next) {
      setShowHeartBurst(true);
      setHeartBurstKey((k) => k + 1);
      window.setTimeout(() => setShowHeartBurst(false), 620);
    }
  };

  const handleViewerComment = () => {
    setFormError(null);
    setViewerStage('comment_replied');
  };

  const handleHopToDm = () => {
    setFormError(null);
    setViewerStage(draft.followGateEnabled ? 'dm_thread' : 'unlocked_outcome');
  };

  const handleViewerFollow = () => {
    setViewerStage('unlocked_outcome');
  };

  const handleOpenInAppForm = () => {
    setFormError(null);
    setViewerStage('in_app_form');
  };

  const handleN8nFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewerName.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    if (!isValidEmail(viewerEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    setFormError(null);
    setExperiencedFullFlow(true);
    setViewerStage('browser_pdf');
  };

  const handleReplayWalkthrough = () => {
    setFormError(null);
    setViewerStage('reel_watch');
  };

  const handleVideoFileUpload = (file: File | null) => {
    if (!file) return;
    const check = validateVideoFile(file);
    if (!check.valid) {
      setVideoError(check.error ?? 'Please choose a valid MP4, MOV, or WebM video.');
      setVideoNotice(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setVideoError(null);
    setVideoNotice(`Loaded "${file.name}" into your walkthrough Reel.`);
    setDraft((prev) => ({
      ...prev,
      videoUrl: objectUrl,
      videoName: file.name,
      videoSizeBytes: file.size,
    }));
    setViewerStage('reel_watch');
  };

  const handleStartPullingIgData = () => {
    setSignupPhase('pulling');
    onToggleMetaConnection(true);
    window.setTimeout(() => {
      setSignupPhase('done');
    }, 800);
  };

  const activeVideoSrc = draft.videoUrl?.trim() || DEFAULT_WALKTHROUGH_VIDEO;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Compact Welcome & 2-Step Journey Header */}
      <section className="bg-white border border-[#E5E5EA] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-display font-semibold text-[#1D1D1F]">
              CloiDm Automation · See What You Unlock Before Signing Up
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6E73]">
              Experience the full IG comment-to-PDF viewer journey first, then sign up with one tap using your Instagram account.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono-tabular font-medium text-[#1D1D1F] whitespace-nowrap">
              {progress.percent}% complete
            </span>
            <button
              type="button"
              onClick={onCancelToOverview}
              className="px-3 py-1.5 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] bg-[#F5F5F7] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Exit Tour
            </button>
          </div>
        </div>

        <div className="h-1 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0071E3] transition-all duration-300"
            style={{ width: `${Math.max(progress.percent, 15)}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="onboarding-tab-walkthrough"
            onClick={() => setActiveStep('walkthrough')}
            className={`px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeStep === 'walkthrough'
                ? 'border-[#0071E3] bg-[#0071E3]/6 text-[#1D1D1F]'
                : 'border-[#E5E5EA] bg-[#F5F5F7]/60 text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <span>1. Preview What You Unlock (Viewer Experience)</span>
            {experiencedFullFlow && <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" aria-hidden="true" />}
          </button>

          <button
            type="button"
            data-testid="onboarding-tab-signup"
            onClick={() => setActiveStep('signup')}
            className={`px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeStep === 'signup'
                ? 'border-[#0071E3] bg-[#0071E3]/6 text-[#1D1D1F]'
                : 'border-[#E5E5EA] bg-[#F5F5F7]/60 text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <span>2. Sign Up · Connect to Instagram</span>
            {isIgLinked && <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" aria-hidden="true" />}
          </button>
        </div>
      </section>

      {/* Main Split: Left Guide / Sign-Up (6 cols) + Right Viewer-Perspective Phone (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-6 space-y-5">
          {activeStep === 'walkthrough' ? (
            <section className="bg-white border border-[#E5E5EA] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-display font-semibold text-[#1D1D1F]">
                    See How CloiDm Automation Works
                  </h2>
                  <p className="text-xs text-[#6E6E73] mt-0.5">
                    Tap inside the phone on the right—or pick any beat below—before you even create an account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReplayWalkthrough}
                  className="px-2.5 py-1.5 text-xs font-medium text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Replay</span>
                </button>
              </div>

              {/* 5-Beat Viewer Experience Timeline */}
              <div className="space-y-2">
                {[
                  {
                    stage: 'reel_watch' as WalkthroughViewerStage,
                    num: 1,
                    title: `Viewer comments “${primaryWord}” on your Reel`,
                    detail: 'No broken link-in-bio friction—one comment triggers the entire flow.',
                  },
                  {
                    stage: 'comment_replied' as WalkthroughViewerStage,
                    num: 2,
                    title: 'Comment reply + IG DM alert appear instantly',
                    detail: 'Replies “Check your DMs!” and pops an IG message notification.',
                  },
                  {
                    stage: 'dm_thread' as WalkthroughViewerStage,
                    num: 3,
                    title: 'IG header highlights Follow -> they tap Follow',
                    detail: 'Viewers tap IG’s real Follow button in the top header to become a follower.',
                  },
                  {
                    stage: 'unlocked_outcome' as WalkthroughViewerStage,
                    num: 4,
                    title: 'Clean “Get the PDF” button (no raw link clutter)',
                    detail: 'Only clean buttons appear inside the DM—tapping opens your page inside IG.',
                  },
                  {
                    stage: 'in_app_form' as WalkthroughViewerStage,
                    num: 5,
                    title: 'n8n Name & Email form -> PDF opens in browser',
                    detail: 'Viewer submits Name & Email in-app, then lands directly on your PDF or course.',
                  },
                ].map((beat) => {
                  const isCurrent =
                    viewerStage === beat.stage ||
                    (beat.stage === 'in_app_form' && viewerStage === 'browser_pdf');
                  const isPassed =
                    stageMeta.stepNumber > beat.num ||
                    (beat.num === 5 && viewerStage === 'browser_pdf');
                  return (
                    <button
                      key={beat.stage}
                      type="button"
                      data-testid={`timeline-beat-${beat.stage}`}
                      onClick={() => {
                        setViewerStage(beat.stage);
                        if (beat.stage === 'browser_pdf') setExperiencedFullFlow(true);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                        isCurrent
                          ? 'border-[#0071E3] bg-[#0071E3]/6'
                          : isPassed
                          ? 'border-[#E5E5EA] bg-[#F5F5F7]/70'
                          : 'border-[#E5E5EA] bg-white hover:bg-[#F5F5F7]/50'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full text-[11px] font-mono-tabular font-semibold flex items-center justify-center shrink-0 mt-0.5 ${
                          isCurrent
                            ? 'bg-[#0071E3] text-white'
                            : isPassed
                            ? 'bg-[#16A34A] text-white'
                            : 'bg-[#F5F5F7] text-[#6E6E73]'
                        }`}
                      >
                        {isPassed ? '✓' : beat.num}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1D1D1F]">{beat.title}</p>
                        <p className="text-[11px] text-[#6E6E73] mt-0.5 leading-snug">{beat.detail}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Paste Your Own Video Link / Upload Anytime */}
              <div className="p-3.5 bg-[#F5F5F7] rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="walkthrough-video-url"
                    className="text-xs font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5 text-[#0071E3]" aria-hidden="true" />
                    <span>Walkthrough Video (paste yours anytime)</span>
                  </label>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-medium text-[#0071E3] hover:underline inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                    >
                      <Upload className="w-3 h-3" aria-hidden="true" />
                      Upload Video
                    </button>
                    {activeVideoSrc !== DEFAULT_WALKTHROUGH_VIDEO && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraft((prev) => ({
                            ...prev,
                            videoUrl: DEFAULT_WALKTHROUGH_VIDEO,
                            videoName: 'walkthrough_reel.mp4',
                          }));
                          setVideoNotice('Switched back to demo Reel video.');
                          setVideoError(null);
                        }}
                        className="text-[11px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] whitespace-nowrap cursor-pointer"
                      >
                        Use Demo
                      </button>
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                  className="hidden"
                  onChange={(e) => handleVideoFileUpload(e.target.files?.[0] ?? null)}
                />

                <input
                  id="walkthrough-video-url"
                  type="url"
                  value={draft.videoUrl ?? ''}
                  onChange={(e) => {
                    setVideoError(null);
                    setVideoNotice(null);
                    setDraft((prev) => ({ ...prev, videoUrl: e.target.value }));
                  }}
                  placeholder="Paste your Reel video URL (.mp4 / .mov / .webm)"
                  className="w-full px-3 py-1.5 text-xs font-mono-tabular bg-white border border-[#E5E5EA] rounded-lg outline-none focus:border-[#0071E3]"
                />
                {videoError && <p className="text-[11px] text-[#DC2626]">{videoError}</p>}
                {videoNotice && <p className="text-[11px] text-[#16A34A]">{videoNotice}</p>}
              </div>

              {/* .apk Operation Summary + Proceed to Sign Up */}
              <div className="border-t border-[#E5E5EA] pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-[#6E6E73]">
                  Ready to unlock this on your <strong className="text-[#1D1D1F]">.apk</strong> & <strong className="text-[#1D1D1F]">.exe</strong> apps?
                </p>
                <button
                  type="button"
                  data-testid="proceed-to-signup-btn"
                  onClick={() => setActiveStep('signup')}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0071E3] hover:bg-[#0062C4] rounded-xl inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Proceed to Sign Up</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </section>
          ) : (
            <section className="bg-white border border-[#E5E5EA] rounded-2xl p-6 space-y-5">
              {/* STEP 2: One-Tap Sign Up With Instagram -> Ask to Connect -> Pull All Data -> Done */}
              {signupPhase === 'ready' && (
                <>
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-[#0071E3]">
                      CloiDm Automation Sign Up
                    </span>
                    <h2 className="text-xl font-display font-semibold text-[#1D1D1F]">
                      Connect Your Instagram to Unlock Everything
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                      No passwords or complex setup forms. Press Connect below—we’ll ask to link your Instagram, pull your Reels & insights automatically, and you’re live.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F5F5F7] rounded-2xl space-y-2.5 text-xs">
                    <p className="font-semibold text-[#1D1D1F]">What unlocks the moment you connect:</p>
                    <ul className="space-y-2 text-[#6E6E73]">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>Imports all your Reels, captions & current follower stats automatically</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>Turns Reel comments into instant DMs + IG header Follow checks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>Sends viewers through your n8n Name & Email form straight to your PDF</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    data-testid="signup-connect-ig-btn"
                    onClick={() => {
                      // On first launch there is no account yet, so this must hand
                      // off to real sign-up instead of playing the simulated
                      // confirm/pull/done animation.
                      if (onRequestAuth) {
                        onRequestAuth();
                        return;
                      }
                      setSignupPhase('confirm_ig');
                    }}
                    className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white text-sm font-semibold inline-flex items-center justify-center gap-2.5 shadow-sm whitespace-nowrap cursor-pointer transition-opacity"
                  >
                    <Instagram className="w-4 h-4" aria-hidden="true" />
                    <span>Connect to Instagram</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA] text-xs text-[#6E6E73]">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#16A34A]" aria-hidden="true" />
                      Official Meta Login · Instant data sync
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveStep('walkthrough')}
                      className="text-[#0071E3] font-medium hover:underline cursor-pointer"
                    >
                      Back to Walkthrough
                    </button>
                  </div>
                </>
              )}

              {signupPhase === 'confirm_ig' && (
                <div data-testid="ig-connect-prompt" className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#962FBF] shrink-0">
                      <div className="p-[2px] rounded-full bg-white">
                        <SafeImage
                          src={account.avatarUrl}
                          alt={account.accountName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-base font-display font-semibold text-[#1D1D1F]">
                        Link {account.igHandle} to CloiDm Automation?
                      </h2>
                      <p className="text-xs text-[#6E6E73]">
                        {account.accountName} · {account.metaPageName}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F5F7] rounded-2xl space-y-2 text-xs text-[#6E6E73]">
                    <p className="font-semibold text-[#1D1D1F]">CloiDm Automation will automatically pull:</p>
                    <p>• Your Instagram profile, Reels library & thumbnails</p>
                    <p>• Comment triggers & DM automation permissions</p>
                    <p>• Follower status check & link click stats</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSignupPhase('ready')}
                      className="px-4 py-2.5 text-xs font-medium text-[#6E6E73] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-xl whitespace-nowrap cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      data-testid="confirm-link-ig-btn"
                      onClick={handleStartPullingIgData}
                      className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-[#0095F6] hover:bg-[#1877F2] rounded-xl inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <Instagram className="w-4 h-4" aria-hidden="true" />
                      <span>Link {account.igHandle} & Pull My Data</span>
                    </button>
                  </div>
                </div>
              )}

              {signupPhase === 'pulling' && (
                <div data-testid="ig-pulling-state" className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-2 border-[#0095F6] border-t-transparent animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h2 className="text-base font-display font-semibold text-[#1D1D1F]">
                      Linking {account.igHandle} & Pulling Your Data...
                    </h2>
                    <p className="text-xs text-[#6E6E73]">
                      Importing Reels, syncing comments & preparing your CloiDm workspace.
                    </p>
                  </div>
                </div>
              )}

              {signupPhase === 'done' && (
                <div data-testid="ig-signup-complete" className="space-y-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h2 className="text-lg font-display font-semibold text-[#1D1D1F]">
                        You’re Signed Up — All IG Data Pulled!
                      </h2>
                      <p className="text-xs text-[#6E6E73] mt-0.5">
                        {account.igHandle} is connected and ready across both your Android <strong className="text-[#1D1D1F]">.apk</strong> and Desktop <strong className="text-[#1D1D1F]">.exe</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 bg-[#F5F5F7] rounded-xl">
                      <p className="text-[11px] text-[#6E6E73]">IG Account</p>
                      <p className="text-xs font-semibold text-[#1D1D1F] mt-0.5 truncate">{account.igHandle}</p>
                    </div>
                    <div className="p-3 bg-[#F5F5F7] rounded-xl">
                      <p className="text-[11px] text-[#6E6E73]">Reels Synced</p>
                      <p className="text-xs font-mono-tabular font-semibold text-[#1D1D1F] mt-0.5">
                        {posts.length} Reels ready
                      </p>
                    </div>
                    <div className="p-3 bg-[#F5F5F7] rounded-xl">
                      <p className="text-[11px] text-[#6E6E73]">Followers</p>
                      <p className="text-xs font-mono-tabular font-semibold text-[#1D1D1F] mt-0.5">
                        {account.followersCount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <button
                      type="button"
                      data-testid="launch-mobile-apk-btn"
                      onClick={() => onCompleteOnboarding(draft, 'mobile')}
                      className="flex-1 px-4 py-3 text-xs font-semibold text-white bg-[#0071E3] hover:bg-[#0062C4] rounded-xl inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" aria-hidden="true" />
                      <span>Open Mobile (.apk)</span>
                    </button>
                    <button
                      type="button"
                      data-testid="launch-desktop-exe-btn"
                      onClick={() => onCompleteOnboarding(draft, 'overview')}
                      className="flex-1 px-4 py-3 text-xs font-medium text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-xl inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <span>Open Desktop (.exe)</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Immersive Viewer-Perspective IG Phone Simulator */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-2.5">
          <div className="w-full max-w-[344px] flex items-center justify-between px-1">
            <span className="text-xs font-medium text-[#6E6E73]">
              Viewer’s Phone · Live Perspective
            </span>
            <button
              type="button"
              onClick={handleReplayWalkthrough}
              className="text-xs font-medium text-[#0071E3] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>Restart Story</span>
            </button>
          </div>

          <div
            data-testid="walkthrough-phone-frame"
            className="w-full max-w-[344px] rounded-[40px] p-[8px] bg-gradient-to-b from-[#2E2E32] via-[#1B1B1E] to-[#262629] ring-1 ring-black/25 shadow-[0_24px_48px_-14px_rgba(0,0,0,0.28)]"
          >
            <div className="rounded-[33px] overflow-hidden bg-black text-white h-[565px] flex flex-col relative">
              {/* Persistent Top Status Bar */}
              <div
                className={`px-5 pt-2.5 pb-1.5 flex items-center justify-between text-[11px] font-semibold shrink-0 z-40 transition-colors duration-200 ${
                  stageMeta.isDmOpen || stageMeta.isFormOpen || stageMeta.isPdfOpened
                    ? 'bg-white text-[#1D1D1F]'
                    : 'bg-black/60 text-white'
                }`}
              >
                <span className="font-mono-tabular">9:41</span>
                <div className="w-[70px] h-[18px] rounded-full bg-black border border-white/10" aria-hidden="true" />
                <div className="flex items-center gap-1" aria-hidden="true">
                  <span className="w-3 h-2 rounded-[2px] border border-current opacity-80 inline-block" />
                </div>
              </div>

              {/* Screen Layer Stack */}
              <div className="relative flex-1 overflow-hidden">
                {/* STAGE 1 & 2: IG REEL WATCH & COMMENTS + DM ALERT */}
                <div
                  className={`absolute inset-0 flex flex-col justify-between transition-transform duration-200 ease-out ${
                    stageMeta.isDmOpen ? '-translate-x-8 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
                  }`}
                >
                  <div
                    onDoubleClick={() => triggerReelLike(true)}
                    className="absolute inset-0 bg-black cursor-pointer"
                  >
                    <video
                      key={activeVideoSrc}
                      data-testid="walkthrough-video"
                      src={activeVideoSrc}
                      poster={draft.thumbnailUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/85 pointer-events-none" />
                  </div>

                  <AnimatePresence>
                    {showHeartBurst && (
                      <motion.div
                        key={heartBurstKey}
                        initial={{ scale: 0.35, opacity: 0 }}
                        animate={{ scale: [0.35, 1.25, 1], opacity: [0, 1, 1] }}
                        exit={{ scale: 1.35, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                      >
                        <Heart className="w-20 h-20 fill-[#FF3040] text-[#FF3040]" aria-hidden="true" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Top Reels Header + IG DM Push Notification */}
                  <div className="relative z-20 px-3.5 pt-1.5 space-y-2">
                    <div className="flex items-center justify-between text-white">
                      <span className="text-sm font-display font-bold tracking-tight">Reels</span>
                      <span className="text-[11px] text-white/80 font-medium">
                        {viewerStage === 'reel_watch' ? 'Step 1 · Post Comment' : 'Step 2 · DM Alert!'}
                      </span>
                    </div>

                    <AnimatePresence>
                      {viewerStage === 'comment_replied' && (
                        <motion.button
                          type="button"
                          data-testid="walkthrough-dm-alert"
                          onClick={handleHopToDm}
                          initial={{ opacity: 0, y: -24, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -16 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="w-full text-left bg-[#1C1C1E]/95 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="relative shrink-0">
                            <SafeImage
                              src={account.avatarUrl}
                              alt={account.accountName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#0095F6] flex items-center justify-center">
                              <Bell className="w-2 h-2 text-white" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-white truncate">
                              {handleClean} · New DM
                            </p>
                            <p className="text-[11px] text-white/75 truncate">
                              Tap to open your message
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-[8px] bg-[#0095F6] text-[11px] font-semibold text-white whitespace-nowrap shrink-0">
                            Open DM
                          </span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bottom Viewer Overlay (Stage 1) OR Comment Reply Drawer (Stage 2) */}
                  <div className="relative z-20 mt-auto">
                    {viewerStage === 'reel_watch' && (
                      <div className="px-3.5 pb-4 flex flex-col gap-3">
                        <div className="flex items-end justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <SafeImage
                                src={account.avatarUrl}
                                alt={account.accountName}
                                className="w-7 h-7 rounded-full object-cover border border-white/60 shrink-0"
                              />
                              <span className="text-xs font-semibold">{handleClean}</span>
                              <span className="px-2 py-0.5 rounded-[7px] border border-white/80 text-[11px] font-semibold text-white whitespace-nowrap shrink-0">
                                {stageMeta.isViewerFollowing ? 'Following' : 'Follow'}
                              </span>
                            </div>
                            <p className="text-xs text-white/95 leading-snug">
                              Want my <strong className="font-semibold">{draft.name}</strong>? Comment{' '}
                              <strong className="font-mono-tabular text-[#38BDF8]">“{primaryWord}”</strong> below!
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-3 shrink-0 pb-1">
                            <button
                              type="button"
                              onClick={() => triggerReelLike(false)}
                              aria-label="Like Reel"
                              className="flex flex-col items-center gap-0.5 cursor-pointer"
                            >
                              <Heart
                                className={`w-6 h-6 transition-transform active:scale-125 ${
                                  viewerLiked ? 'fill-[#FF3040] text-[#FF3040]' : 'text-white'
                                }`}
                                aria-hidden="true"
                              />
                              <span className="text-[10px] font-mono-tabular">
                                {viewerLiked ? '413' : '412'}
                              </span>
                            </button>
                            <div className="flex flex-col items-center gap-0.5">
                              <MessageCircle className="w-6 h-6 text-white" aria-hidden="true" />
                              <span className="text-[10px] font-mono-tabular">84</span>
                            </div>
                            <Send className="w-5 h-5 text-white" aria-hidden="true" />
                            <Bookmark className="w-5 h-5 text-white" aria-hidden="true" />
                          </div>
                        </div>

                        <div className="bg-black/60 backdrop-blur-md border border-white/25 rounded-full pl-2 pr-1.5 py-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-white/15 text-[10px] font-semibold flex items-center justify-center shrink-0">
                              You
                            </span>
                            <span className="text-xs font-mono-tabular text-white truncate">
                              {primaryWord}
                            </span>
                          </div>
                          <button
                            type="button"
                            data-testid="walkthrough-comment-btn"
                            onClick={handleViewerComment}
                            className="px-3.5 py-1.5 rounded-full bg-[#0095F6] hover:bg-[#1877F2] text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Post “{primaryWord}”
                          </button>
                        </div>
                      </div>
                    )}

                    {viewerStage === 'comment_replied' && (
                      <motion.div
                        initial={{ y: 36, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white text-[#1D1D1F] rounded-t-3xl p-4 space-y-3 shadow-2xl"
                      >
                        <div className="w-9 h-1 rounded-full bg-[#D1D1D6] mx-auto" aria-hidden="true" />
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-display font-semibold">Comments</p>
                          <span className="text-[11px] text-[#16A34A] font-medium">
                            Instant Reply + DM Sent
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                            You
                          </div>
                          <div className="text-xs space-y-0.5">
                            <p className="font-semibold">
                              alex.creates <span className="font-normal text-[#6E6E73]">· now</span>
                            </p>
                            <p className="font-mono-tabular">{primaryWord}</p>
                          </div>
                        </div>

                        <div className="pl-8 flex items-start gap-2.5">
                          <SafeImage
                            src={account.avatarUrl}
                            alt={account.accountName}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                          <div className="flex-1 bg-[#F5F5F7] rounded-xl p-2.5 text-xs space-y-1">
                            <p className="font-semibold text-[#1D1D1F]">{handleClean}</p>
                            <p className="text-[#1D1D1F] leading-snug">{draft.publicReply}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          data-testid="walkthrough-open-dm-from-reply"
                          onClick={handleHopToDm}
                          className="w-full py-2.5 px-4 bg-[#0095F6] hover:bg-[#1877F2] text-white text-xs font-semibold rounded-[8px] inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Check DM</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* STAGE 3 & 4: IG DIRECT MESSAGE THREAD (No raw URL shown — Buttons Only!) */}
                <div
                  className={`absolute inset-0 bg-white text-[#1D1D1F] flex flex-col transition-transform duration-200 ease-out ${
                    stageMeta.isDmOpen && !stageMeta.isFormOpen && !stageMeta.isPdfOpened
                      ? 'translate-x-0 opacity-100'
                      : stageMeta.isFormOpen || stageMeta.isPdfOpened
                      ? '-translate-x-6 opacity-0 pointer-events-none'
                      : 'translate-x-10 opacity-0 pointer-events-none'
                  }`}
                >
                  {/* Authentic IG Top Header with Follow / Following Button + IG Highlight */}
                  <div className="px-3.5 py-2.5 border-b border-[#EFEFEF] flex items-center justify-between gap-2 shrink-0 relative z-20 bg-white">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setViewerStage('comment_replied')}
                        aria-label="Back to Reel comments"
                        className="p-1 text-[#000000] hover:bg-[#F5F5F7] rounded-lg cursor-pointer shrink-0"
                      >
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#962FBF] shrink-0">
                        <div className="p-[1px] rounded-full bg-white">
                          <SafeImage
                            src={account.avatarUrl}
                            alt={account.accountName}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-[#000000] truncate">{handleClean}</p>
                          <svg viewBox="0 0 16 16" className="w-3 h-3 text-[#0095F6] shrink-0" aria-hidden="true">
                            <circle cx="8" cy="8" r="7" fill="currentColor" />
                            <path
                              d="M5.2 8.2l1.8 1.8 3.8-3.8"
                              fill="none"
                              stroke="#FFFFFF"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <p className="text-[10px] text-[#737373] truncate">{account.accountName}</p>
                      </div>
                    </div>

                    <div className="relative shrink-0">
                      <div
                        className={
                          viewerStage === 'dm_thread' && !stageMeta.isViewerFollowing
                            ? 'p-[2px] rounded-[10px] bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#962FBF] shadow-[0_0_0_3px_rgba(214,41,118,0.18)]'
                            : ''
                        }
                      >
                        <button
                          type="button"
                          data-testid="walkthrough-follow-btn"
                          disabled={stageMeta.isViewerFollowing}
                          onClick={handleViewerFollow}
                          className={`px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-colors whitespace-nowrap ${
                            stageMeta.isViewerFollowing
                              ? 'bg-[#EFEFEF] text-[#000000] cursor-default'
                              : 'bg-[#0095F6] hover:bg-[#1877F2] text-white cursor-pointer'
                          }`}
                        >
                          {stageMeta.isViewerFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>

                      <AnimatePresence>
                        {viewerStage === 'dm_thread' && !stageMeta.isViewerFollowing && (
                          <motion.div
                            data-testid="walkthrough-follow-highlight"
                            initial={{ opacity: 0, y: -4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute right-0 top-[calc(100%+8px)] z-30 w-[198px] pointer-events-none"
                          >
                            <div className="flex justify-end pr-6">
                              <div className="w-2.5 h-2.5 rotate-45 bg-[#1C1C1E] border-l border-t border-[#D62976]/45 -mb-1.5" />
                            </div>
                            <div className="rounded-xl bg-[#1C1C1E] text-white px-2.5 py-2 shadow-xl border border-[#D62976]/45 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#962FBF] shrink-0" />
                              <span className="text-[11px] font-medium leading-tight">
                                Press <strong className="text-[#38BDF8]">Follow</strong> in the IG header to unlock
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* DM Conversation Messages */}
                  <div
                    className={`flex-1 overflow-y-auto px-3.5 pb-3 space-y-2.5 bg-white transition-[padding] duration-200 ${
                      viewerStage === 'dm_thread' && !stageMeta.isViewerFollowing ? 'pt-14' : 'pt-3'
                    }`}
                  >
                    <div className="flex justify-end">
                      <div className="max-w-[78%] bg-[#3797F0] text-white rounded-[18px] rounded-br-[4px] px-3 py-1.5 text-xs">
                        Commented <span className="font-mono-tabular font-semibold">{primaryWord}</span> on your Reel
                      </div>
                    </div>

                    {draft.followGateEnabled && (
                      <div className="flex items-end gap-2">
                        <SafeImage
                          src={account.avatarUrl}
                          alt={account.accountName}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                        <div className="max-w-[85%] bg-[#EFEFEF] text-[#000000] rounded-[18px] rounded-bl-[4px] px-3 py-2 space-y-0.5">
                          <p className="text-[11px] leading-snug">{draft.followGatePrompt}</p>
                          <p className="text-[10px] font-medium text-[#737373]">
                            {stageMeta.isViewerFollowing
                              ? `Verified — Following ${account.igHandle}`
                              : 'Waiting for Follow at top header'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Stage 4: Clean Button Only in DM (Zero Raw URL Text!) */}
                    {viewerStage === 'unlocked_outcome' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-end gap-2"
                      >
                        <SafeImage
                          src={account.avatarUrl}
                          alt={account.accountName}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 space-y-1.5">
                          <div className="bg-[#EFEFEF] text-[#000000] rounded-[18px] rounded-bl-[4px] px-3 py-2 text-[11px] leading-snug">
                            Awesome, thanks for following! Tap below to open your <strong>{draft.name}</strong>:
                          </div>

                          {/* Native IG Automated DM Card — Clean Title + Button Only, No URL Shown */}
                          <div className="bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden">
                            <div className="px-3 py-2.5 bg-[#FAFAFA] flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#0095F6]/10 text-[#0095F6] flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" aria-hidden="true" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#000000] truncate">
                                  {draft.name}
                                </p>
                                <p className="text-[10px] text-[#737373]">
                                  Tap to enter name & email
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              data-testid="walkthrough-link-btn"
                              onClick={handleOpenInAppForm}
                              className="w-full py-2.5 px-3 border-t border-[#DBDBDB] bg-white hover:bg-[#FAFAFA] text-[#0095F6] text-xs font-semibold text-center whitespace-nowrap cursor-pointer transition-colors"
                            >
                              {draft.destinationButtonLabel}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="px-3.5 py-2.5 border-t border-[#EFEFEF] bg-white flex items-center justify-between gap-2 shrink-0">
                    <div className="flex-1 px-3 py-1.5 rounded-full bg-[#F5F5F7] text-[11px] text-[#8E8E93] flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-[#0095F6]" aria-hidden="true" />
                      <span>Viewer is inside your automated DM</span>
                    </div>
                    <Play className="w-3.5 h-3.5 text-[#8E8E93]" aria-hidden="true" />
                  </div>
                </div>

                {/* STAGE 5: INSTAGRAM IN-APP BROWSER WEBVIEW -> n8n NAME & EMAIL FORM */}
                <div
                  data-testid="walkthrough-inapp-form"
                  className={`absolute inset-0 bg-[#F5F5F7] text-[#1D1D1F] flex flex-col transition-transform duration-200 ease-out ${
                    stageMeta.isFormOpen
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-8 opacity-0 pointer-events-none'
                  }`}
                >
                  {/* Authentic Instagram In-App Browser Chrome */}
                  <div className="px-3 py-2 bg-white border-b border-[#DBDBDB] flex items-center justify-between gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewerStage('unlocked_outcome')}
                      className="text-xs font-semibold text-[#000000] px-1 cursor-pointer"
                    >
                      Done
                    </button>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#262626] min-w-0">
                      <Lock className="w-3 h-3 text-[#16A34A] shrink-0" aria-hidden="true" />
                      <span className="truncate">studiokairo.co</span>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-[#262626] shrink-0" aria-hidden="true" />
                  </div>

                  {/* Embedded n8n Web Form Inside IG */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center">
                    <form
                      onSubmit={handleN8nFormSubmit}
                      noValidate
                      className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-sm space-y-3.5"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono-tabular font-semibold uppercase tracking-wide text-[#FF6D5A]">
                          n8n Lead Form
                        </span>
                        <h3 className="text-sm font-display font-semibold text-[#1D1D1F]">
                          {draft.name}
                        </h3>
                        <p className="text-[11px] text-[#6E6E73] leading-snug">
                          Enter your name & email below to open the PDF right in your browser.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label htmlFor="viewer-n8n-name" className="block text-[11px] font-medium text-[#1D1D1F] mb-1">
                            Your Name
                          </label>
                          <input
                            id="viewer-n8n-name"
                            data-testid="n8n-name-input"
                            type="text"
                            value={viewerName}
                            onChange={(e) => setViewerName(e.target.value)}
                            placeholder="Alex Rivera"
                            className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg outline-none focus:border-[#0095F6]"
                          />
                        </div>

                        <div>
                          <label htmlFor="viewer-n8n-email" className="block text-[11px] font-medium text-[#1D1D1F] mb-1">
                            Email Address
                          </label>
                          <input
                            id="viewer-n8n-email"
                            data-testid="n8n-email-input"
                            type="email"
                            value={viewerEmail}
                            onChange={(e) => setViewerEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg outline-none focus:border-[#0095F6]"
                          />
                        </div>
                      </div>

                      {formError && <p className="text-[11px] text-[#DC2626]">{formError}</p>}

                      <button
                        type="submit"
                        data-testid="n8n-form-submit-btn"
                        className="w-full py-2.5 px-4 bg-[#FF6D5A] hover:bg-[#E85C4A] text-white text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                      >
                        <span>Submit & Open PDF</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* STAGE 6: BROWSER PDF DELIVERY VIEW + CREATOR OUTCOME SUMMARY */}
                <div
                  data-testid="walkthrough-browser-pdf"
                  className={`absolute inset-0 bg-[#F5F5F7] text-[#1D1D1F] flex flex-col transition-transform duration-200 ease-out ${
                    stageMeta.isPdfOpened
                      ? 'translate-x-0 opacity-100'
                      : 'translate-x-8 opacity-0 pointer-events-none'
                  }`}
                >
                  {/* Mobile Browser Top Address Bar */}
                  <div className="px-3 py-2 bg-white border-b border-[#E5E5EA] flex items-center justify-between gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewerStage('in_app_form')}
                      aria-label="Back to n8n form"
                      className="p-1 text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-lg cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <div className="flex-1 px-2.5 py-1 rounded-lg bg-[#F5F5F7] flex items-center justify-center gap-1.5 text-[11px] text-[#1D1D1F] min-w-0">
                      <Lock className="w-3 h-3 text-[#16A34A] shrink-0" aria-hidden="true" />
                      <span className="truncate font-mono-tabular">creator-guide.pdf</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#6E6E73] shrink-0" aria-hidden="true" />
                  </div>

                  {/* Rendered Browser PDF Document + Outcome Card */}
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                    {/* PDF Document Preview Card */}
                    <div className="bg-white border border-[#E5E5EA] rounded-2xl p-3.5 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1D1D1F] truncate">
                              {draft.name}
                            </p>
                            <p className="text-[10px] text-[#6E6E73]">
                              PDF opened in browser · Page 1 of 8
                            </p>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-[#0071E3] shrink-0" aria-hidden="true" />
                      </div>

                      <div className="rounded-xl bg-[#F5F5F7] p-3 space-y-1.5 border border-[#E5E5EA]/60">
                        <p className="text-[11px] font-display font-semibold text-[#1D1D1F]">
                          Welcome, {viewerName}!
                        </p>
                        <p className="text-[10px] text-[#6E6E73] leading-relaxed">
                          Your copy is unlocked and a backup link was sent to <span className="font-mono-tabular text-[#1D1D1F]">{viewerEmail}</span>.
                        </p>
                      </div>
                    </div>

                    {/* Creator Value Outcome Card */}
                    <div
                      data-testid="walkthrough-outcome-card"
                      className="bg-[#1D1D1F] text-white rounded-2xl p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-display font-semibold inline-flex items-center gap-1.5 text-[#4ADE80]">
                          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                          Follower + Lead + Delivery Complete
                        </span>
                        <span className="text-[11px] font-mono-tabular text-white/80 whitespace-nowrap shrink-0">+1 / +1</span>
                      </div>
                      <p className="text-[11px] text-white/85 leading-snug">
                        You got a follower, captured their Name & Email via your n8n form, and delivered your PDF in their browser—all automatically.
                      </p>
                      <button
                        type="button"
                        data-testid="outcome-continue-signup-btn"
                        onClick={() => setActiveStep('signup')}
                        className="w-full py-2 px-3 bg-[#0071E3] hover:bg-[#0062C4] text-white text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <span>{isIgLinked ? 'Connected! Launch App' : 'Now Sign Up with Instagram'}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
