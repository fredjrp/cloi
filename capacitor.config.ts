import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor shell that turns the Vite build into an installable Android app.
 *
 * `webDir: 'dist'` matches Vite's output. The app loads from the bundled files
 * (not a remote URL) so it starts instantly and works on a slow connection; only
 * the API calls go over the network, to app.cloidm.online.
 *
 * server.androidScheme is https so the WebView is treated as a secure context -
 * without it, crypto.subtle and some storage APIs are unavailable.
 */
const config: CapacitorConfig = {
  appId: 'online.cloidm.app',
  appName: 'CloiDm',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: '#F5F5F7',
      showSpinner: false,
    },
  },
};

export default config;
