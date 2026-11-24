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
  const { Preferences } = await import('@capacitor/preferences');
  return Preferences;
}

export async function hasSeenWelcome(): Promise<boolean> {
  if (isNative()) {
    const P = await prefs();
    const { value } = await P.get({ key: SEEN_WELCOME });
    return value === '1';
  }
  return localStorage.getItem(SEEN_WELCOME) === '1';
}

export async function markWelcomeSeen(): Promise<void> {
  if (isNative()) {
    const P = await prefs();
    await P.set({ key: SEEN_WELCOME, value: '1' });
    return;
  }
  localStorage.setItem(SEEN_WELCOME, '1');
}
