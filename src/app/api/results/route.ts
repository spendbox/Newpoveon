import { CONSENT_TEXT } from "@/lib/consent";
import { emailConfigured, resultsEmail, sendEmail } from "@/lib/email";
import { cleanText, handleError, isEmail, isPhone, json, readJson } from "@/lib/http";
import { isComplete, sanitizeAnswers } from "@/lib/questions";
import { computeResults, RESULTS_VERSION } from "@/lib/scoring/results";
import { currentUser, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { randomToken, sha256 } from "@/lib/tokens";

/**
 * Save a finished screening against an email (no account needed) and email a copy.
 * The server recomputes every score from the answers; it never trusts scores sent by the browser.
 */
export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    if (!isEmail(body.email)) return json({ error: "Please enter a valid email address." }, 400);
    if (body.consent !== true) return json({ error: "Please tick the consent box." }, 400);
    const phone = body.phone ? cleanText(body.phone, 30) : null;
    if (phone && !isPhone(phone)) return json({ error: "That phone number doesn't look right." }, 400);
    const answers = sanitizeAnswers(body.answers);
    if (!isComplete(answers)) return json({ error: "Some answers are missing. Please go back and finish the check." }, 400);
    if (!supabaseConfigured()) return json({ error: "Saving isn't switched on yet." }, 503);

    const email = (body.email as string).trim().toLowerCase();
    const results = computeResults(answers);
    const user = await currentUser();
    const ownerToken = randomToken();
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("screenings")
      .insert({
        // Attach to the account only if the logged-in email matches.
        user_id: user && user.email?.toLowerCase() === email ? user.id : null,
        email,
        phone,
        answers,
        results,
        results_version: RESULTS_VERSION,
        heart_age: results.heart?.heartAge.value ?? null,
        risk_percent: results.heart?.riskPercent ?? null,
        wellbeing_score: results.wellbeing?.score ?? null,
        consent_at: new Date().toISOString(),
        consent_text: CONSENT_TEXT,
        owner_token_hash: sha256(ownerToken),
      })
      .select("id")
      .single();
    if (error) throw error;
    if (user && user.email?.toLowerCase() === email) {
      await sb.from("profiles").update({ latest_answers: answers, phone: phone ?? undefined, updated_at: new Date().toISOString() }).eq("id", user.id);
    }

    let emailed = false;
    if (emailConfigured()) {
      const m = resultsEmail(results);
      emailed = await sendEmail(email, m.subject, m.html, m.text);
    }
    return json({ screeningId: data.id, ownerToken, emailed });
  } catch (e) {
    return handleError(e);
  }
}
