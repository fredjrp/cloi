import type {
  AutomationRule,
  MetaAccountState,
  ReelPost,
  WeeklyTrendPoint,
} from '../types/automation';

export const INITIAL_META_ACCOUNT: MetaAccountState = {
  connected: true,
  igHandle: '@studio.kairo',
  accountName: 'Kairo Design Studio',
  avatarUrl: '/src/assets/images/avatar_creator_studio_1795503055902.jpg',
  followersCount: 48290,
  metaPageName: 'Kairo Creative Labs',
  hourlyDmUsed: 142,
  hourlyDmLimit: 200,
  webhookHealthy: true,
};

export const REEL_POSTS: ReelPost[] = [
  {
    id: 'any',
    title: 'Any Post or Reel (Account-Wide)',
    caption: 'Triggers across all active Reels, carousels, and posts.',
    publishedAt: 'Global Rule',
    thumbnailUrl: '/src/assets/images/reel_design_system_1795503055858.jpg',
    commentCount: 1840,
  },
  {
    id: 'reel-grid',
    title: 'Apple-Style Grid Systems in 60s',
    caption: 'Comment GRID and I will DM you the Figma + token file.',
    publishedAt: 'Nov 20, 2026',
    thumbnailUrl: '/src/assets/images/reel_design_system_1795503055858.jpg',
    commentCount: 742,
  },
  {
    id: 'reel-camera',
    title: 'Minimalist Rangefinder Desk Setup',
    caption: 'Drop KIT below for the exact lens + lighting links.',
    publishedAt: 'Nov 17, 2026',
    thumbnailUrl: '/src/assets/images/reel_camera_kit_1795503055688.jpg',
    commentCount: 518,
  },
  {
    id: 'reel-type',
    title: 'Editorial Typography Pairing Guide',
    caption: 'Comment TYPE to unlock the curated font specimen PDF.',
    publishedAt: 'Nov 12, 2026',
    thumbnailUrl: '/src/assets/images/reel_typography_book_1795503056215.jpg',
    commentCount: 389,
  },
];

