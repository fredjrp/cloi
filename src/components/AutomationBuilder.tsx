import { CheckCircle2, Film, Plus, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type {
  AutomationRule,
  EmailCaptureMode,
  MatchType,
  MetaAccountState,
  ReelPost,
  RuleDraft,
  SimulatorStage,
  ValidationErrors,
} from '../types/automation';
import {
  formatBytes,
  isValidEmail,
  matchKeyword,
  resolveNextDmStage,
  validateRuleDraft,
  validateVideoFile,
} from '../utils/automationLogic';
import { IPhoneIgMockup, type IPhoneScreenMode } from './IPhoneIgMockup';

interface AutomationBuilderProps {
  account: MetaAccountState;
  posts: ReelPost[];
  rules: AutomationRule[];
  selectedRuleId: string | null;
  onSelectRule: (ruleId: string | null) => void;
  onSaveRule: (draft: RuleDraft) => void;
}

function createEmptyDraft(posts: ReelPost[]): RuleDraft {
  const defaultPost = posts[1] ?? posts[0];
  return {
    name: '',
    postId: defaultPost.id,
    postTitle: defaultPost.title,
    thumbnailUrl: defaultPost.thumbnailUrl,
    videoUrl: undefined,
    videoName: undefined,
    videoSizeBytes: undefined,
    caption: '',
    keywords: '',
    matchType: 'contains',
    publicReply: 'Just sent the link to your messages!',
    followGateEnabled: true,
    followGatePrompt:
      'Quick step before I send it — follow @studio.kairo and tap below so I can unlock your link.',
    followGateButtonLabel: "I've Followed — Get the Link",
    emailCaptureMode: 'none',
    emailPrompt: 'Drop your best email below and I will send your link right away.',
    emailCollectionUrl: '',
    destinationButtonLabel: 'Get the Link',
    destinationUrl: '',
    status: 'active',
  };
}

function ruleToDraft(rule: AutomationRule): RuleDraft {
  return {
    id: rule.id,
    name: rule.name,
    postId: rule.postId,
    postTitle: rule.postTitle,
    thumbnailUrl: rule.thumbnailUrl,
    videoUrl: rule.videoUrl,
    videoName: rule.videoName,
    videoSizeBytes: rule.videoSizeBytes,
    caption: rule.caption ?? '',
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

export function AutomationBuilder({
  account,
  posts,
  rules,
  selectedRuleId,
  onSelectRule,
  onSaveRule,
}: AutomationBuilderProps) {
  const selectedRule = rules.find((r) => r.id === selectedRuleId) ?? null;

  const [draft, setDraft] = useState<RuleDraft>(() =>
    selectedRule ? ruleToDraft(selectedRule) : createEmptyDraft(posts)
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // iPhone IG Simulator state
  const [screenMode, setScreenMode] = useState<IPhoneScreenMode>('reel');
  const [simComment, setSimComment] = useState('Please send the GRID!');
  const [simViewerFollowing, setSimViewerFollowing] = useState(false);
  const [simStage, setSimStage] = useState<SimulatorStage>('idle');
  const [simEmailInput, setSimEmailInput] = useState('');
  const [simEmailError, setSimEmailError] = useState<string | null>(null);
  const [simMismatchNotice, setSimMismatchNotice] = useState<string | null>(null);
  const [simMatchedWord, setSimMatchedWord] = useState<string | null>(null);

  const prevSelectedRuleIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (prevSelectedRuleIdRef.current === selectedRuleId) {
      return;
    }
    prevSelectedRuleIdRef.current = selectedRuleId;

    const found = rules.find((r) => r.id === selectedRuleId) ?? null;
    if (found) {
      setDraft(ruleToDraft(found));
      const firstToken = found.keywords.split(',')[0]?.trim() || 'GUIDE';
      setSimComment(`Send me the ${firstToken} please!`);
    } else {
      setDraft(createEmptyDraft(posts));
      setSimComment('Send me the GUIDE!');
    }
    setErrors({});
    setSaveNotice(null);
    setSimStage('idle');
    setSimEmailInput('');
    setSimEmailError(null);
    setSimMismatchNotice(null);
  }, [selectedRuleId, rules, posts]);

  const handleVideoFileSelect = (file: File | null | undefined) => {
    if (!file) return;
    const check = validateVideoFile({
      type: file.type,
      size: file.size,
      name: file.name,
    });
    if (!check.valid) {
      setErrors((prev) => ({ ...prev, video: check.error }));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setErrors((prev) => ({ ...prev, video: undefined }));
    setDraft((prev) => ({
      ...prev,
      videoUrl: objectUrl,
      videoName: file.name,
      videoSizeBytes: file.size,
      name: prev.name.trim() ? prev.name : file.name.replace(/\.[^.]+$/, ''),
    }));
    setScreenMode('reel');
    setSaveNotice(null);
  };

  const handleRemoveVideo = () => {
    setDraft((prev) => ({
      ...prev,
      videoUrl: undefined,
      videoName: undefined,
      videoSizeBytes: undefined,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRuleDraft(draft);
    if (!validation.valid) {
      setErrors((prev) => ({ ...validation.errors, video: prev.video }));
      setSaveNotice(null);
      return;
    }
    setErrors({});
    onSaveRule(draft);
    setSaveNotice('Saved! Your video and reply flow are ready.');
  };

  const handleRunSimulation = () => {
    setSimMismatchNotice(null);
    setSimEmailError(null);
    const result = matchKeyword(simComment, {
      keywords: draft.keywords,
      matchType: draft.matchType,
      status: 'active',
    });

    if (!result.matched) {
      setSimStage('idle');
      setSimMatchedWord(null);
      setSimMismatchNotice(
        `Try commenting one of your magic words (${draft.keywords || 'none added yet'}).`
      );
      return;
    }

    setSimMatchedWord(result.matchedKeyword);
    const nextStage = resolveNextDmStage({
      rule: {
        followGateEnabled: draft.followGateEnabled,
        emailCaptureMode: draft.emailCaptureMode,
      },
      isFollowing: simViewerFollowing,
      emailCollected: false,
    });
    setSimStage(nextStage);
    setScreenMode('dm');
  };

  const handleSimFollowVerified = () => {
    setSimViewerFollowing(true);
    const nextStage = resolveNextDmStage({
      rule: {
        followGateEnabled: draft.followGateEnabled,
        emailCaptureMode: draft.emailCaptureMode,
      },
      isFollowing: true,
      emailCollected: false,
    });
    setSimStage(nextStage);
  };

  const handleSimEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.emailCaptureMode === 'in_dm' && !isValidEmail(simEmailInput)) {
      setSimEmailError('Please enter a valid email address.');
      return;
    }
    setSimEmailError(null);
    setSimStage('link_delivered');
  };

  const resetSimulator = () => {
    setSimStage('idle');
    setSimEmailInput('');
    setSimEmailError(null);
    setSimMismatchNotice(null);
    setSimMatchedWord(null);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Spacious Workspace (7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        {/* Compact Project Switcher Bar */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <label htmlFor="project-switcher" className="text-xs font-medium text-[#6E6E73] shrink-0">
              Current Post:
            </label>
            <select
              id="project-switcher"
              value={selectedRuleId ?? '__new__'}
              onChange={(e) => onSelectRule(e.target.value === '__new__' ? null : e.target.value)}
              className="min-w-0 flex-1 max-w-xs px-3 py-1.5 text-sm font-medium text-[#1D1D1F] bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg outline-none focus:border-[#0071E3]"
            >
              {rules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name} ({rule.keywords.split(',')[0]?.trim() || 'No word'})
                </option>
              ))}
              {selectedRuleId === null && <option value="__new__">New Post (Unsaved)</option>}
            </select>
          </div>

          <button
            type="button"
            onClick={() => onSelectRule(null)}
            className="px-3.5 py-2 text-xs font-medium text-[#0071E3] bg-[#0071E3]/10 hover:bg-[#0071E3]/15 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            New Post
          </button>
        </div>

        {/* Minimal 3-Step Form */}
        <form
          onSubmit={handleSaveSubmit}
          noValidate
          className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-7 space-y-7"
        >
          {/* Step 1: Your Video */}
          <section className="space-y-4">
            <div>
              <h1 className="text-base font-display font-semibold text-[#1D1D1F]">
                1. Your Video
              </h1>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Upload your video first so you can preview it inside the iPhone screen.
              </p>
            </div>

            <input
              ref={fileInputRef}
              id="builder-video-upload"
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/*"
              onChange={(e) => handleVideoFileSelect(e.target.files?.[0])}
              className="sr-only"
            />

            {!draft.videoUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingVideo(true);
                }}
                onDragLeave={() => setIsDraggingVideo(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingVideo(false);
                  handleVideoFileSelect(e.dataTransfer.files?.[0]);
                }}
                className={`border border-dashed rounded-xl p-6 text-center transition-colors ${
                  isDraggingVideo
                    ? 'border-[#0071E3] bg-[#0071E3]/6'
                    : 'border-[#D1D1D6] bg-[#F5F5F7]'
                }`}
              >
                <Upload className="w-5 h-5 text-[#0071E3] mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-medium text-[#1D1D1F]">
                  Drop your video here, or choose a file
                </p>
                <p className="text-xs text-[#6E6E73] mt-0.5">
                  MP4, MOV, or WebM · Shows live on your iPhone Instagram preview
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3.5 px-4 py-2 text-xs font-medium text-white bg-[#1D1D1F] hover:bg-[#3A3A3C] rounded-lg cursor-pointer"
                >
                  Upload Video
                </button>
              </div>
            ) : (
              <div
                data-testid="uploaded-video-card"
                className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl p-3.5 flex items-center gap-4"
              >
                <video
                  src={draft.videoUrl}
                  poster={draft.thumbnailUrl}
                  controls
                  muted
                  playsInline
                  className="w-20 h-28 rounded-lg object-cover bg-black border border-[#E5E5EA] shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1D1D1F]">
                    <Film className="w-4 h-4 text-[#0071E3] shrink-0" aria-hidden="true" />
                    <span className="truncate">{draft.videoName || 'Uploaded Video'}</span>
                  </div>
                  <p className="text-xs text-[#6E6E73] font-mono-tabular">
                    {formatBytes(draft.videoSizeBytes ?? 0)} · Showing on iPhone
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium text-[#1D1D1F] bg-white border border-[#E5E5EA] hover:bg-[#EFEFF4] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Change Video
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      aria-label="Remove uploaded video"
                      className="px-2.5 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
            {errors.video && <p className="text-xs text-[#DC2626]">{errors.video}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label htmlFor="builder-name" className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                  Post Title
                </label>
                <input
                  id="builder-name"
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Morning Desk Setup"
                  className="w-full px-3 py-2 text-sm bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#0071E3] focus:bg-white rounded-lg outline-none"
                />
                {errors.name && <p className="mt-1 text-xs text-[#DC2626]">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="builder-caption" className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                  Instagram Caption
                </label>
                <input
                  id="builder-caption"
                  type="text"
                  value={draft.caption ?? ''}
                  onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                  placeholder="Comment GUIDE and I'll send it!"
                  className="w-full px-3 py-2 text-sm bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#0071E3] focus:bg-white rounded-lg outline-none"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Magic Word & Your Link */}
          <section className="space-y-4 pt-6 border-t border-[#E5E5EA]">
            <div>
              <h2 className="text-base font-display font-semibold text-[#1D1D1F]">
                2. Magic Word & Your Link
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Choose the word people comment to receive your link.
              </p>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label htmlFor="builder-keywords" className="text-xs font-medium text-[#1D1D1F]">
                  Comment Word
                </label>
                <div className="flex items-center gap-1 p-0.5 bg-[#F5F5F7] rounded-md" role="group" aria-label="Word match style">
                  {(
                    [
                      { id: 'contains', label: 'Anywhere in comment' },
                      { id: 'exact', label: 'Exact word' },
                    ] as { id: MatchType; label: string }[]
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, matchType: mode.id })}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
                        draft.matchType === mode.id
                          ? 'bg-white text-[#1D1D1F] shadow-xs'
                          : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="builder-keywords"
                type="text"
                value={draft.keywords}
                onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
                placeholder="GUIDE, LINK"
                className="w-full px-3 py-2 text-sm font-mono-tabular bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#0071E3] focus:bg-white rounded-lg outline-none"
              />
              {errors.keywords && <p className="mt-1 text-xs text-[#DC2626]">{errors.keywords}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="builder-dest-url" className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                  Your Link (where the button goes)
                </label>
                <input
                  id="builder-dest-url"
                  type="url"
                  value={draft.destinationUrl}
                  onChange={(e) => setDraft({ ...draft, destinationUrl: e.target.value })}
                  placeholder="https://yoursite.com/guide"
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#0071E3] focus:bg-white rounded-lg outline-none"
                />
                {errors.destinationUrl && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.destinationUrl}</p>
                )}
              </div>

              <div>
                <label htmlFor="builder-dest-label" className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                  Link Button Text
                </label>
                <input
                  id="builder-dest-label"
                  type="text"
                  value={draft.destinationButtonLabel}
                  onChange={(e) => setDraft({ ...draft, destinationButtonLabel: e.target.value })}
                  placeholder="Get the Link"
                  className="w-full px-3 py-2 text-sm bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#0071E3] focus:bg-white rounded-lg outline-none"
                />
                {errors.destinationButtonLabel && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.destinationButtonLabel}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="builder-public-reply" className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                Reply under their comment
              </label>
              <input
                id="builder-public-reply"
                type="text"
                value={draft.publicReply}
                onChange={(e) => setDraft({ ...draft, publicReply: e.target.value })}
                placeholder="Just sent the link to your messages!"
                className="w-full px-3 py-2 text-sm bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#0071E3] focus:bg-white rounded-lg outline-none"
              />
              {errors.publicReply && (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.publicReply}</p>
              )}
            </div>
          </section>

          {/* Step 3: Follow & Email Options */}
          <section className="space-y-4 pt-6 border-t border-[#E5E5EA]">
            <div>
              <h2 className="text-base font-display font-semibold text-[#1D1D1F]">
                3. Follow & Email Options
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Grow your followers and email list before giving them the link.
              </p>
            </div>

            {/* Follow Switch */}
            <div className="p-4 bg-[#F5F5F7] rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#1D1D1F]">
                    Ask them to follow you first
                  </p>
                  <p className="text-xs text-[#6E6E73]">
                    Only people following {account.igHandle} can unlock the link.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.followGateEnabled}
                  aria-label="Ask them to follow you first"
                  onClick={() => setDraft({ ...draft, followGateEnabled: !draft.followGateEnabled })}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                    draft.followGateEnabled ? 'bg-[#0071E3]' : 'bg-[#D1D1D6]'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      draft.followGateEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {draft.followGateEnabled && (
                <div className="pt-2 border-t border-[#E5E5EA]">
                  <label htmlFor="builder-follow-prompt" className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                    Message asking them to follow
                  </label>
                  <input
                    id="builder-follow-prompt"
                    type="text"
                    value={draft.followGatePrompt}
                    onChange={(e) => setDraft({ ...draft, followGatePrompt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5EA] focus:border-[#0071E3] rounded-lg outline-none"
                  />
                  {errors.followGatePrompt && (
                    <p className="mt-1 text-xs text-[#DC2626]">{errors.followGatePrompt}</p>
                  )}
                </div>
              )}
            </div>

            {/* Email Option */}
            <div className="p-4 bg-[#F5F5F7] rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[#1D1D1F]">Ask for their email</p>
                  <p className="text-xs text-[#6E6E73]">Optional step before unlocking your link.</p>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#E5E5EA]/70 rounded-lg shrink-0" role="group" aria-label="Email collection mode">
                  {(
                    [
                      { id: 'none', label: 'No' },
                      { id: 'in_dm', label: 'In chat' },
                      { id: 'external_link', label: 'Email link' },
                    ] as { id: EmailCaptureMode; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, emailCaptureMode: opt.id })}
                      className={`py-1 px-2.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                        draft.emailCaptureMode === opt.id
                          ? 'bg-white text-[#1D1D1F] shadow-xs'
                          : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {draft.emailCaptureMode !== 'none' && (
                <div className="pt-2 border-t border-[#E5E5EA] space-y-3">
                  <div>
                    <label htmlFor="builder-email-prompt" className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                      Email question message
                    </label>
                    <input
                      id="builder-email-prompt"
                      type="text"
                      value={draft.emailPrompt}
                      onChange={(e) => setDraft({ ...draft, emailPrompt: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5EA] focus:border-[#0071E3] rounded-lg outline-none"
                    />
                  </div>

                  {draft.emailCaptureMode === 'external_link' && (
                    <div>
                      <label htmlFor="builder-email-url" className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                        Your Email Sign-Up Link
                      </label>
                      <input
                        id="builder-email-url"
                        type="url"
                        value={draft.emailCollectionUrl}
                        onChange={(e) => setDraft({ ...draft, emailCollectionUrl: e.target.value })}
                        placeholder="https://yoursite.com/email-signup"
                        className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-[#E5E5EA] focus:border-[#0071E3] rounded-lg outline-none"
                      />
                      {errors.emailCollectionUrl && (
                        <p className="mt-1 text-xs text-[#DC2626]">{errors.emailCollectionUrl}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Save Bar */}
          <div className="pt-5 border-t border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label htmlFor="builder-status" className="sr-only">
                Post automation status
              </label>
              <select
                id="builder-status"
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as 'active' | 'paused' })}
                className="px-3 py-2 text-xs font-medium bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg outline-none"
              >
                <option value="active">Live on Instagram</option>
                <option value="paused">Paused</option>
              </select>

              {saveNotice && (
                <span className="text-xs font-medium text-[#16A34A] inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {saveNotice}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#0071E3] hover:bg-[#0062C4] rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              Save & Turn On
            </button>
          </div>
        </form>
      </div>

      {/* Right Sticky iPhone Preview (5 cols) */}
      <aside className="lg:col-span-5 lg:sticky lg:top-20">
        <IPhoneIgMockup
          account={account}
          draft={draft}
          posts={posts}
          screenMode={screenMode}
          onChangeScreenMode={setScreenMode}
          viewerFollowing={simViewerFollowing}
          onToggleViewerFollowing={(following) => {
            setSimViewerFollowing(following);
            resetSimulator();
          }}
          simComment={simComment}
          onChangeSimComment={setSimComment}
          onSubmitComment={handleRunSimulation}
          simStage={simStage}
          simMatchedWord={simMatchedWord}
          simMismatchNotice={simMismatchNotice}
          onVerifyFollow={handleSimFollowVerified}
          simEmailInput={simEmailInput}
          onChangeSimEmailInput={setSimEmailInput}
          simEmailError={simEmailError}
          onSubmitEmail={handleSimEmailSubmit}
          onCompleteExternalEmail={() => setSimStage('link_delivered')}
          onReset={resetSimulator}
          onTriggerUpload={() => fileInputRef.current?.click()}
        />
      </aside>
    </div>
  );
}
