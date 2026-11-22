import { CONSENT_TEXT } from "@/lib/consent";
import { handleError, json, readJson } from "@/lib/http";
import { isComplete, sanitizeAnswers } from "@/lib/questions";
import { computeResults, RESULTS_VERSION } from "@/lib/scoring/results";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";
import { insertScreening } from "@/lib/screening-insert";
import { randomToken, sha256 } from "@/lib/tokens";
import { isActive, type PlanRow } from "@/lib/plan/server";

/** Logged-in people update answers → scores recalculated on the server → a new history entry. */
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.email) return json({ error: "Please log in again." }, 401);
    // Updating answers is part of an active plan. Otherwise it's a new check, which is paid for.
    const { data: plan } = await supabaseAdmin().from("plans").select("status, paid_until").eq("user_id", user.id).maybeSingle();
    if (!isActive(plan as PlanRow | null)) return json({ error: "Your plan has ended. Take a new check to update your results and renew your plan.", needsCheck: true }, 402);
    const answers = sanitizeAnswers((await readJson(req)).answers);
    if (!isComplete(answers)) return json({ error: "Please answer every question shown." }, 400);
    const results = computeResults(answers);
    const sb = supabaseAdmin();
    const { data, error } = await insertScreening(sb, {
      user_id: user.id, email: user.email.toLowerCase(), answers, results, results_version: RESULTS_VERSION,
      heart_age: results.heart?.heartAge.value ?? null, risk_percent: results.heart?.riskPercent ?? null, wellbeing_score: results.wellbeing?.score ?? null,
      consent_at: new Date().toISOString(), consent_text: `${CONSENT_TEXT} (updated from account)`,
      owner_token_hash: sha256(randomToken()),
    });
    if (error) throw error;
    await sb.from("profiles").update({ latest_answers: answers, updated_at: new Date().toISOString() }).eq("id", user.id);
    return json({ screeningId: data.id, selfHarmFlag: results.selfHarmFlag });
  } catch (e) {
    return handleError(e);
  }
}
