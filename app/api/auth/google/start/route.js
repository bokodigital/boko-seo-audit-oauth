import { NextResponse } from "next/server";
import crypto from "crypto";
import { oauthConfigured, redirectUri, buildAuthUrl } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!oauthConfigured()) {
    return NextResponse.json({ error: "Google OAuth is not configured (set GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET)." }, { status: 400 });
  }
  const state = crypto.randomBytes(16).toString("hex");
  const url = buildAuthUrl(redirectUri(request), state);
  const res = NextResponse.redirect(url);
  res.headers.append("Set-Cookie", `boko_g_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return res;
}
