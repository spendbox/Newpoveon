import { CONSENT_TEXT } from "@/lib/consent";
import { handleError, json, readJson } from "@/lib/http";
import { isComplete, sanitizeAnswers } from "@/lib/questions";
import { computeResults, RESULTS_VERSION } from "@/lib/scoring/results";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";
import { randomToken, sha256 } from "@/lib/tokens";

/** Logged-in people update answers → scores recalculated on the server → a new history entry. */
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.email) return json({ error: "Please log in again." }, 401);
    const answers = sanitizeAnswers((await readJson(req)).answers);
    if (!isComplete(answers)) return json({ error: "Please answer every question shown." }, 400);
    const results = computeResults(answers);
    const sb = supabaseAdmin();
    const { data, error } = await sb.from("screenings").insert({
      user_id: user.id, email: user.email.toLowerCase(), answers, results, results_version: RESULTS_VERSION,
      heart_age: results.heart?.heartAge.value ?? null, risk_percent: results.heart?.riskPercent ?? null, wellbeing_score: results.wellbeing?.score ?? null,
      consent_at: new Date().toISOString(), consent_text: `${CONSENT_TEXT} (updated from account)`,
      owner_token_hash: sha256(randomToken()),
    }).select("id").single();
    if (error) throw error;
    await sb.from("profiles").update({ latest_answers: answers, updated_at: new Date().toISOString() }).eq("id", user.id);
    return json({ screeningId: data.id, selfHarmFlag: results.selfHarmFlag });
  } catch (e) {
    return handleError(e);
  }
}
