import { clientIp, hasPassword, tooMany } from "@/lib/auth-flow";
import { handleError, isEmail, json, readJson } from "@/lib/http";
import { supabaseConfigured, supabaseUser } from "@/lib/supabase/server";

/**
 * Step 1 of logging in. Given an email:
 *  - it already has a password → ask for the password
 *  - otherwise (new, or "forgot password") → email a one-time code
 */
export async function POST(req: Request) {
  try {
    if (!supabaseConfigured()) return json({ error: "Accounts aren't switched on yet." }, 503);
    const b = await readJson(req, 500);
    if (!isEmail(b.email)) return json({ error: "Please enter a valid email address." }, 400);
    const email = (b.email as string).trim().toLowerCase();
    if (tooMany(`start:${clientIp(req)}`, 20, 15 * 60 * 1000)) return json({ error: "Too many tries. Please wait 15 minutes." }, 429);

    if (b.forgot !== true && (await hasPassword(email))) return json({ step: "password" });

    if (tooMany(`code:${email}`, 4, 15 * 60 * 1000)) return json({ error: "We've sent several codes already. Please check your inbox, or wait 15 minutes." }, 429);
    const sb = await supabaseUser();
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) {
      console.error("[auth/start]", error.message);
      return json({ error: "We couldn't send a code just now. Please try again in a minute." }, 502);
    }
    return json({ step: "code" });
  } catch (e) {
    return handleError(e);
  }
}
