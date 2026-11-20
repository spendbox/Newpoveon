import { afterLogin, clientIp, tooMany } from "@/lib/auth-flow";
import { handleError, isEmail, json, readJson } from "@/lib/http";
import { supabaseConfigured, supabaseUser } from "@/lib/supabase/server";

/** Returning people: email + password. */
export async function POST(req: Request) {
  try {
    if (!supabaseConfigured()) return json({ error: "Accounts aren't switched on yet." }, 503);
    const b = await readJson(req, 1000);
    if (!isEmail(b.email)) return json({ error: "Please enter a valid email address." }, 400);
    const email = (b.email as string).trim().toLowerCase();
    if (tooMany(`login:${email}`, 8, 15 * 60 * 1000) || tooMany(`login-ip:${clientIp(req)}`, 30, 15 * 60 * 1000)) {
      return json({ error: "Too many tries. Please wait 15 minutes, or reset your password." }, 429);
    }
    const sb = await supabaseUser();
    const { data, error } = await sb.auth.signInWithPassword({ email, password: String(b.password ?? "").slice(0, 200) });
    if (error || !data.user) return json({ error: "That email and password don't match." }, 400);
    await afterLogin(data.user);
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
