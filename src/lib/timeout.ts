/**
 * Time-bounded storage.
 *
 * A Capacitor plugin call goes out over the JS↔native bridge. If the native plugin
 * was not registered by `cap sync`, that promise does not reject - it simply never
 * settles. Awaiting it hangs the caller forever.
 *
 * That is exactly what left the APK on its boot spinner: the boot awaited a bridge
 * call that never came back, so `setPhase` was never reached and no error was ever
 * thrown. Every storage read is now raced against a deadline, and the deadline wins.
 */

export const STORAGE_TIMEOUT_MS = 1200;

export function withTimeout<T>(promise: Promise<T>, fallback: T, ms = STORAGE_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, ms);

    promise.then(
      (value) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(value);
        }
      },
      () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      },
    );
  });
}
