import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { adminEmails } from "@/config/site";

/**
 * Admin login with email + password.
 *  - ADMIN_EMAILS: who may log in (comma-separated), set in Vercel.
 *  - ADMIN_PASSWORD: the shared admin password, set in Vercel. Change it there at any time;
 *    changing it logs every admin out, because sessions are signed with it.
 * Sessions are a signed, http-only cookie that lasts 12 hours.
 */
export const ADMIN_COOKIE = "hc_admin";
const SESSION_HOURS = 12;
export const MIN_PASSWORD_LENGTH = 12;

const password = () => process.env.ADMIN_PASSWORD || "";
export const adminLoginConfigured = () => password().length >= MIN_PASSWORD_LENGTH && adminEmails().length > 0;

function signingKey() {
  // Derived from the password (so changing it ends all sessions) plus a server secret.
  const extra = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
  return createHash("sha256").update(`hc-admin-v1|${password()}|${extra}`).digest();
}
const sign = (payload: string) => createHmac("sha256", signingKey()).update(payload).digest("base64url");

const sameText = (a: string, b: string) => {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
};

/** Checks email + password. Constant-time comparison; never reveals which part was wrong. */
export function checkAdminCredentials(email: string, pass: string) {
  if (!adminLoginConfigured()) return false;
  const e = email.trim().toLowerCase();
  const emailOk = adminEmails().some((a) => sameText(a, e));
  const passOk = sameText(pass, password());
  return emailOk && passOk;
}

export function makeSessionValue(email: string) {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = Buffer.from(JSON.stringify({ e: email.trim().toLowerCase(), x: exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionValue(value: string | undefined): { email: string } | null {
  if (!value || !adminLoginConfigured()) return null;
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload);
  if (expected.length !== mac.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(mac))) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof e !== "string" || typeof x !== "number" || x < Date.now()) return null;
    if (!adminEmails().includes(e)) return null; // removed from ADMIN_EMAILS → logged out
    return { email: e };
  } catch {
    return null;
  }
}

export async function currentAdminSession() {
  const store = await cookies();
  return readSessionValue(store.get(ADMIN_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_HOURS * 3600,
};
