export type NavView = 'overview' | 'builder' | 'mobile' | 'research' | 'onboarding' | 'feedback' | 'churn';

export type MatchType = 'contains' | 'exact';

export type RuleStatus = 'active' | 'paused';

export type EmailCaptureMode = 'none' | 'in_dm' | 'external_link';

export interface ReelPost {
  id: string;
  title: string;
  caption: string;
  publishedAt: string;
  thumbnailUrl: string;
  commentCount: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  postId: string; // 'any' or specific ReelPost id
  postTitle: string;
  thumbnailUrl: string;
  videoUrl?: string;
  videoName?: string;
  videoSizeBytes?: number;
  caption?: string;
  keywords: string; // comma-separated trigger words
  matchType: MatchType;
  publicReply: string;
  followGateEnabled: boolean;
  followGatePrompt: string;
  followGateButtonLabel: string;
  emailCaptureMode: EmailCaptureMode;
  emailPrompt: string;
  emailCollectionUrl: string;
  destinationButtonLabel: string;
  destinationUrl: string;
  status: RuleStatus;
  updatedAt: string;
  metrics: {
    commentsTriggered: number;
    dmsSent: number;
    followersGained: number;
    emailsCaptured: number;
    linkClicks: number;
  };
}

export interface RuleDraft {
  id?: string;
  name: string;
  postId: string;
  postTitle: string;
  thumbnailUrl: string;
  videoUrl?: string;
  videoName?: string;
  videoSizeBytes?: number;
  caption?: string;
  keywords: string;
  matchType: MatchType;
  publicReply: string;
  followGateEnabled: boolean;
  followGatePrompt: string;
  followGateButtonLabel: string;
  emailCaptureMode: EmailCaptureMode;
  emailPrompt: string;
  emailCollectionUrl: string;
  destinationButtonLabel: string;
  destinationUrl: string;
  status: RuleStatus;
}

export interface ValidationErrors {
  name?: string;
  video?: string;
  keywords?: string;
  publicReply?: string;
  followGatePrompt?: string;
  emailCollectionUrl?: string;
  destinationUrl?: string;
  destinationButtonLabel?: string;
}

export interface FunnelMetrics {
  commentsTriggered: number;
  dmsSent: number;
  followersGained: number;
  emailsCaptured: number;
  linkClicks: number;
  followConversionRate: number; // percentage 0..100
  emailCaptureRate: number;     // percentage 0..100
  linkCtr: number;              // percentage 0..100
  activeRulesCount: number;
  totalRulesCount: number;
}

export type SimulatorStage =
  | 'idle'
  | 'follow_gate_wait'
  | 'email_gate_wait'
  | 'link_delivered';

export interface DmThreadMessage {
  id: string;
  sender: 'creator' | 'viewer' | 'system';
  text: string;
  buttonLabel?: string;
  buttonHref?: string;
  timestamp: string;
}

export interface WeeklyTrendPoint {
  day: string;
  dmsSent: number;
  followersGained: number;
  emailsCaptured: number;
}

export interface MetaAccountState {
  connected: boolean;
  igHandle: string;
  accountName: string;
  avatarUrl: string;
  followersCount: number;
  metaPageName: string;
  hourlyDmUsed: number;
  hourlyDmLimit: number;
  webhookHealthy: boolean;
}