export const INITIAL_RULES: AutomationRule[] = [
  {
    id: 'rule-grid-kit',
    name: 'Grid System Token Kit',
    postId: 'reel-grid',
    postTitle: 'Apple-Style Grid Systems in 60s',
    thumbnailUrl: '/src/assets/images/reel_design_system_1795503055858.jpg',
    keywords: 'GRID, SYSTEM, TOKENS',
    matchType: 'contains',
    publicReply: 'Just sent the Grid System link to your DMs!',
    followGateEnabled: true,
    followGatePrompt:
      'Quick step before I send the file — tap Follow on @studio.kairo and press the button below so I can unlock your link.',
    followGateButtonLabel: "I've Followed — Get the Link",
    emailCaptureMode: 'in_dm',
    emailPrompt:
      'Drop your best email if you want future UI token updates, and I will unlock the download immediately.',
    emailCollectionUrl: 'https://studiokairo.co/newsletter-optin',
    destinationButtonLabel: 'Get the Link',
    destinationUrl: 'https://studiokairo.co/resources/apple-grid-kit',
    status: 'active',
    updatedAt: '2h ago',
    metrics: {
      commentsTriggered: 742,
      dmsSent: 718,
      followersGained: 312,
      emailsCaptured: 219,
      linkClicks: 594,
    },
  },
  {
    id: 'rule-camera-kit',
    name: 'Desk & Camera Gear List',
    postId: 'reel-camera',
    postTitle: 'Minimalist Rangefinder Desk Setup',
    thumbnailUrl: '/src/assets/images/reel_camera_kit_1795503055688.jpg',
    keywords: 'KIT, GEAR, LENS',
    matchType: 'contains',
    publicReply: 'Check your message requests — gear links sent!',
    followGateEnabled: true,
    followGatePrompt:
      'Thanks for commenting! Follow @studio.kairo so Instagram lets me deliver the full gear breakdown.',
    followGateButtonLabel: "I've Followed — Unlock Gear List",
    emailCaptureMode: 'external_link',
    emailPrompt:
      'Want weekly studio hardware breakdowns? Save your email on our 1-tap opt-in card or continue straight to the kit.',
    emailCollectionUrl: 'https://studiokairo.co/email-collect/gear-digest',
    destinationButtonLabel: 'Get the Link',
    destinationUrl: 'https://studiokairo.co/gear/rangefinder-setup',
    status: 'active',
    updatedAt: '1d ago',
    metrics: {
      commentsTriggered: 518,
      dmsSent: 496,
      followersGained: 184,
      emailsCaptured: 108,
      linkClicks: 401,
    },
  },
  {
    id: 'rule-type-guide',
    name: 'Editorial Type Specimen PDF',
    postId: 'reel-type',
    postTitle: 'Editorial Typography Pairing Guide',
    thumbnailUrl: '/src/assets/images/reel_typography_book_1795503056215.jpg',
    keywords: 'TYPE, FONTS, GUIDE',
    matchType: 'contains',
    publicReply: 'Sent the font specimen straight to your inbox.',
    followGateEnabled: true,
    followGatePrompt:
      'Follow @studio.kairo and tap below to verify so I can send the specimen PDF.',
    followGateButtonLabel: "I've Followed — Get the Link",
    emailCaptureMode: 'none',
    emailPrompt: '',
    emailCollectionUrl: '',
    destinationButtonLabel: 'Get the Link',
    destinationUrl: 'https://studiokairo.co/type-specimen-2026',
    status: 'active',
    updatedAt: '3d ago',
    metrics: {
      commentsTriggered: 389,
      dmsSent: 372,
      followersGained: 141,
      emailsCaptured: 0,
      linkClicks: 308,
    },
  },
  {
    id: 'rule-vip-waitlist',
    name: 'Workshop VIP Waitlist',
    postId: 'any',
    postTitle: 'Any Post or Reel (Account-Wide)',
    thumbnailUrl: '/src/assets/images/reel_design_system_1795503055858.jpg',
    keywords: 'VIP, WORKSHOP',
    matchType: 'exact',
    publicReply: 'Waitlist invite is in your DMs.',
    followGateEnabled: false,
    followGatePrompt: '',
    followGateButtonLabel: "I've Followed — Get the Link",
    emailCaptureMode: 'external_link',
    emailPrompt: 'Reserve your seat by entering your email on the VIP link below.',
    emailCollectionUrl: 'https://studiokairo.co/workshop-email-gate',
    destinationButtonLabel: 'Get the Link',
    destinationUrl: 'https://studiokairo.co/workshop-seats',
    status: 'paused',
    updatedAt: '6d ago',
    metrics: {
      commentsTriggered: 191,
      dmsSent: 184,
      followersGained: 0,
      emailsCaptured: 112,
      linkClicks: 149,
    },
  },
];

export const WEEKLY_TRENDS: WeeklyTrendPoint[] = [
  { day: 'Mon', dmsSent: 198, followersGained: 74, emailsCaptured: 49 },
  { day: 'Tue', dmsSent: 242, followersGained: 91, emailsCaptured: 62 },
  { day: 'Wed', dmsSent: 215, followersGained: 79, emailsCaptured: 54 },
  { day: 'Thu', dmsSent: 289, followersGained: 112, emailsCaptured: 76 },
  { day: 'Fri', dmsSent: 318, followersGained: 124, emailsCaptured: 84 },
  { day: 'Sat', dmsSent: 264, followersGained: 96, emailsCaptured: 61 },
  { day: 'Sun', dmsSent: 244, followersGained: 61, emailsCaptured: 53 },
];

export interface ResearchSection {
  id: string;
  number: string;
  title: string;
  summary: string;
  principles: {
    heading: string;
    detail: string;
    metricImpact: string;
  }[];
}

