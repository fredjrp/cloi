import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOnboardingProgress,
  computeFunnelMetrics,
  filterRules,
  formatBytes,
  getTrendingRule,
  isValidEmail,
  isValidHttpUrl,
  matchKeyword,
  orderFeedReels,
  parseKeywords,
  resolveNextDmStage,
  resolveWalkthroughStageMeta,
  validateRuleDraft,
  validateVideoFile,
} from './automationLogic';
import type { AutomationRule, RuleDraft } from '../types/automation';

const sampleDraft: RuleDraft = {
  name: 'Design System PDF',
  postId: 'reel-1',
  postTitle: 'Apple-Style Grid Systems in 60s',
  thumbnailUrl: '/src/assets/images/reel_design_system_1795503055858.jpg',
  keywords: 'GRID, SYSTEM, PDF',
  matchType: 'contains',
  publicReply: 'Sent the guide to your DMs!',
  followGateEnabled: true,
  followGatePrompt: 'Hey! Follow @studio.kairo first and tap below to unlock your link.',
  followGateButtonLabel: "I've Followed — Unlock Link",
  emailCaptureMode: 'in_dm',
  emailPrompt: 'Where should I send future updates? Enter your email below.',
  emailCollectionUrl: '',
  destinationButtonLabel: 'Get the Link',
  destinationUrl: 'https://studiokairo.co/grid-kit',
  status: 'active',
};

const sampleRules: AutomationRule[] = [
  {
    ...sampleDraft,
    id: 'rule-1',
    updatedAt: '2026-11-23',
    metrics: {
      commentsTriggered: 400,
      dmsSent: 380,
      followersGained: 190,
      emailsCaptured: 95,
      linkClicks: 304,
    },
  },
  {
    ...sampleDraft,
    id: 'rule-2',
    name: 'Camera LUT Pack',
    keywords: 'LUT',
    status: 'paused',
    updatedAt: '2026-11-20',
    metrics: {
      commentsTriggered: 100,
      dmsSent: 100,
      followersGained: 20,
      emailsCaptured: 10,
      linkClicks: 60,
    },
  },
];

test('parseKeywords splits, trims, and lowercases comma-separated triggers', () => {
  assert.deepEqual(parseKeywords(' GUIDE , pdf, , Link '), ['guide', 'pdf', 'link']);
});

test('matchKeyword respects active status and exact vs contains matching', () => {
  const containsRule = { keywords: 'GUIDE, PDF', matchType: 'contains' as const, status: 'active' as const };
  assert.deepEqual(matchKeyword('Please send the GUIDE!', containsRule), {
    matched: true,
    matchedKeyword: 'guide',
  });
  assert.equal(matchKeyword('guiding light', containsRule).matched, false);

  const exactRule = { keywords: 'GUIDE', matchType: 'exact' as const, status: 'active' as const };
  assert.equal(matchKeyword('guide', exactRule).matched, true);
  assert.equal(matchKeyword('send guide', exactRule).matched, false);

  const pausedRule = { ...containsRule, status: 'paused' as const };
  assert.equal(matchKeyword('GUIDE', pausedRule).matched, false);
});

test('validateRuleDraft rejects empty keywords, invalid URLs, and missing external email link', () => {
  const validResult = validateRuleDraft(sampleDraft);
  assert.equal(validResult.valid, true);

  const badResult = validateRuleDraft({
    ...sampleDraft,
    name: '   ',
    keywords: ' , ',
    destinationUrl: 'not-a-url',
    emailCaptureMode: 'external_link',
    emailCollectionUrl: 'ftp://bad.link',
  });
  assert.equal(badResult.valid, false);
  assert.ok(badResult.errors.name);
  assert.ok(badResult.errors.keywords);
  assert.ok(badResult.errors.destinationUrl);
  assert.ok(badResult.errors.emailCollectionUrl);
});

test('isValidEmail and isValidHttpUrl validate inputs strictly', () => {
  assert.equal(isValidEmail('founder@studio.io'), true);
  assert.equal(isValidEmail('bad-email@'), false);
  assert.equal(isValidHttpUrl('https://studiokairo.co/kit'), true);
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false);
});

test('computeFunnelMetrics aggregates counts and calculates conversion percentages', () => {
  const summary = computeFunnelMetrics(sampleRules);
  assert.equal(summary.commentsTriggered, 500);
  assert.equal(summary.dmsSent, 480);
  assert.equal(summary.followersGained, 210);
  assert.equal(summary.emailsCaptured, 105);
  assert.equal(summary.linkClicks, 364);
  assert.equal(summary.activeRulesCount, 1);
  assert.equal(summary.totalRulesCount, 2);
  assert.equal(summary.followConversionRate, 43.8);
  assert.equal(summary.emailCaptureRate, 21.9);
  assert.equal(summary.linkCtr, 75.8);
});

