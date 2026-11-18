import { afterLogin, clientIp, MIN_USER_PASSWORD, tooMany } from "@/lib/auth-flow";
import { handleError, isEmail, json, readJson } from "@/lib/http";
import { supabaseConfigured, supabaseUser } from "@/lib/supabase/server";

/** Step 2 for new people (or a forgotten password): check the emailed code, then save the chosen password. */
export async function POST(req: Request) {
  try {
    if (!supabaseConfigured()) return json({ error: "Accounts aren't switched on yet." }, 503);
    const b = await readJson(req, 1000);
    if (!isEmail(b.email)) return json({ error: "Please enter a valid email address." }, 400);
    const email = (b.email as string).trim().toLowerCase();
    const code = String(b.code ?? "").replace(/\s/g, "");
    const password = String(b.password ?? "");
    if (!/^\d{6,10}$/.test(code)) return json({ error: "Please enter the code from your email." }, 400);
    if (password.length < MIN_USER_PASSWORD || password.length > 128) return json({ error: `Please choose a password of at least ${MIN_USER_PASSWORD} characters.` }, 400);
    if (tooMany(`verify:${email}`, 6, 15 * 60 * 1000) || tooMany(`verify-ip:${clientIp(req)}`, 30, 15 * 60 * 1000)) {
      return json({ error: "Too many tries. Please ask for a new code in 15 minutes." }, 429);
    }

    const sb = await supabaseUser();
    const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
    if (error || !data.user) return json({ error: "That code is wrong or has expired. Check the email or ask for a new code." }, 400);
    const { error: pwError } = await sb.auth.updateUser({ password });
    if (pwError) {
      console.error("[auth/verify] password", pwError.message);
      return json({ error: "Your email is confirmed, but we couldn't save that password. Please try a different one." }, 400);
    }
    await afterLogin(data.user, { passwordSet: true });
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