export const APPLE_UX_RESEARCH_SECTIONS: ResearchSection[] = [
  {
    id: 'hig-translation',
    number: '01',
    title: 'Apple HIG Translation for .exe (Desktop) & .apk (Android)',
    summary:
      'Clients do not churn because automation lacks features; they churn when cross-platform clients feel fragmented or intimidating. Applying Apple Human Interface pillars—Clarity, Deference, and Depth—to both Windows (.exe) and Android (.apk) keeps the interface invisible so the creator’s Reel, keyword, and conversion funnel stay in focus.',
    principles: [
      {
        heading: 'Clarity via 8pt Spatial Grid & Tabular Numerals',
        detail:
          'Use neutral alabaster canvases (#F5F5F7) with crisp white surfaces (#FFFFFF) and 1px hairline dividers instead of nested cards or neon gradients. All DM counts, follower lifts, and CTRs use tabular-nums so figures align vertically across desktop tables and mobile cards.',
        metricImpact: 'Reduces visual scan time by ~38% during daily metric check-ins.',
      },
      {
        heading: 'Native Platform Ergonomics (.exe vs .apk)',
        detail:
          'On Windows (.exe), adopt a macOS-inspired 240px source-list sidebar + central workspace + right live-simulator inspector so clients edit rules and test DMs side-by-side without modal hopping. On Android (.apk), collapse into a 4-destination bottom tab bar (<15% viewport height), 48px touch hitboxes, and slide-up modal sheets for one-handed thumb edits.',
        metricImpact: 'Eliminates horizontal scrolling and accidental mis-taps on mobile.',
      },
      {
        heading: 'Single High-Intent Accent Budget',
        detail:
          'Reserve System Blue (#0071E3) exclusively for primary actions (Save Rule, Connect Meta, Get the Link) and active selections. Semantic green, amber, and crimson appear strictly with explicit text labels for rate-limit safety and rule state.',
        metricImpact: 'Creates unmistakable primary CTA hierarchy on every screen.',
      },
    ],
  },
  {
    id: 'onboarding-adoption',
    number: '02',
    title: '90-Second Onboarding & Meta Login Adoption Architecture',
    summary:
      'The highest drop-off point in Instagram automation apps occurs between Meta OAuth permission prompts and activating the first rule. Apple’s progressive disclosure model turns complex Graph API wiring into three calm, verifiable steps.',
    principles: [
      {
        heading: 'Step 1 — Plain-Language Meta Scope Transparency',
        detail:
          'Before triggering the Meta OAuth popup, display a single clean card explaining exactly why comment read/reply and DM messaging scopes are required, plus a clear reassurance that CloiDm Automation never posts without permission or violates Meta’s 200 DM/hr rate window.',
        metricImpact: 'Increases Meta OAuth completion compared to uncontextualized login walls.',
      },
      {
        heading: 'Step 2 — Pre-Filled First Reel + Keyword + Link',
        detail:
          'Never drop a new client into an empty dashboard. Auto-fetch their latest Reel and pre-populate a working starter rule (Keyword: GUIDE, Follow-Gate: Enabled, Button: Get the Link) they can customize in 15 seconds.',
        metricImpact: 'Drives Time-to-First-Rule under 90 seconds.',
      },
      {
        heading: 'Step 3 — Mandatory Live Simulator Ping ("Aha!" Moment)',
        detail:
          'Before completing onboarding, invite the client to send one simulated comment inside the app and watch the Follow-Gate, optional Email Capture, and "Get the Link" CTA fire in real time. Seeing the loop work builds immediate trust.',
        metricImpact: 'Converts hesitant sign-ups into active daily publishers.',
      },
    ],
  },
  {
    id: 'follow-gate-email',
    number: '03',
    title: 'Follow-Gate, "Get the Link" & Email Collection UX',
    summary:
      'A two-step Follow-Gate plus optional Email Collection can easily feel spammy if poorly worded. Apple-caliber microcopy frames the exchange as a helpful delivery step rather than a barrier.',
    principles: [
      {
        heading: 'Conversational Follow-Gate Framing',
        detail:
          'Instead of robotic commands ("MUST FOLLOW TO UNLOCK"), use warm creator voice ("Quick step — follow @handle and tap below so I can send your link"). Pair with a clear single-line button ("I\'ve Followed — Get the Link") that triggers instant backend follower verification.',
        metricImpact: 'Maximizes follow-through without triggering user resentment.',
      },
      {
        heading: 'Dual Email Capture Architecture (In-DM vs Collection Link)',
        detail:
          'Support both frictionless In-DM email reply parsing and a dedicated external Email Collection Link URL (hosted on the backend) before the final "Get the Link" button appears. Allow clients to toggle email collection per rule so high-intent lead magnets capture emails while casual gear links convert fast.',
        metricImpact: 'Balances lead-list growth with high link click-through.',
      },
      {
        heading: 'Meta Compliance & Rate-Limit Pacing Built Into UI',
        detail:
          'Include rotating public comment replies (to prevent spam flags) and surface a real-time hourly DM quota bar ("142 / 200 DM/hr · Nominal") right in the workspace so clients trust the app is protecting their IG account.',
        metricImpact: 'Prevents account throttling and builds enterprise-grade confidence.',
      },
    ],
  },
  {
    id: 'retention-metrics',
    number: '04',
    title: 'Retention Loops & Outcome-First Metrics Design',
    summary:
      'Clients stay subscribed to `.apk` and `.exe` automation tools when they can attribute real follower growth, captured emails, and link traffic back to specific Reels in under five seconds.',
    principles: [
      {
        heading: 'Outcome-First 4-KPI Strip',
        detail:
          'Lead the Overview screen with tangible business outcomes: Comments Triggered, DMs Delivered, New Followers Gained via Follow-Gate, and Emails & Link Clicks—never raw webhook logs.',
        metricImpact: 'Makes ROI immediately legible to non-technical creators.',
      },
      {
        heading: '5-Stage Conversion Funnel Visualization',
        detail:
          'Display exact drop-off percentages between Comment -> DM Sent -> Follow-Gate Cleared -> Email Captured -> Link Clicked. When a client sees 43.4% of DM recipients becoming new followers, pausing the subscription feels like turning off growth.',
        metricImpact: 'Directly anchors monthly retention to measurable follower lift.',
      },
      {
        heading: 'Mobile (.apk) Daily Pulse & One-Tap Pause',
        detail:
          'Creators check performance right after posting a Reel from their phone. The `.apk` mobile client surfaces a compact daily summary, push-ready milestone alerts, and instant one-tap rule switches in the natural thumb zone.',
        metricImpact: 'Builds a daily habit loop across desktop setup and mobile monitoring.',
      },
    ],
  },
];

