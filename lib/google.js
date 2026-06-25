// Google OAuth 2.0 — "Sign in with Google" so non-technical users connect
// their own Analytics + Search Console with a click (no keys, no adding emails).
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "openid",
  "email",
].join(" ");

export function oauthConfigured() {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

// The redirect URI must exactly match one registered in the Google Cloud OAuth client.
export function redirectUri(request) {
  if (process.env.OAUTH_REDIRECT_URI) return process.env.OAUTH_REDIRECT_URI;
  return new URL(request.url).origin + "/api/auth/google/callback";
}

export function buildAuthUrl(redirect, state) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: redirect,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

export async function exchangeCode(code, redirect) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: redirect,
      grant_type: "authorization_code",
    }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.error || `Token exchange failed (${r.status})`);
  return d; // { access_token, refresh_token, expires_in, id_token }
}

export async function refreshAccessToken(refreshToken) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  const d = await r.json();
  if (!r.ok || !d.access_token) throw new Error(d.error_description || d.error || "Token refresh failed");
  return d.access_token;
}

export function emailFromIdToken(idToken) {
  try {
    const payload = (idToken || "").split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).email || "";
  } catch (e) { return ""; }
}
