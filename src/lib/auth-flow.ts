import "server-only";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";

export const MIN_USER_PASSWORD = 10;

/** Does this email already have an account with a password? */
export async function hasPassword(email: string) {
  const { data } = await supabaseAdmin().from("profiles").select("has_password").eq("email", email).maybeSingle();
  return Boolean(data?.has_password);
}

/** After any successful login: make sure the profile exists and attach guest results saved with this email. */
export async function afterLogin(user: User, opts: { passwordSet?: boolean } = {}) {
  const email = user.email!.toLowerCase();
  const sb = supabaseAdmin();
  const { data: profile } = await sb.from("profiles").select("latest_answers").eq("id", user.id).maybeSingle();
  await sb.from("profiles").upsert(
    { id: user.id, email, updated_at: new Date().toISOString(), ...(opts.passwordSet ? { has_password: true } : {}) },
    { onConflict: "id" },
  );
  // The email is verified (by code or by password), so its guest results are theirs.
  await sb.from("screenings").update({ user_id: user.id }).eq("email", email).is("user_id", null);
  if (!profile?.latest_answers) {
    const { data: latest } = await sb.from("screenings").select("answers").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (latest) await sb.from("profiles").update({ latest_answers: latest.answers }).eq("id", user.id);
  }
}

/** Best-effort brake per server instance: max `limit` attempts per key per window. */
const hits = new Map<string, { n: number; until: number }>();
export function tooMany(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.until < now) {
    hits.set(key, { n: 1, until: now + windowMs });
    return false;
  }
  h.n += 1;
  return h.n > limit;
}
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
