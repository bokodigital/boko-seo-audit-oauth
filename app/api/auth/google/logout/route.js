import { NextResponse } from "next/server";
import { clearCookie } from "@/lib/gsession";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const res = NextResponse.redirect(new URL(request.url).origin + "/");
  res.headers.append("Set-Cookie", clearCookie());
  return res;
}
