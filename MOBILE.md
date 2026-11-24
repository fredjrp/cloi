# CloiDm â€” Android app

Wraps the React UI in a native Android shell (Capacitor), talks to the real backend,
and builds + signs on GitHub's runners so a slow local machine is never in the path.

---

## Status

| Piece | State |
|---|---|
| Value welcome | **done** — 3 slides for new devices, never repeats |
| Sign in / sign up | **done** — one screen, toggle between modes |
| Real data | **done** â€” `api.me()` / `api.metrics()` / `api.campaigns()` / `api.posts()` replace `seedData` |
| Instagram connect | **done** â€” opens Meta OAuth in the system browser, re-checks `/me` on return |
| Icons + splash | **done** â€” generated from `assets/`, all Android densities |
| GitHub Action | **done** â€” build â†’ sign â†’ `apksigner verify` â†’ artifact |
| Billing | not started |
| Play Store listing | not started |

---

## The two journeys

Value first for someone new, friction removed for someone returning.

```
            +-- device has a token --------------> api.me() --+-- connected --> App
  launch ---+                                                  +-- not -------> ConnectInstagram --> App
            |
            +-- no token --+-- never seen welcome --> WelcomeScreen --> Sign up --> Connect --> App
                           +-- seen it before ------> Sign in -------------------------> App
```

| Who | What they see | Why |
|---|---|---|
| **New user** | 3 value slides -> Create account -> Link Instagram | Must understand the product and what happens to their data *before* handing over a password |
| **Returning user** | Sign in -> App | No pitch. They already bought in |
| **Signed out** | Sign in only | The welcome flag survives, so the pitch never repeats |

The third slide is the privacy commitment - *we never see your Instagram password* -
placed before the ask rather than buried in settings. Both forms live on one screen
with a toggle, so picking the wrong door costs one tap, not a restart.


## Architecture

```
App.tsx
 â”œâ”€ phase: checking | signed-out | connect | ready
 â”‚
 â”œâ”€ LoginScreen          â†’ api.login() â†’ setToken() â†’ reload
 â”œâ”€ ConnectInstagram     â†’ opens /social-accounts/connect/instagram_login/
 â”‚                         then polls api.me() until connected
 â””â”€ ready
     â””â”€ useAppData()      â†’ Promise.all([me, metrics, campaigns, posts])
         â””â”€ maps API shapes onto the existing UI types
             â””â”€ MetricsDashboard / AutomationBuilder / MobileApkPreview / OnboardingWizard
```

Every mutation (`toggle`, `save`, `delete`) calls the API and then refreshes. There is
no optimistic local state that can drift from the server.

## Backend it talks to

`https://app.cloidm.online/api/mobile/` â€” verified with live data:

| Endpoint | Method | Returns |
|---|---|---|
| `/auth/login` | POST | `{token, expires_in, email, workspace_id}` |`n| `/auth/signup` | POST | creates account + workspace, returns the same shape |
| `/me` | GET | connected IG account (handle, name, avatar) |
| `/metrics` | GET | funnel: leads 12, clicked 4, emails 1 |
| `/campaigns` | GET/POST | list / create |
| `/campaigns/{id}` | PATCH/DELETE | update / remove |
| `/campaigns/{id}/toggle` | POST | pause / resume |
| `/posts` | GET | recent reels |

**Auth:** email + password â†’ signed 30-day token (Django `signing`, `SECRET_KEY`).
Unforgeable, self-expiring. Every query is scoped to the workspace inside the token.

## Design language

Matches the existing app theme â€” not a new one:

```
ink        #1D1D1F      canvas     #F5F5F7      accent    #0071E3
border     #E5E5EA      muted      #6E6E73
display    Plus Jakarta Sans        body      DM Sans
```

Touch targets are â‰¥44px, focus rings are visible, and the login screen distinguishes
"wrong password" from "no connection" so a user on a weak signal is not told their
credentials are wrong.

---

## One-time setup

### 1. Signing keystore

Run once. **Keep it forever** â€” Android refuses updates signed with a different key.

```bash
keytool -genkeypair -v -keystore cloidm-release.keystore \
  -alias cloidm -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Four GitHub secrets

Settings â†’ Secrets and variables â†’ Actions:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 cloidm-release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | store password |
| `ANDROID_KEY_ALIAS` | `cloidm` |
| `ANDROID_KEY_PASSWORD` | key password |

The workflow **fails loudly** if the keystore is missing rather than shipping an
unsigned APK Android would refuse to install.

### 3. Build

Actions â†’ **Build Android APK** â†’ Run workflow (~10 min). Download from artifacts.

---

## Local development

```bash
npm install
npm run dev              # browser at :3000, uses localStorage for the token
npm run android:add      # once, creates android/
npm run android:debug    # debug APK
npm run android:open     # Android Studio
```

API base is baked in at build time:

```bash
VITE_API_BASE=https://app.cloidm.online npm run build
```

## Install on a phone

1. Download the APK artifact
2. Copy to the phone, tap it, allow "unknown source"
3. Sign in with your CloiDm email and password
4. Tap **Open Instagram** to link the account, then **I have connected it**

---

## Known gaps

1. **`/posts` returns `[]`** â€” no media has been synced into the `Post` model yet. The
   post picker therefore shows an empty list until Instagram media sync runs.
2. **`window.open(url, '_system')`** needs `@capacitor/browser` for a guaranteed
   external launch on some Android WebView builds. Current code works on stock Chrome
   WebView; add the plugin if the browser does not open on a specific handset.
3. **No Play Store assets** â€” screenshots, feature graphic, privacy policy URL and the
   Data Safety form are all still to do.
4. **Renaming `@capacitor/preferences` storage** would sign every existing user out.
   If you change the key in `src/lib/auth.ts`, expect that.
