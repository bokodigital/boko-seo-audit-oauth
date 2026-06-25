# Boko SEO Audit — Connect with Google (OAuth)

Same technical SEO audit, analytics, monthly report and roadmap as `boko-seo-audit`, but
clients connect their **own** Google Analytics 4 and Search Console with a single
**“Connect Google”** button — no service-account JSON keys, and no manually adding a
service-account email as a user. This is the non-technical onboarding path.

## How it works

1. User clicks **Connect Google** in the app.
2. Google’s normal sign-in + consent screen asks them to allow read-only access to
   Analytics and Search Console.
3. The app stores an encrypted **refresh token** in an http-only cookie and uses it to
   list their GA4 properties and Search Console sites automatically.

Scopes requested (read-only): `analytics.readonly`, `webmasters.readonly`, plus `openid email`.

## One-time setup (you, the agency — not the client)

You create a single OAuth client in Google Cloud. Every client then connects by signing in.

1. **Google Cloud Console → APIs & Services → Enabled APIs** — enable the
   *Google Analytics Data API*, *Google Analytics Admin API*, and *Search Console API*.
2. **OAuth consent screen** — choose **External**, add app name/support email, and add the
   two scopes above. While testing you can add up to ~100 **Test users** (their Google
   emails) without verification.
3. **Credentials → Create credentials → OAuth client ID → Web application.**
   - **Authorized redirect URI:** `https://YOUR-DOMAIN/api/auth/google/callback`
     (e.g. `https://boko-seo-audit-oauth.vercel.app/api/auth/google/callback`).
     Add `http://localhost:3000/api/auth/google/callback` too for local dev.
   - Copy the **Client ID** and **Client secret**.
4. **Vercel → Project → Settings → Environment Variables:**

   | Variable | Value |
   |---|---|
   | `GOOGLE_OAUTH_CLIENT_ID` | the client ID |
   | `GOOGLE_OAUTH_CLIENT_SECRET` | the client secret |
   | `SESSION_SECRET` | a long random string (`openssl rand -hex 32`) |
   | `OAUTH_REDIRECT_URI` | *(optional)* pin to your production callback URL |
   | `APP_PASSWORD` | *(optional)* gate the dashboard |
   | `AHREFS_API_KEY` | *(optional)* free Domain Rating badge |

5. Redeploy. Open the app → **Analytics & Search** → **Connect Google**.

### Going public (beyond test users)

Analytics and Search Console read access are **sensitive** scopes. Test mode (≤100 test
users) needs no review and is fine for your own managed clients. To remove the “unverified
app” screen and the user cap, submit the app for **Google verification** on the OAuth
consent screen. Requirements can change — confirm current steps in the Google Cloud console.

## Routes

- `GET /api/auth/google/start` → redirect to Google consent
- `GET /api/auth/google/callback` → exchange code, store encrypted refresh token, redirect home
- `GET /api/auth/google/logout` → clear the session
- `GET /api/google/status` → `{ configured, connected, email }`
- `GET /api/ga/properties`, `POST /api/ga/report` → GA4 (per-session token)
- `GET /api/gsc` (sites), `POST /api/gsc` (report) → Search Console (per-session token)

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in the OAuth client + SESSION_SECRET
npm run dev
```

## Difference vs `boko-seo-audit`

That app authenticates with a **service account** (one identity you add to each property —
technical, agency-managed). This app authenticates each user via **OAuth sign-in** — the
client-friendly path. Everything else (crawler, AI/LLM readiness, monthly report,
user-journey funnel, roadmap) is identical.
