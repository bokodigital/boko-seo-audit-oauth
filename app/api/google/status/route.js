import { NextResponse } from "next/server";
import { checkApp } from "@/lib/auth";
import { oauthConfigured } from "@/lib/google";
import { getSession } from "@/lib/gsession";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!checkApp(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = getSession(request);
  return NextResponse.json({
    configured: oauthConfigured(),
    connected: !!(s && s.refresh_token),
    email: (s && s.email) || "",
  });
}
