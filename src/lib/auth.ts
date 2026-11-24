/**
 * Token storage for the APK.
 *
 * On Android the token lives in Capacitor Preferences, which writes to the app's
 * private storage - not accessible to other apps, and wiped when the app is
 * uninstalled. On the web it falls back to localStorage so `npm run dev` works.
 *
 * Deliberately NOT in a cookie: the APK has no cookie jar across restarts, and a
 * bearer header is simpler to reason about than a session.
 */

const KEY = 'cloidm.token.v1';
const EMAIL_KEY = 'cloidm.email.v1';

const isNative = (): boolean =>
  typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

async function prefs() {
  const { Preferences } = await import('@capacitor/preferences');
  return Preferences;
}

export async function setToken(token: string, email?: string): Promise<void> {
  if (isNative()) {
    const P = await prefs();
    await P.set({ key: KEY, value: token });
    if (email) await P.set({ key: EMAIL_KEY, value: email });
  } else {
    localStorage.setItem(KEY, token);
    if (email) localStorage.setItem(EMAIL_KEY, email);
  }
}

export async function getToken(): Promise<string | null> {
  if (isNative()) {
    const P = await prefs();
    const { value } = await P.get({ key: KEY });
    return value || null;
  }
  return localStorage.getItem(KEY);
}

export async function getEmail(): Promise<string | null> {
  if (isNative()) {
    const P = await prefs();
    const { value } = await P.get({ key: EMAIL_KEY });
    return value || null;
  }
  return localStorage.getItem(EMAIL_KEY);
}

export async function clearToken(): Promise<void> {
  if (isNative()) {
    const P = await prefs();
    await P.remove({ key: KEY });
    await P.remove({ key: EMAIL_KEY });
  } else {
    localStorage.removeItem(KEY);
    localStorage.removeItem(EMAIL_KEY);
  }
}

export async function isSignedIn(): Promise<boolean> {
  return !!(await getToken());
}
