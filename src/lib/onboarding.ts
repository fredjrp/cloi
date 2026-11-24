/**
 * Whether this device has already seen the value introduction.
 *
 * The welcome slides should run exactly once per device. A returning user who
 * signs out must NOT be walked through the pitch again - that is friction with no
 * benefit. The flag lives beside the token so both clear together on uninstall.
 */
const SEEN_WELCOME = 'cloidm.welcome.v1';

const isNative = (): boolean =>
  typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

async function prefs() {
  try {
    const { Preferences } = await import('@capacitor/preferences');
    return Preferences;
  } catch {
    // The native plugin can be absent if `cap sync` did not register it. Returning
    // null makes every caller fall back to localStorage instead of rejecting -
    // a rejected dynamic import here was leaving the app on its boot spinner
    // forever with no error on screen.
    return null;
  }
}

export async function hasSeenWelcome(): Promise<boolean> {
  const P = isNative() ? await prefs() : null;
  if (P) {
    try {
      const { value } = await P.get({ key: SEEN_WELCOME });
      return value === '1';
    } catch { /* fall through */ }
  }
  try { return localStorage.getItem(SEEN_WELCOME) === '1'; } catch { return false; }
}

export async function markWelcomeSeen(): Promise<void> {
  const P = isNative() ? await prefs() : null;
  if (P) {
    try { await P.set({ key: SEEN_WELCOME, value: '1' }); return; } catch { /* fall through */ }
  }
  try { localStorage.setItem(SEEN_WELCOME, '1'); } catch { /* ignore */ }
}
