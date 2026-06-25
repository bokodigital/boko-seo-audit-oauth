// Encrypted, http-only cookie that stores the user's Google refresh token.
import crypto from "crypto";

const NAME = "boko_g_session";
function key() {
  const s = process.env.SESSION_SECRET || "dev-secret-change-me";
  return crypto.createHash("sha256").update(s).digest();
}

export function encryptSession(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptSession(token) {
  try {
    const b = Buffer.from(token, "base64url");
    const iv = b.subarray(0, 12), tag = b.subarray(12, 28), enc = b.subarray(28);
    const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    d.setAuthTag(tag);
    return JSON.parse(Buffer.concat([d.update(enc), d.final()]).toString("utf8"));
  } catch (e) { return null; }
}

export function getSession(request) {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(NAME + "=([^;]+)"));
  if (!m) return null;
  return decryptSession(decodeURIComponent(m[1]));
}

export function sessionCookie(obj) {
  return `${NAME}=${encryptSession(obj)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearCookie() {
  return `${NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