export const PLATFORM_COMPARISON_MATRIX = [
  {
    dimension: 'Primary User Job',
    exeDesktop: 'Deep setup: writing copy, mapping URLs, analyzing multi-rule conversion funnels, exporting emails.',
    apkMobile: 'On-the-go monitoring after posting a Reel, quick keyword tweaks, instant pause/resume.',
  },
  {
    dimension: 'Navigation Shell',
    exeDesktop: 'Persistent 240px sidebar + 3-zone top bar + split editor/live DM simulator canvas.',
    apkMobile: 'Compact top header + fixed 4-tab bottom bar (<15% height) + slide-up modal sheets.',
  },
  {
    dimension: 'Touch & Pointer Sizing',
    exeDesktop: 'Compact 36px-40px rows, hover states, keyboard shortcuts (Cmd/Ctrl+S to save rule).',
    apkMobile: '44px-48px minimum touch targets, bottom-anchored primary CTAs in natural thumb zone.',
  },
  {
    dimension: 'Live DM Verification',
    exeDesktop: 'Always-visible right-hand Instagram DM simulator updating live on every keystroke.',
    apkMobile: 'Dedicated "Test DM" slide-up sheet triggered from a single thumb button.',
  },
  {
    dimension: 'Offline & Sync Resilience',
    exeDesktop: 'Local draft caching with optimistic toggle states and clear webhook sync timestamps.',
    apkMobile: 'Background push digest + offline-cached last 7 days of metrics and rule list.',
  },
];
