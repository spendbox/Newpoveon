import { clientIp, hasPassword, tooMany } from "@/lib/auth-flow";
import { handleError, isEmail, json, readJson } from "@/lib/http";
import { codeEmail, emailConfigured, sendEmail } from "@/lib/email";
import { supabaseAdmin, supabaseConfigured, supabaseUser } from "@/lib/supabase/server";

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
    if (emailConfigured()) {
      // Supabase makes the code (and the account, for new people) WITHOUT sending an email;
      // we send it ourselves through Resend, so Supabase's email limits don't apply.
      const { data, error } = await supabaseAdmin().auth.admin.generateLink({ type: "magiclink", email });
      const otp = data?.properties?.email_otp;
      if (error || !otp) {
        console.error("[auth/start] generateLink", error?.message);
        return json({ error: "We couldn't create a code just now. Please try again in a minute." }, 502);
      }
      const m = codeEmail(otp);
      if (!(await sendEmail(email, m.subject, m.html, m.text))) return json({ error: "We couldn't send the email just now. Please try again in a minute." }, 502);
      return json({ step: "code" });
    }
    // Fallback when Resend isn't connected: Supabase sends the code itself.
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
