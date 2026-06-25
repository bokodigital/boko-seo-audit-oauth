import { NextResponse } from "next/server";
import { checkApp } from "@/lib/auth";
import { oauthConfigured, refreshAccessToken } from "@/lib/google";
import { getSession } from "@/lib/gsession";
import { listProperties } from "@/lib/ga";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request) {
  if (!checkApp(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = getSession(request);
  if (!s || !s.refresh_token) return NextResponse.json({ configured: oauthConfigured(), connected: false, properties: [] });
  try {
    const token = await refreshAccessToken(s.refresh_token);
    const properties = await listProperties(token);
    return NextResponse.json({ configured: true, connected: true, properties });
  } catch (e) {
    return NextResponse.json({ configured: true, connected: true, error: e.message || String(e) }, { status: 502 });
  }
}
