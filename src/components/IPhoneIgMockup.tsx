import {
  Bookmark,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Compass,
  ExternalLink,
  Film,
  Grid,
  Heart,
  Home,
  Image as ImageIcon,
  Mail,
  Menu,
  MessageCircle,
  Mic,
  MoreHorizontal,
  MoreVertical,
  Music,
  Pause,
  Phone,
  Play,
  PlusSquare,
  RotateCcw,
  Search,
  Send,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { MetaAccountState, ReelPost, RuleDraft, SimulatorStage } from '../types/automation';
import { SafeImage } from './SafeImage';

export type IPhoneScreenMode = 'profile' | 'reel' | 'dm';

interface IPhoneIgMockupProps {
  account: MetaAccountState;
  draft: RuleDraft;
  posts: ReelPost[];
  screenMode: IPhoneScreenMode;
  onChangeScreenMode: (mode: IPhoneScreenMode) => void;
  viewerFollowing: boolean;
  onToggleViewerFollowing: (following: boolean) => void;
  simComment: string;
  onChangeSimComment: (val: string) => void;
  onSubmitComment: () => void;
  simStage: SimulatorStage;
  simMatchedWord: string | null;
  simMismatchNotice: string | null;
  onVerifyFollow: () => void;
  simEmailInput: string;
  onChangeSimEmailInput: (val: string) => void;
  simEmailError: string | null;
  onSubmitEmail: (e: React.FormEvent) => void;
  onCompleteExternalEmail: () => void;
  onReset: () => void;
  onTriggerUpload: () => void;
  allowThumbnailPreview?: boolean;
  previewTitle?: string;
  previewSubtitle?: string;
}

export function IPhoneIgMockup({
  account,
  draft,
  posts,
  screenMode,
  onChangeScreenMode,
  viewerFollowing,
  onToggleViewerFollowing,
  simComment,
  onChangeSimComment,
  onSubmitComment,
  simStage,
  simMatchedWord,
  simMismatchNotice,
  onVerifyFollow,
  simEmailInput,
  onChangeSimEmailInput,
  simEmailError,
  onSubmitEmail,
  onCompleteExternalEmail,
  onReset,
  onTriggerUpload,
  allowThumbnailPreview = false,
  previewTitle = 'Instagram Preview',
  previewSubtitle = 'See how your page, video, and messages look on iPhone',
}: IPhoneIgMockupProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [showCenterHeart, setShowCenterHeart] = useState(false);

  useEffect(() => {
    setLiked(false);
    setShowCenterHeart(false);
  }, [draft.id]);

  const hasUploadedVideo = Boolean(draft.videoUrl);
  const canPreviewReel = Boolean(draft.videoUrl || (allowThumbnailPreview && draft.thumbnailUrl));
  const handleClean = account.igHandle.replace('@', '');

  const primaryKeyword =
    draft.keywords
      .split(',')
      .map((k) => k.trim())
      .find((k) => k.length > 0) ?? 'GUIDE';

  const displayCaption =
    draft.caption?.trim() ||
    `Comment "${primaryKeyword}" below and I'll send you the link right away.`;

  const triggerLikeAnimation = (fromDoubleTap = false) => {
    setLiked((prev) => (fromDoubleTap ? true : !prev));
    if (fromDoubleTap || !liked) {
      setBurstKey((k) => k + 1);
      setShowCenterHeart(true);
      window.setTimeout(() => {
        setShowCenterHeart(false);
      }, 720);
    }
  };

  const togglePlayPause = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setVideoPlaying(true);
    } else {
      el.pause();
      setVideoPlaying(false);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setVideoMuted(el.muted);
  };

  const isDarkScreen = screenMode === 'reel';

  return (
    <div className="space-y-3">
      {/* Simple Preview Switcher */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-display font-semibold text-[#1D1D1F]">
              {previewTitle}
            </h2>
            <p className="text-[11px] text-[#6E6E73]">
              {previewSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLiked(false);
              onReset();
            }}
            aria-label="Reset Instagram preview"
            className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 bg-[#F5F5F7] rounded-lg" role="group" aria-label="iPhone Instagram screen view">
          {(
            [
              { id: 'profile', label: 'IG Page' },
              { id: 'reel', label: 'Reel Video' },
              { id: 'dm', label: 'Messages' },
            ] as { id: IPhoneScreenMode; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeScreenMode(tab.id)}
              className={`py-1.5 px-2 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                screenMode === tab.id
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-[#6E6E73]">Preview as:</span>
          <div className="flex items-center gap-1 p-0.5 bg-[#F5F5F7] rounded-md">
            <button
              type="button"
              onClick={() => onToggleViewerFollowing(false)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded cursor-pointer ${
                !viewerFollowing ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#6E6E73]'
              }`}
            >
              New visitor
            </button>
            <button
              type="button"
              onClick={() => onToggleViewerFollowing(true)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded cursor-pointer ${
                viewerFollowing ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#6E6E73]'
              }`}
            >
              Follower
            </button>
          </div>
        </div>
      </div>

      {/* Polished Titanium iPhone 16 Pro Hardware Shell */}
      <div className="flex justify-center">
        <div
          data-testid="iphone-ig-mockup"
          className="relative w-full max-w-none rounded-none p-0 bg-transparent ring-0 shadow-none sm:max-w-[336px] sm:rounded-[50px] sm:p-[9px] sm:bg-gradient-to-b sm:from-[#3A3A3E] sm:via-[#1E1E21] sm:to-[#2C2C30] sm:ring-1 sm:ring-black/30 sm:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.28)]"
        >
          {/* Inner glossy bezel lip */}
          <div className="rounded-none p-0 bg-transparent ring-0 sm:rounded-[42px] sm:p-[2px] sm:bg-[#0A0A0B] sm:ring-1 sm:ring-white/10">
            {/* Hardware Side Buttons */}
            <div className="hidden sm:block absolute -left-[2.5px] top-24 w-[2.5px] h-6 bg-[#48484D] rounded-l-sm" aria-hidden="true" />
            <div className="hidden sm:block absolute -left-[2.5px] top-34 w-[2.5px] h-10 bg-[#48484D] rounded-l-sm" aria-hidden="true" />
            <div className="hidden sm:block absolute -left-[2.5px] top-47 w-[2.5px] h-10 bg-[#48484D] rounded-l-sm" aria-hidden="true" />
            <div className="hidden sm:block absolute -right-[2.5px] top-36 w-[2.5px] h-14 bg-[#48484D] rounded-r-sm" aria-hidden="true" />

            {/* iPhone Display */}
            <div
              className={`relative rounded-none sm:rounded-[40px] overflow-hidden flex flex-col h-full min-h-[560px] ${
                isDarkScreen ? 'bg-black text-white' : 'bg-white text-[#1D1D1F]'
              }`}
            >
              {/* Authentic iOS Status Bar + Dynamic Island */}
              <div
                className={`px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-semibold shrink-0 z-20 ${
                  isDarkScreen
                    ? 'text-white bg-gradient-to-b from-black/70 to-transparent'
                    : 'text-[#1D1D1F] bg-white'
                }`}
              >
                <span className="font-mono-tabular tracking-tight w-10">9:41</span>
                <div
                  className="hidden sm:flex w-[92px] h-[24px] bg-black rounded-full items-center justify-between px-2.5 ring-1 ring-white/10"
                  aria-hidden="true"
                >
                  <span className="w-6 h-1 rounded-full bg-[#1C1C20]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#14141D] ring-1 ring-[#272736]" />
                </div>
                <div className="w-10 flex items-center justify-end gap-1" aria-hidden="true">
                  {/* Cellular Signal Bars */}
                  <svg viewBox="0 0 14 10" className="w-3 h-2.5 fill-current">
                    <rect x="0" y="7" width="2.2" height="3" rx="0.6" />
                    <rect x="3.6" y="5" width="2.2" height="5" rx="0.6" />
                    <rect x="7.2" y="2.5" width="2.2" height="7.5" rx="0.6" />
                    <rect x="10.8" y="0" width="2.2" height="10" rx="0.6" />
                  </svg>
                  {/* Battery */}
                  <svg viewBox="0 0 22 11" className="w-4.5 h-2.5">
                    <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                    <rect x="2" y="2" width="14" height="7" rx="1.2" fill="currentColor" />
                    <path d="M19.5 3.5v4a1.2 1.2 0 0 0 1-1.2v-1.6a1.2 1.2 0 0 0-1-1.2z" fill="currentColor" opacity="0.5" />
                  </svg>
                </div>
              </div>

              {/* SCREEN 1: AUTHENTIC INSTAGRAM PROFILE PAGE */}
              <AnimatePresence mode="wait" initial={false}>
                {screenMode === 'profile' && (
                  <motion.div
                    key="iphone-screen-profile"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                  <div className="flex-1 overflow-y-auto">
                    {/* Real IG Profile Header */}
                    <div className="px-4 py-1 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[15px] font-display font-bold tracking-tight text-[#1D1D1F]">
                          {handleClean}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-[#1D1D1F]" aria-hidden="true" />
                      </div>
                      <div className="flex items-center gap-3.5 text-[#1D1D1F]" aria-hidden="true">
                        <PlusSquare className="w-4.5 h-4.5" />
                        <Menu className="w-4.5 h-4.5" />
                      </div>
                    </div>

                    {/* Avatar + IG Stats Row */}
                    <div className="px-4 pt-1.5 pb-1.5 flex items-center gap-4">
                      <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#962FBF] shrink-0">
                        <div className="p-[2px] bg-white rounded-full">
                          <SafeImage
                            src={account.avatarUrl}
                            alt={account.accountName}
                            className="w-[60px] h-[60px] rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 text-left pl-1">
                        <div>
                          <p className="text-[14px] font-bold text-[#1D1D1F] font-mono-tabular leading-tight">
                            142
                          </p>
                          <p className="text-[11px] text-[#1D1D1F]">posts</p>
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#1D1D1F] font-mono-tabular leading-tight">
                            {(account.followersCount + (viewerFollowing ? 1 : 0)).toLocaleString()}
                          </p>
                          <p className="text-[11px] text-[#1D1D1F]">followers</p>
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#1D1D1F] font-mono-tabular leading-tight">
                            318
                          </p>
                          <p className="text-[11px] text-[#1D1D1F]">following</p>
                        </div>
                      </div>
                    </div>

                    {/* Bio Block */}
                    <div className="px-4 pb-2 space-y-0.5 text-[11px] leading-snug">
                      <p className="font-semibold text-[#1D1D1F]">{account.accountName}</p>
                      <p className="text-[#6E6E73]">Digital creator</p>
                      <p className="text-[#1D1D1F]">Systems, templates & visual guides</p>
                      <p className="text-[#00376B] font-medium truncate">
                        {draft.destinationUrl || 'studiokairo.co'}
                      </p>
                    </div>

                    {/* Real IG Action Buttons Row */}
                    <div className="px-4 pb-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleViewerFollowing(!viewerFollowing)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          viewerFollowing
                            ? 'bg-[#EFEFEF] text-[#1D1D1F]'
                            : 'bg-[#0095F6] text-white'
                        }`}
                      >
                        {viewerFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            Following
                          </>
                        ) : (
                          'Follow'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeScreenMode('dm')}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#EFEFEF] text-[#1D1D1F] cursor-pointer"
                      >
                        Message
                      </button>
                      <span
                        className="w-8 h-7 rounded-lg bg-[#EFEFEF] flex items-center justify-center text-[#1D1D1F] shrink-0"
                        aria-hidden="true"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Story Highlights Row */}
                    <div className="px-4 pb-2.5 flex items-center gap-3.5 overflow-x-auto">
                      {[
                        { label: 'Guides', img: posts[1]?.thumbnailUrl },
                        { label: 'Gear', img: posts[2]?.thumbnailUrl },
                        { label: 'Type', img: posts[3]?.thumbnailUrl },
                      ].map((hl) => (
                        <div key={hl.label} className="flex flex-col items-center gap-1 shrink-0">
                          <div className="w-11 h-11 rounded-full p-[1.5px] border border-[#DBDBDB]">
                            <SafeImage
                              src={hl.img || account.avatarUrl}
                              alt={hl.label}
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                          <span className="text-[10px] text-[#1D1D1F]">{hl.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* IG Grid Tabs */}
                    <div className="grid grid-cols-3 border-t border-[#EFEFEF]">
                      <div className="py-1.5 flex justify-center text-[#8E8E8E]">
                        <Grid className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="py-1.5 flex justify-center text-[#1D1D1F] border-b-[1.5px] border-[#1D1D1F]">
                        <Film className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="py-1.5 flex justify-center text-[#8E8E8E]">
                        <Bookmark className="w-4 h-4" aria-hidden="true" />
                      </div>
                    </div>

                    {/* IG 3-Column Reels Grid */}
                    <div className="grid grid-cols-3 gap-[1.5px] bg-white pt-[1.5px]">
                      {canPreviewReel ? (
                        <button
                          type="button"
                          onClick={() => onChangeScreenMode('reel')}
                          aria-label="Open your uploaded Reel on Instagram"
                          className="relative aspect-[3/4] bg-[#1C1C1E] overflow-hidden cursor-pointer text-left"
                        >
                          {hasUploadedVideo ? (
                            <video
                              src={draft.videoUrl}
                              poster={draft.thumbnailUrl}
                              muted
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <SafeImage
                              src={draft.thumbnailUrl}
                              alt={draft.postTitle}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 p-1.5 flex flex-col justify-between">
                            <span className="self-end text-[9px] font-semibold text-white bg-black/55 px-1.5 py-0.5 rounded">
                              {hasUploadedVideo ? 'New' : 'Trending'}
                            </span>
                            <div className="text-white">
                              <p className="text-[10px] font-mono-tabular font-semibold truncate">
                                {primaryKeyword}
                              </p>
                              <p className="text-[9px] text-white/85 flex items-center gap-0.5">
                                <Play className="w-2.5 h-2.5 fill-white" aria-hidden="true" />
                                {hasUploadedVideo ? 'Ready' : 'Live'}
                              </p>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onTriggerUpload}
                          aria-label="Upload a video to see it on Instagram"
                          className="aspect-[3/4] bg-[#F5F5F7] border border-dashed border-[#C7C7CC] flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-[#EFEFF4] transition-colors"
                        >
                          <PlusSquare className="w-5 h-5 text-[#0095F6] mb-1" aria-hidden="true" />
                          <span className="text-[10px] font-medium text-[#1D1D1F] leading-tight">
                            Upload video
                          </span>
                        </button>
                      )}

                      {(() => {
                        const otherPosts = posts.filter((p) => p.id !== 'any');
                        return Array.from({ length: 5 }, (_, idx) => otherPosts[idx % otherPosts.length]).map(
                          (post, idx) => (
                            <button
                              key={`${post.id}-${idx}`}
                              type="button"
                              onClick={() => onChangeScreenMode('reel')}
                              className="relative aspect-[3/4] bg-[#F5F5F7] overflow-hidden cursor-pointer"
                            >
                              <SafeImage
                                src={post.thumbnailUrl}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-1 left-1.5 text-[9px] font-medium text-white drop-shadow flex items-center gap-0.5">
                                <Play className="w-2.5 h-2.5 fill-white" aria-hidden="true" />
                                {(post.commentCount * (14 - idx)).toLocaleString()}
                              </div>
                            </button>
                          )
                        );
                      })()}
                    </div>
                  </div>

                  {/* Real IG Bottom Tab Bar */}
                  <div
                    className="h-11 px-5 border-t border-[#EFEFEF] bg-white flex items-center justify-between text-[#1D1D1F] shrink-0"
                    aria-hidden="true"
                  >
                    <Home className="w-4.5 h-4.5" />
                    <Search className="w-4.5 h-4.5" />
                    <PlusSquare className="w-4.5 h-4.5" />
                    <Film className="w-4.5 h-4.5" />
                    <SafeImage
                      src={account.avatarUrl}
                      alt={account.accountName}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-[#1D1D1F]"
                    />
                  </div>
                </motion.div>
                )}

                {/* SCREEN 2: AUTHENTIC INSTAGRAM REEL PLAYER (REQUIRES UPLOAD FIRST) */}
                {screenMode === 'reel' && (
                  <motion.div
                    key="iphone-screen-reel"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 relative flex flex-col justify-between overflow-hidden bg-black"
                  >
                  {!canPreviewReel ? (
                    /* Empty State Until User Uploads a Video */
                    <div
                      data-testid="iphone-upload-required"
                      className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-4 bg-[#121214]"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Film className="w-6 h-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-display font-semibold text-white">
                          Upload a video first
                        </p>
                        <p className="text-xs text-white/70 leading-relaxed">
                          Add your video on the left so you can preview your Reel, test the like animation, and try your magic word here.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onTriggerUpload}
                        className="px-4 py-2 bg-[#0095F6] hover:bg-[#007AD9] text-white text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Upload Video Now
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Video / Published Reel Layer with Double-Tap Like Animation */}
                      <div
                        data-testid="reel-video-surface"
                        className="absolute inset-0"
                        onDoubleClick={() => triggerLikeAnimation(true)}
                      >
                        {hasUploadedVideo ? (
                          <video
                            ref={videoRef}
                            src={draft.videoUrl}
                            poster={draft.thumbnailUrl}
                            autoPlay
                            loop
                            muted={videoMuted}
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <SafeImage
                            src={draft.thumbnailUrl}
                            alt={draft.postTitle}
                            className="w-full h-full object-cover"
                          />
                        )}

                        {/* Double-Tap / Like Heart Burst Animation */}
                        <AnimatePresence>
                          {showCenterHeart && (
                            <motion.div
                              key={burstKey}
                              initial={{ scale: 0.35, opacity: 0, rotate: -10 }}
                              animate={{ scale: [0.35, 1.25, 1], opacity: [0, 1, 1], rotate: [ -10, 8, 0 ] }}
                              exit={{ scale: 1.45, opacity: 0 }}
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
                      </div>

                      {/* Scrims for legibility */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/85 pointer-events-none" />

                      {/* Top IG Reels Header */}
                      <div className="relative z-10 px-4 pt-1 flex items-center justify-between text-white">
                        <button
                          type="button"
                          onClick={() => onChangeScreenMode('profile')}
                          className="inline-flex items-center gap-1 text-sm font-display font-bold cursor-pointer py-1"
                        >
                          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                          Reels
                        </button>

                        <div className="flex items-center gap-1.5">
                          {hasUploadedVideo && (
                            <>
                              <button
                                type="button"
                                onClick={togglePlayPause}
                                aria-label={videoPlaying ? 'Pause Reel video' : 'Play Reel video'}
                                className="p-1.5 rounded-full bg-black/45 text-white cursor-pointer"
                              >
                                {videoPlaying ? (
                                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={toggleMute}
                                aria-label={videoMuted ? 'Unmute Reel video' : 'Mute Reel video'}
                                className="p-1.5 rounded-full bg-black/45 text-white cursor-pointer"
                              >
                                {videoMuted ? (
                                  <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                                )}
                              </button>
                            </>
                          )}
                          <Camera className="w-4.5 h-4.5 ml-1" aria-hidden="true" />
                        </div>
                      </div>

                      {/* Live DM Notification Toast inside iPhone */}
                      <AnimatePresence>
                        {simStage !== 'idle' && (
                          <motion.div
                            key="iphone-dm-toast"
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className="relative z-20 mx-3 mt-1"
                          >
                            <button
                              type="button"
                              onClick={() => onChangeScreenMode('dm')}
                              className="w-full text-left bg-[#1C1C1E]/95 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-md cursor-pointer"
                            >
                              <SafeImage
                                src={account.avatarUrl}
                                alt={account.accountName}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-white truncate">
                                  {account.igHandle} · Instagram
                                </p>
                                <p className="text-[10px] text-white/80 truncate">
                                  {draft.followGateEnabled && !viewerFollowing
                                    ? 'Tap to follow & unlock your link'
                                    : 'Your link is ready — tap to open'}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold text-[#3897F0] shrink-0">
                                Open
                              </span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Bottom Reel Overlay + Engagement Column + Comment Box */}
                      <div className="relative z-10 mt-auto px-3.5 pb-2.5 space-y-2">
                        <div className="flex items-end justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <SafeImage
                                src={account.avatarUrl}
                                alt={account.accountName}
                                className="w-7 h-7 rounded-full object-cover border border-white/40 shrink-0"
                              />
                              <span className="text-xs font-semibold text-white truncate">
                                {handleClean}
                              </span>
                              <button
                                type="button"
                                onClick={() => onToggleViewerFollowing(!viewerFollowing)}
                                className="px-2.5 py-0.5 text-[10px] font-semibold rounded-md border border-white/75 text-white cursor-pointer"
                              >
                                {viewerFollowing ? 'Following' : 'Follow'}
                              </button>
                            </div>

                            <p className="text-[11.5px] text-white/95 leading-snug line-clamp-2">
                              {displayCaption}
                            </p>

                            <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                              <Music className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span className="truncate">{handleClean} · Original audio</span>
                            </div>
                          </div>

                          {/* Real IG Engagement Column */}
                          <div className="flex flex-col items-center gap-3 text-white shrink-0 pb-0.5">
                            <motion.button
                              type="button"
                              onClick={() => triggerLikeAnimation(false)}
                              whileTap={{ scale: 0.85 }}
                              animate={liked ? { scale: [1, 1.28, 1] } : { scale: 1 }}
                              transition={{ duration: 0.28 }}
                              aria-label="Like Reel"
                              aria-pressed={liked}
                              className="flex flex-col items-center gap-0.5 cursor-pointer"
                            >
                              <Heart
                                className={`w-5.5 h-5.5 transition-colors ${
                                  liked ? 'fill-[#FF3040] text-[#FF3040]' : 'text-white'
                                }`}
                                aria-hidden="true"
                              />
                              <span className="text-[10px] font-mono-tabular">
                                {liked ? '413' : '412'}
                              </span>
                            </motion.button>
                            <button
                              type="button"
                              onClick={() => onChangeScreenMode('dm')}
                              aria-label="Open DM thread"
                              className="flex flex-col items-center gap-0.5 cursor-pointer"
                            >
                              <MessageCircle className="w-5.5 h-5.5" aria-hidden="true" />
                              <span className="text-[10px] font-mono-tabular">89</span>
                            </button>
                            <Send className="w-5 h-5" aria-hidden="true" />
                            <MoreVertical className="w-4 h-4 opacity-80" aria-hidden="true" />
                          </div>
                        </div>

                        {simStage !== 'idle' && (
                          <div className="bg-black/70 backdrop-blur-sm border border-white/15 rounded-xl p-2 text-[11px] space-y-0.5">
                            <p className="text-white/90 truncate">
                              <span className="font-semibold">you</span> {simComment}
                            </p>
                            <p className="text-[#4ADE80] truncate">
                              <span className="font-semibold">{handleClean}</span> {draft.publicReply}
                            </p>
                          </div>
                        )}

                        {simMismatchNotice && (
                          <p className="text-[11px] text-[#FBBF24] bg-black/75 rounded-lg px-2.5 py-1">
                            {simMismatchNotice}
                          </p>
                        )}

                        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-3 py-1.5">
                          <label htmlFor="iphone-reel-comment" className="sr-only">
                            Try commenting your magic word
                          </label>
                          <input
                            id="iphone-reel-comment"
                            type="text"
                            value={simComment}
                            onChange={(e) => onChangeSimComment(e.target.value)}
                            placeholder={`Comment "${primaryKeyword}"...`}
                            className="flex-1 min-w-0 bg-transparent text-xs text-white placeholder:text-white/65 outline-none"
                          />
                          <button
                            type="button"
                            onClick={onSubmitComment}
                            className="px-2.5 py-1 bg-[#0095F6] hover:bg-[#007AD9] text-white text-[11px] font-semibold rounded-full shrink-0 cursor-pointer"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Real IG Dark Bottom Tab Bar */}
                  <div
                    className="h-11 px-5 bg-black border-t border-white/10 flex items-center justify-between text-white shrink-0 z-10"
                    aria-hidden="true"
                  >
                    <Home className="w-4.5 h-4.5 opacity-85" />
                    <Search className="w-4.5 h-4.5 opacity-85" />
                    <PlusSquare className="w-4.5 h-4.5 opacity-85" />
                    <Film className="w-4.5 h-4.5" />
                    <SafeImage
                      src={account.avatarUrl}
                      alt={account.accountName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  </div>
                </motion.div>
                )}

                {/* SCREEN 3: AUTHENTIC INSTAGRAM DIRECT MESSAGE THREAD */}
                {screenMode === 'dm' && (
                  <motion.div
                    key="iphone-screen-dm"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 flex flex-col bg-white overflow-hidden"
                  >
                  {/* Real IG DM Top Bar */}
                  <div className="px-3 py-2 border-b border-[#EFEFEF] flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => onChangeScreenMode('reel')}
                        aria-label="Back to Instagram Reel"
                        className="p-1 text-[#1D1D1F] cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                      </button>
                      <SafeImage
                        src={account.avatarUrl}
                        alt={account.accountName}
                        className="w-8 h-8 rounded-full object-cover border border-[#EFEFEF] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1D1D1F] truncate">
                          {account.accountName}
                        </p>
                        <p className="text-[10px] text-[#8E8E8E] truncate">{handleClean}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[#1D1D1F] pr-1" aria-hidden="true">
                      <Phone className="w-4 h-4" />
                      <Video className="w-4.5 h-4.5" />
                    </div>
                  </div>

                  {/* DM Conversation Area */}
                  <div
                    data-testid="dm-simulator-thread"
                    className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-white"
                  >
                    {!canPreviewReel ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-3">
                        <Film className="w-7 h-7 text-[#8E8E8E]" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#1D1D1F]">
                            Upload a video first
                          </p>
                          <p className="text-[11px] text-[#8E8E8E] leading-relaxed">
                            Once you upload your video on the left, you can test the automatic messages right here.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onTriggerUpload}
                          className="px-4 py-2 bg-[#0095F6] hover:bg-[#007AD9] text-white text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          Upload Video
                        </button>
                      </div>
                    ) : simStage === 'idle' ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-3">
                        <MessageCircle className="w-7 h-7 text-[#8E8E8E]" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#1D1D1F]">
                            Test your automatic messages
                          </p>
                          <p className="text-[11px] text-[#8E8E8E] leading-relaxed">
                            See what happens when someone comments{' '}
                            <span className="font-mono-tabular font-semibold text-[#1D1D1F]">
                              {primaryKeyword}
                            </span>{' '}
                            on your video.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onSubmitComment}
                          className="px-4 py-2 bg-[#0095F6] hover:bg-[#007AD9] text-white text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          Try Comment “{primaryKeyword}”
                        </button>
                        {simMismatchNotice && (
                          <p className="text-[11px] text-[#D97706]">{simMismatchNotice}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Outgoing viewer comment tag */}
                        <div className="flex justify-end">
                          <div className="bg-[#3797F0] text-white text-xs px-3 py-1.5 rounded-2xl rounded-br-sm max-w-[80%]">
                            {simComment}
                          </div>
                        </div>

                        <div className="text-center text-[10px] text-[#8E8E8E]">
                          Matched “{simMatchedWord}” · Replied to comment
                        </div>

                        <AnimatePresence mode="wait">
                          {/* Creator Bubble: Follow-Gate */}
                          {simStage === 'follow_gate_wait' && (
                            <motion.div
                              key="dm-stage-follow"
                              initial={{ opacity: 0, y: 6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.98 }}
                              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                              className="flex items-end gap-2"
                            >
                              <SafeImage
                                src={account.avatarUrl}
                                alt={account.accountName}
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                              <div className="bg-[#EFEFEF] rounded-2xl rounded-bl-sm p-3 space-y-2.5 max-w-[85%] text-xs">
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-[#D97706]">
                                  <Compass className="w-3 h-3" aria-hidden="true" />
                                  Follow Check
                                </div>
                                <p className="text-[#1D1D1F] leading-relaxed">{draft.followGatePrompt}</p>
                                <button
                                  type="button"
                                  onClick={onVerifyFollow}
                                  className="w-full py-2 px-3 bg-white hover:bg-[#F5F5F7] text-[#0095F6] font-semibold rounded-xl border border-[#DBDBDB] flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                                  {draft.followGateButtonLabel || "I've Followed — Get the Link"}
                                </button>
                              </div>
                            </motion.div>
                          )}

                          {/* Creator Bubble: Email Capture */}
                          {simStage === 'email_gate_wait' && (
                            <motion.div
                              key="dm-stage-email"
                              initial={{ opacity: 0, y: 6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.98 }}
                              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                              className="flex items-end gap-2"
                            >
                              <SafeImage
                                src={account.avatarUrl}
                                alt={account.accountName}
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                              <div className="bg-[#EFEFEF] rounded-2xl rounded-bl-sm p-3 space-y-2.5 max-w-[85%] text-xs">
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-[#0071E3]">
                                  <Mail className="w-3 h-3" aria-hidden="true" />
                                  Quick Email Step
                                </div>
                                <p className="text-[#1D1D1F] leading-relaxed">{draft.emailPrompt}</p>

                                {draft.emailCaptureMode === 'in_dm' ? (
                                  <form onSubmit={onSubmitEmail} className="space-y-2">
                                    <label htmlFor="sim-email-capture" className="sr-only">
                                      Viewer email address
                                    </label>
                                    <input
                                      id="sim-email-capture"
                                      type="email"
                                      value={simEmailInput}
                                      onChange={(e) => onChangeSimEmailInput(e.target.value)}
                                      placeholder="name@email.com"
                                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#DBDBDB] rounded-lg outline-none focus:border-[#0095F6]"
                                    />
                                    {simEmailError && (
                                      <p className="text-[11px] text-[#DC2626]">{simEmailError}</p>
                                    )}
                                    <button
                                      type="submit"
                                      className="w-full py-2 px-3 bg-[#0095F6] hover:bg-[#007AD9] text-white font-semibold rounded-xl cursor-pointer"
                                    >
                                      Send Email & Get Link
                                    </button>
                                  </form>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-mono-tabular text-[#6E6E73] break-all bg-white px-2 py-1.5 rounded-lg border border-[#E5E5EA]">
                                      {draft.emailCollectionUrl || 'https://yourdomain.com/email-collect'}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={onCompleteExternalEmail}
                                      className="w-full py-2 px-3 bg-[#0095F6] hover:bg-[#007AD9] text-white font-semibold rounded-xl cursor-pointer"
                                    >
                                      Finish Email Step & Unlock
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}

                          {/* Creator Bubble: Final Get the Link */}
                          {simStage === 'link_delivered' && (
                            <motion.div
                              key="dm-stage-link"
                              initial={{ opacity: 0, y: 6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.98 }}
                              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                              className="flex items-end gap-2"
                            >
                              <SafeImage
                                src={account.avatarUrl}
                                alt={account.accountName}
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                              <div className="bg-[#EFEFEF] rounded-2xl rounded-bl-sm p-3 space-y-2.5 max-w-[85%] text-xs">
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-[#16A34A]">
                                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                  Link Ready
                                </div>
                                <p className="text-[#1D1D1F] leading-relaxed">
                                  Thanks! Tap below to open your link.
                                </p>
                                <a
                                  href={draft.destinationUrl || '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full py-2 px-3 bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] font-semibold rounded-xl border border-[#DBDBDB] flex items-center justify-center gap-1.5"
                                >
                                  <span>{draft.destinationButtonLabel || 'Get the Link'}</span>
                                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                                </a>
                                <p className="text-[10px] font-mono-tabular text-[#8E8E8E] truncate">
                                  {draft.destinationUrl || 'Add your link on the left'}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>

                  {/* Real IG DM Composer */}
                  <div className="px-3 py-2 bg-white shrink-0">
                    <div className="flex items-center gap-2 bg-[#EFEFEF] rounded-full p-1 pr-3">
                      <span
                        className="w-7 h-7 rounded-full bg-[#0095F6] text-white flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </span>
                      <span className="flex-1 text-xs text-[#8E8E8E]">Message...</span>
                      <div className="flex items-center gap-2.5 text-[#1D1D1F]" aria-hidden="true">
                        <Mic className="w-4 h-4" />
                        <ImageIcon className="w-4 h-4" />
                        <MoreHorizontal className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
                )}
              </AnimatePresence>

              {/* iOS Home Indicator */}
              <div
                className={`py-2 flex justify-center shrink-0 ${
                  isDarkScreen ? 'bg-black' : 'bg-white'
                }`}
                aria-hidden="true"
              >
                <div
                  className={`w-28 h-1 rounded-full ${
                    isDarkScreen ? 'bg-white/80' : 'bg-[#1D1D1F]/85'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
