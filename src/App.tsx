import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { AppleUxResearch } from './components/AppleUxResearch';
import { AutomationBuilder } from './components/AutomationBuilder';
import { ConnectInstagram } from './components/ConnectInstagram';
import { ChurnScreen } from './components/ChurnScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { LoginScreen } from './components/LoginScreen';
import { MetricsDashboard } from './components/MetricsDashboard';
import { MobileApkPreview } from './components/MobileApkPreview';
import { MobileOnboarding } from './components/MobileOnboarding';
import { OnboardingWizard } from './components/OnboardingWizard';
import { TopBar } from './components/TopBar';
import { api, ApiError } from './lib/api';
import { clearToken, getEmail, isSignedIn } from './lib/auth';
import { hasSeenWelcome, markWelcomeSeen } from './lib/onboarding';
import { flushQueue, track } from './lib/analytics';
import { MATCH_TO_API, useAppData } from './lib/useAppData';
import type { AutomationRule, NavView, RuleDraft } from './types/automation';

type Phase = 'checking' | 'welcome' | 'signin' | 'connect' | 'ready';

export default function App() {
  // Start on a real screen, never on a spinner. The boot redirects from here.
  const [phase, setPhase] = useState<Phase>('welcome');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showChurn, setShowChurn] = useState(false);
  const [bootError, setBootError] = useState('');

  const [activeView, setActiveView] = useState<NavView>('overview');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  const data = useAppData(phase === 'ready');
  const { account, rules, metrics, trends, posts } = data;

  // ---- boot: is there a usable token? -----------------------------------
  useEffect(() => {
    // The boot must ALWAYS end in a usable phase.
    //
    // The first APK shipped with a boot that could reject - a dynamic import of a
    // native plugin that was not registered - and because nothing caught it the app
    // sat on its spinner forever with a white screen and no error. A hang with no
    // message is the worst possible failure: the user cannot even tell you what
    // broke. This version always resolves, and surfaces the reason if it can.
    // HARD CEILING. Whatever happens below, the app must leave 'checking' within
    // 2.5s. A spinner that can run forever is a bug report with no information in
    // it - this guarantees the screen changes even if a native call never returns.
    const ceiling = window.setTimeout(() => {
      setBootError('startup timed out, continuing');
      setPhase((p) => (p === 'checking' ? 'welcome' : p));
    }, 2500);

    (async () => {
      try {
        if (await isSignedIn()) {
          setEmail((await getEmail()) ?? '');
          try {
            const me = await api.me();
            setPhase(me.connected ? 'ready' : 'connect');
            window.clearTimeout(ceiling);
          } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
              await clearToken();
              setPhase('signin');
            } else {
              // Server unreachable is not a reason to block the app.
              setPhase('connect');
            }
            window.clearTimeout(ceiling);
          }
          return;
        }
        setPhase((await hasSeenWelcome()) ? 'signin' : 'welcome');
        window.clearTimeout(ceiling);
      } catch (err) {
        // Storage or bootstrap failed. A first-time user still gets the walkthrough;
        // a returning one can still sign in. Never leave them on a spinner.
        setBootError(err instanceof Error ? err.message : String(err));
        window.clearTimeout(ceiling);
        setPhase('welcome');
      }
    })();
  }, []);

  useEffect(() => {
    document.body.dataset.view = activeView;
  }, [activeView]);

  // First paint: record the open, and try to deliver anything queued offline.
  useEffect(() => {
    track('app.open', 'boot');
    flushQueue();
  }, []);

  useEffect(() => {
    if (rules.length && !selectedRuleId) setSelectedRuleId(rules[0].id);
  }, [rules, selectedRuleId]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 3200);
  };

  // ---- mutations go to the API, then refresh ----------------------------
  const handleToggleRuleStatus = async (ruleId: string) => {
    const before = rules.find((r) => r.id === ruleId);
    try {
      await api.toggleCampaign(ruleId);
      await data.refresh();
      flash(`'${before?.name ?? 'Campaign'}' updated.`);
    } catch (err) {
      flash(err instanceof ApiError ? err.detail : 'Could not update the campaign.');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await api.deleteCampaign(ruleId);
      if (selectedRuleId === ruleId) setSelectedRuleId(null);
      await data.refresh();
      flash('Campaign deleted.');
    } catch (err) {
      flash(err instanceof ApiError ? err.detail : 'Could not delete the campaign.');
    }
  };

  const handleQuickUpdateRule = async (
    ruleId: string,
    updates: {
      keywords: string;
      destinationUrl: string;
      followGateEnabled: boolean;
      destinationButtonLabel?: string;
    },
  ) => {
    try {
      await api.updateCampaign(ruleId, {
        keywords: updates.keywords,
        destination_url: updates.destinationUrl,
        follow_gate_enabled: updates.followGateEnabled,
      });
      await data.refresh();
      flash('Saved.');
    } catch (err) {
      flash(err instanceof ApiError ? err.detail : 'Could not save changes.');
    }
  };

  const handleSaveRule = async (draft: RuleDraft) => {
    try {
      const body = {
        name: draft.name,
        keywords: draft.keywords,
        destination_url: draft.destinationUrl,
        match_type: MATCH_TO_API[draft.matchType] ?? 'whole',
        follow_gate_enabled: draft.followGateEnabled,
        follow_gate_prompt: draft.followGatePrompt,
        follow_gate_button_label: draft.followGateButtonLabel,
        public_reply: draft.publicReply,
        dm_text: '',
        email_capture_mode: draft.emailCaptureMode,
        email_collection_url: draft.emailCollectionUrl,
        email_prompt: draft.emailPrompt,
      };
      if (draft.id) {
        await api.updateCampaign(draft.id, body);
        setSelectedRuleId(draft.id);
      } else {
        const created = await api.createCampaign(body);
        setSelectedRuleId(created.id);
      }
      await data.refresh();
      track('campaign.saved', 'builder', { editing: !!draft.id });
      flash('Campaign saved.');
    } catch (err) {
      flash(err instanceof ApiError ? err.detail : 'Could not save the campaign.');
    }
  };

  const handleCompleteOnboarding = async (draft: RuleDraft, target: NavView = 'overview') => {
    await handleSaveRule(draft);
    setActiveView(target);
  };

  const handleCreateNew = () => {
    track('campaign.start', 'builder');
    setSelectedRuleId(null);
    setActiveView('builder');
  };

  const handleEditRule = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setActiveView('builder');
  };

  const handleSignOut = async () => {
    await clearToken();
    setPhase('signin');
    setActiveView('overview');
  };

  // Feedback is reachable from every phase, including before sign-in.
  if (showFeedback) {
    return <FeedbackScreen onClose={() => setShowFeedback(false)} defaultEmail={email} />;
  }

  if (showChurn) {
    return <ChurnScreen onClose={() => setShowChurn(false)} />;
  }

  // ---- gates ------------------------------------------------------------
  if (phase === 'checking') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5F5F7] px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5E5EA] border-t-[#0071E3]" />
        {bootError && (
          <p className="max-w-xs text-center text-xs text-[#6E6E73]">{bootError}</p>
        )}
      </div>
    );
  }

  // New user: the walkthrough that already exists - the simulated phone showing
  // comment -> DM -> follow gate -> form - runs BEFORE sign-up so the value lands
  // before anything is asked for.
  // The walkthrough with the video and the Instagram-look simulation is the
  // onboarding. It is full-bleed on a phone (the frame hides itself), so the user
  // is inside the experience rather than looking at a phone inside their phone.
  if (phase === 'welcome') {
    track('welcome.view', 'welcome');
    return (
      <div className="flex h-[100dvh] flex-col bg-[#F5F5F7]">
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <OnboardingWizard
            account={{ ...account, connected: false, igHandle: '' }}
            posts={[]}
            onToggleMetaConnection={() => {}}
            onCompleteOnboarding={() => {}}
            onCancelToOverview={() => {}}
            onRequestAuth={() => {
              // Never await storage before navigating: a plugin call that never
              // answers is exactly what made this button feel dead. Paint first,
              // persist in the background.
              void markWelcomeSeen();
              track('welcome.complete', 'welcome');
              setAuthMode('signup');
              setPhase('signin');
            }}
          />
        </div>
        <div
          className="shrink-0 border-t border-[#E5E5EA] bg-[#F5F5F7]/95 px-5 pt-3 backdrop-blur"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}
        >
          <button
            type="button"
            onClick={() => {
              void markWelcomeSeen();
              track('welcome.complete', 'welcome', { skipped: true });
              setAuthMode('signin');
              setPhase('signin');
            }}
            className="w-full min-h-[46px] rounded-xl text-[14px] font-medium text-[#1D1D1F] active:bg-[#E5E5EA]"
          >
            I already have an account
          </button>
        </div>
      </div>
    );
  }

    if (phase === 'signin') {
    return (
      <LoginScreen
        initialMode={authMode}
        onSignedIn={() => {
          // Re-read the server so the Instagram state is not assumed.
          window.location.reload();
        }}
      />
    );
  }

  if (phase === 'connect') {
    return (
      <ConnectInstagram
        onConnected={() => setPhase('ready')}
        onSkip={() => setPhase('ready')}
      />
    );
  }

  // ---- the app ----------------------------------------------------------
  return (
    <div className="flex h-[100dvh] flex-col bg-[#F5F5F7] text-[#1D1D1F]">
      <TopBar activeView={activeView} onSelectView={setActiveView} />

      {notice && (
        <div className="mx-auto mt-3 w-full max-w-[1360px] px-4 sm:px-6">
          <div className="rounded-xl border border-[#E5E5EA] bg-white px-3 py-2 text-xs text-[#1D1D1F] shadow-sm">
            {notice}
          </div>
        </div>
      )}

      {data.error && (
        <div className="mx-auto mt-3 w-full max-w-[1360px] px-4 sm:px-6">
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            {data.error}
          </div>
        </div>
      )}

      <main className="flex-1 w-full overflow-y-auto overscroll-contain px-4 pb-6">
        {data.loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5E5EA] border-t-[#0071E3]" />
          </div>
        ) : (
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeView === 'overview' && (
              <MetricsDashboard
                account={account}
                posts={posts}
                rules={rules}
                weeklyTrends={trends}
                onToggleRuleStatus={handleToggleRuleStatus}
                onQuickUpdateRule={handleQuickUpdateRule}
                onEditRule={handleEditRule}
                onCreateNewRule={handleCreateNew}
                onDeleteRule={handleDeleteRule}
                onOpenOnboarding={() => setActiveView('onboarding')}
              />
            )}

            {activeView === 'builder' && (
              <AutomationBuilder
                account={account}
                posts={posts}
                rules={rules}
                selectedRuleId={selectedRuleId}
                onSelectRule={setSelectedRuleId}
                onSaveRule={handleSaveRule}
              />
            )}

            {activeView === 'mobile' && (
              <MobileApkPreview
                account={account}
                rules={rules}
                onToggleRuleStatus={handleToggleRuleStatus}
                onQuickUpdateRule={handleQuickUpdateRule}
              />
            )}

            {activeView === 'research' && <AppleUxResearch />}

            {activeView === 'onboarding' && (
              <OnboardingWizard
                account={account}
                posts={posts}
                onToggleMetaConnection={() => {
                  setPhase('connect');
                }}
                onCompleteOnboarding={handleCompleteOnboarding}
                onCancelToOverview={() => setActiveView('overview')}
              />
            )}
          </motion.div>
        )}
      </main>

      <footer className="border-t border-[#E5E5EA] bg-white/70">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6E6E73]">
          <span>CloiDm Automation · Instagram Comment-to-DM &amp; Follow-Gate</span>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setActiveView('mobile')} className="hover:text-[#1D1D1F]">
              Android
            </button>
            <button type="button" onClick={() => setActiveView('onboarding')} className="hover:text-[#1D1D1F]">
              Onboarding
            </button>
            <button type="button" onClick={() => setShowChurn(true)} className="hover:text-[#1D1D1F]">
              Funnel
            </button>
            <button type="button" onClick={() => setShowFeedback(true)} className="hover:text-[#1D1D1F]">
              Feedback
            </button>
            <button type="button" onClick={handleSignOut} className="hover:text-[#1D1D1F]">
              Sign out{email ? ` (${email})` : ''}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
