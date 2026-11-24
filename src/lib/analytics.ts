/**
 * Journey tracking for the APK.
 *
 * Every step posts to our own backend, which stores it and forwards to whatever
 * pixel is configured (GA4 today, TikTok/Meta later). Calling gtag() from the app
 * would mean a new APK release for every pixel we add, and would blind us whenever
 * a client-side block strips the request - precisely at the step where users churn.
 *
 * On "cookies": a WebView wipes cookies on restart, so the stable identifier is a
 * random id in Preferences. Same job as a first-party cookie, no personal data.
 *
 * Fire-and-forget by design: a tracking failure must never interrupt a sign-up.
 */

import { API_BASE } from './api';

const DEVICE_KEY = 'cloidm.device.v1';
const QUEUE_KEY = 'cloidm.events.queue.v1';
const MAX_QUEUE = 40;

const isNative = (): boolean =>
  typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

async function read(key: string): Promise<string | null> {
  if (isNative()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key });
      return value ?? null;
    } catch {
      /* plugin missing - fall back below */
    }
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  if (isNative()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key, value });
      return;
    } catch {
      /* plugin missing - fall back below */
    }
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked - tracking is not worth throwing over */
  }
}

function randomId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 32);
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

let cachedDevice: string | null = null;

export async function deviceId(): Promise<string> {
  if (cachedDevice) return cachedDevice;
  let id = await read(DEVICE_KEY);
  if (!id) {
    id = randomId();
    await write(DEVICE_KEY, id);
  }
  cachedDevice = id;
  return id;
}

function appVersion(): string {
  return (import.meta.env.VITE_APP_VERSION as string | undefined) || '1.0.0';
}

function platform(): string {
  if (isNative()) return 'android';
  return 'web';
}

/** The steps, in order. Must stay in sync with the backend's `tracking.STEPS`. */
export type Step =
  | 'app.open'
  | 'welcome.view'
  | 'welcome.complete'
  | 'auth.start'
  | 'auth.success'
  | 'connect.start'
  | 'connect.success'
  | 'campaign.start'
  | 'campaign.saved'
  | 'feedback.open';

interface QueuedEvent {
  name: Step;
  screen: string;
  props: Record<string, unknown>;
  at: string;
}

/**
 * The backend takes ONE event per request, so a batch is sent sequentially. At the
 * volumes here (a handful of steps per user) that is cheaper than maintaining a
 * bulk endpoint, and it means a single failure loses one step rather than the batch.
 */
async function post(token: string | null, events: QueuedEvent[]): Promise<boolean> {
  const id = await deviceId();
  let allOk = true;

  for (const event of events) {
    try {
      const res = await fetch(`${API_BASE}/api/mobile/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        keepalive: true,
        body: JSON.stringify({
          device_id: id,
          name: event.name,
          screen: event.screen,
          props: event.props,
          platform: platform(),
          app_version: appVersion(),
        }),
      });
      if (!res.ok) allOk = false;
    } catch {
      allOk = false;
    }
  }
  return allOk;
}

/** Send one event. Never throws, never blocks the caller. */
export async function track(
  name: Step,
  screen = '',
  props: Record<string, unknown> = {},
): Promise<void> {
  const event: QueuedEvent = { name, screen, props, at: new Date().toISOString() };

  // The backend takes one event per call; keep the batch API here so switching to
  // a bulk endpoint later touches only `post`.
  const { getToken } = await import('./auth');
  const token = await getToken().catch(() => null);

  const ok = await post(token, [event]);
  if (ok) return;

  // Offline or the server is down: keep a small queue so the funnel does not lose
  // the exact step where someone gave up.
  try {
    const raw = (await read(QUEUE_KEY)) || '[]';
    const queue: QueuedEvent[] = JSON.parse(raw);
    queue.push(event);
    await write(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
  } catch {
    /* ignore */
  }
}

/** Try to deliver anything queued while offline. Call on app foreground. */
export async function flushQueue(): Promise<void> {
  try {
    const raw = (await read(QUEUE_KEY)) || '[]';
    const queue: QueuedEvent[] = JSON.parse(raw);
    if (!queue.length) return;
    const { getToken } = await import('./auth');
    const token = await getToken().catch(() => null);
    const ok = await post(token, queue);
    if (ok) await write(QUEUE_KEY, '[]');
  } catch {
    /* ignore */
  }
}