test('filterRules filters by status and search term', () => {
  assert.equal(filterRules(sampleRules, '', 'all').length, 2);
  assert.equal(filterRules(sampleRules, '', 'active').length, 1);
  assert.equal(filterRules(sampleRules, 'lut', 'all').length, 1);
  assert.equal(filterRules(sampleRules, 'nonexistent', 'all').length, 0);
});

test('resolveNextDmStage routes through follow-gate, email-gate, and final link delivery', () => {
  assert.equal(
    resolveNextDmStage({
      rule: { followGateEnabled: true, emailCaptureMode: 'in_dm' },
      isFollowing: false,
      emailCollected: false,
    }),
    'follow_gate_wait'
  );
  assert.equal(
    resolveNextDmStage({
      rule: { followGateEnabled: true, emailCaptureMode: 'in_dm' },
      isFollowing: true,
      emailCollected: false,
    }),
    'email_gate_wait'
  );
  assert.equal(
    resolveNextDmStage({
      rule: { followGateEnabled: true, emailCaptureMode: 'in_dm' },
      isFollowing: true,
      emailCollected: true,
    }),
    'link_delivered'
  );
});

test('calculateOnboardingProgress computes completed count and percentage', () => {
  assert.deepEqual(
    calculateOnboardingProgress({
      metaConnected: true,
      firstRuleConfigured: true,
      liveTestPassed: false,
    }),
    { completedCount: 2, totalCount: 3, percent: 67 }
  );
});

test('validateVideoFile and formatBytes validate uploaded videos cleanly', () => {
  assert.equal(
    validateVideoFile({ type: 'video/mp4', size: 4_200_000, name: 'reel.mp4' }).valid,
    true
  );
  assert.equal(
    validateVideoFile({ type: '', size: 1_500_000, name: 'clip.mov' }).valid,
    true
  );
  assert.equal(
    validateVideoFile({ type: 'image/png', size: 120_000, name: 'poster.png' }).valid,
    false
  );
  assert.equal(
    validateVideoFile({ type: 'video/mp4', size: 0, name: 'empty.mp4' }).valid,
    false
  );
  assert.equal(
    validateVideoFile({ type: 'video/mp4', size: 200 * 1024 * 1024, name: 'huge.mp4' }).valid,
    false
  );
  assert.equal(formatBytes(512 * 1024), '512 KB');
  assert.equal(formatBytes(4.5 * 1024 * 1024), '4.5 MB');
});

test('getTrendingRule selects highest-engagement active post and handles empty list', () => {
  assert.equal(getTrendingRule([]), null);
  const top = getTrendingRule(sampleRules);
  assert.equal(top?.id, 'rule-1');

  const pausedOnly: AutomationRule[] = [{ ...sampleRules[1], id: 'paused-only' }];
  assert.equal(getTrendingRule(pausedOnly)?.id, 'paused-only');
});

test('orderFeedReels places trending rule first while preserving all posts', () => {
  const reversed = [sampleRules[1], sampleRules[0]];
  const ordered = orderFeedReels(reversed);
  assert.equal(ordered.length, 2);
  assert.equal(ordered[0].id, 'rule-1');
  assert.equal(ordered[1].id, 'rule-2');
});

test('resolveWalkthroughStageMeta tracks viewer-perspective onboarding progression', () => {
  assert.deepEqual(resolveWalkthroughStageMeta('reel_watch'), {
    stepNumber: 1,
    isDmOpen: false,
    isViewerFollowing: false,
    hasUnlockedFile: false,
    isFormOpen: false,
    isPdfOpened: false,
  });
  assert.deepEqual(resolveWalkthroughStageMeta('comment_replied'), {
    stepNumber: 2,
    isDmOpen: false,
    isViewerFollowing: false,
    hasUnlockedFile: false,
    isFormOpen: false,
    isPdfOpened: false,
  });
  assert.deepEqual(resolveWalkthroughStageMeta('dm_thread'), {
    stepNumber: 3,
    isDmOpen: true,
    isViewerFollowing: false,
    hasUnlockedFile: false,
    isFormOpen: false,
    isPdfOpened: false,
  });
  assert.deepEqual(resolveWalkthroughStageMeta('unlocked_outcome'), {
    stepNumber: 4,
    isDmOpen: true,
    isViewerFollowing: true,
    hasUnlockedFile: true,
    isFormOpen: false,
    isPdfOpened: false,
  });
  assert.deepEqual(resolveWalkthroughStageMeta('in_app_form'), {
    stepNumber: 5,
    isDmOpen: true,
    isViewerFollowing: true,
    hasUnlockedFile: true,
    isFormOpen: true,
    isPdfOpened: false,
  });
  assert.deepEqual(resolveWalkthroughStageMeta('browser_pdf'), {
    stepNumber: 6,
    isDmOpen: true,
    isViewerFollowing: true,
    hasUnlockedFile: true,
    isFormOpen: false,
    isPdfOpened: true,
  });
});



