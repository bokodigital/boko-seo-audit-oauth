import { NextResponse } from "next/server";
import { redirectUri, exchangeCode, emailFromIdToken } from "@/lib/google";
import { sessionCookie } from "@/lib/gsession";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const u = new URL(request.url);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state");
  const cookie = request.headers.get("cookie") || "";
  const sm = cookie.match(/boko_g_state=([^;]+)/);
  if (!code || !state || !sm || sm[1] !== state) {
    return NextResponse.redirect(u.origin + "/?gerror=auth");
  }
  try {
    const tok = await exchangeCode(code, redirectUri(request));
    if (!tok.refresh_token) return NextResponse.redirect(u.origin + "/?gerror=norefresh");
    const session = { refresh_token: tok.refresh_token, email: emailFromIdToken(tok.id_token) };
    const res = NextResponse.redirect(u.origin + "/?gconnected=1");
    res.headers.append("Set-Cookie", sessionCookie(session));
    res.headers.append("Set-Cookie", "boko_g_state=; Path=/; Max-Age=0");
    return res;
  } catch (e) {
    return NextResponse.redirect(u.origin + "/?gerror=" + encodeURIComponent(e.message || "auth"));
  }
}
