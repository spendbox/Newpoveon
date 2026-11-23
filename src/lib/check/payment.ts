import "server-only";
import { site } from "@/config/site";
import { emailConfigured, resultsEmail, sendEmail } from "@/lib/email";
import { initializeTransaction, verifyTransaction } from "@/lib/paystack";
import { lagosDay, mondayOf, weightTarget, type Goal } from "@/lib/plan/engine";
import { loadPlan, planHints, welcomeEmail } from "@/lib/plan/server";
import { personalWhy } from "@/lib/plan/personal";
import { loadPlanSettings } from "@/lib/plan/settings";
import type { Answers } from "@/lib/questions";
import type { Results } from "@/lib/scoring/results";
import { supabaseAdmin } from "@/lib/supabase/server";
import { randomToken } from "@/lib/tokens";

/** Start paying for a saved check. The price comes from Admin → Consults and fees, never the browser. */
export async function startCheckCheckout(screening: { id: string; email: string; user_id: string | null }) {
  const sb = supabaseAdmin();
  const { price, months } = await loadPlanSettings();
  const reference = `CK-${randomToken(9)}`;
  const { error } = await sb.from("plan_purchases").insert({ kind: "check", screening_id: screening.id, email: screening.email, user_id: screening.user_id, reference, amount_kobo: price * 100 });
  if (error) throw error;
  const tx = await initializeTransaction({
    email: screening.email, amountKobo: price * 100, reference,
    callbackUrl: `${site.siteUrl}/results`,
    metadata: { purpose: "check", screening_id: screening.id, custom_fields: [{ display_name: "Product", variable_name: "product", value: `Health check + ${months}-month plan` }] },
  });
  return { authorizationUrl: tx.authorization_url, reference };
}

/** Find the account for an email, or create one (they set a password later with an emailed code). */
async function accountFor(email: string): Promise<{ id: string; created: boolean }> {
  const sb = supabaseAdmin();
  const { data: p } = await sb.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (p) return { id: p.id, created: false };
  const { data, error } = await sb.auth.admin.createUser({ email, email_confirm: true });
  if (error || !data.user) {
    // Created at the same moment by the other caller (webhook vs return page)? Look again.
    const { data: again } = await sb.from("profiles").select("id").ilike("email", email).maybeSingle();
    if (again) return { id: again.id, created: false };
    throw error ?? new Error("Couldn't create the account");
  }
  return { id: data.user.id, created: true };
}

/** Starting goals from the check, so the plan is ready the moment someone pays. They can change it any time. */
export function defaultGoals(answers: Answers, results: Results | null): Goal[] {
  const h = planHints(answers, results);
  const goals: Goal[] = [];
  for (const r of h.recs) {
    if (goals.length >= 2) break;
    if (r.area === "move") goals.push({ area: "move", settings: { cue: "After work", activity: "Brisk walking", startLevel: h.moveStart } });
    if (r.area === "sleep") goals.push({ area: "sleep", settings: { wake: "06:30", startLevel: h.sleepStart } });
    if (r.area === "weight" && h.weightKg) goals.push({ area: "weight", settings: { startKg: h.weightKg, targetKg: weightTarget(h.weightKg), weighDay: 6, moveStart: Math.min(6, h.moveStart) } });
    if (r.area === "eat") goals.push({ area: "eat", settings: { swaps: h.swaps.slice(0, 4) } });
    if (r.area === "calm") goals.push({ area: "calm", settings: h.calm });
  }
  // Everything already looks good? Keep the momentum with movement.
  if (!goals.length) goals.push({ area: "move", settings: { cue: "After work", activity: "Brisk walking", startLevel: h.moveStart } });
  return goals;
}

/** Give (or renew) the plan for `months`, creating starting goals if there are none. */
async function grantPlan(userId: string, months: number, answers: Answers, results: Results | null) {
  const sb = supabaseAdmin();
  const today = lagosDay();
  let { data: plan } = await sb.from("plans").select("*").eq("user_id", userId).maybeSingle();
  if (!plan) plan = (await sb.from("plans").insert({ user_id: userId, status: "draft" }).select("*").single()).data;
  if (!plan) throw new Error("Couldn't create the plan");
  const stillActive = plan.status === "active" && plan.paid_until && plan.paid_until >= today;
  const from = stillActive ? plan.paid_until : today;
  const until = new Date(`${from}T00:00:00Z`);
  until.setUTCMonth(until.getUTCMonth() + months);
  await sb.from("plans").update({
    status: "active", starts_on: stillActive && plan.starts_on ? plan.starts_on : mondayOf(today),
    paid_until: until.toISOString().slice(0, 10), updated_at: new Date().toISOString(),
  }).eq("id", plan.id);

  const { data: goals } = await sb.from("plan_goals").select("id, area").eq("plan_id", plan.id).eq("active", true);
  if (!goals?.length) {
    await sb.from("plan_goals").upsert(defaultGoals(answers, results).map((g) => ({ plan_id: plan!.id, user_id: userId, area: g.area, settings: g.settings, active: true })), { onConflict: "plan_id,area" });
  } else {
    // A new check counts as a weigh-in for an existing weight goal.
    const w = goals.find((g) => g.area === "weight");
    const kg = Number((answers as Record<string, unknown>).weight);
    if (w && kg >= 30 && kg <= 250) {
      const { data: cur } = await sb.from("plan_logs").select("done").eq("goal_id", w.id).eq("day", today).maybeSingle();
      await sb.from("plan_logs").upsert({ goal_id: w.id, user_id: userId, day: today, done: cur?.done ?? false, value: kg }, { onConflict: "goal_id,day" });
    }
  }
  return { renewed: !!stillActive };
}

/**
 * The ONE place a check becomes paid (webhook and return page both call this; safe to call twice).
 * Re-checks with Paystack, then: unlocks the check, finds or creates the account, gives or renews
 * the plan, and emails the results.
 */
export async function confirmCheckPayment(reference: string, source: "webhook" | "verify") {
  const sb = supabaseAdmin();
  const { data: purchase } = await sb.from("plan_purchases").select("*").eq("reference", reference).eq("kind", "check").maybeSingle();
  if (!purchase) return { paid: false as const };
  if (purchase.status === "paid") return { paid: true as const, screeningId: purchase.screening_id as string | null, accountCreated: false };
  const tx = await verifyTransaction(reference);
  await sb.from("payments").insert({ reference, source, status: tx.status, amount_kobo: tx.amount, currency: tx.currency, raw: { status: tx.status, amount: tx.amount, currency: tx.currency, paid_at: tx.paid_at, purpose: "check" } });
  if (tx.status !== "success" || tx.currency !== "NGN" || tx.amount < purchase.amount_kobo) return { paid: false as const };

  // Only one caller wins this update, so the plan is extended once.
  const { data: won } = await sb.from("plan_purchases").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", purchase.id).eq("status", "pending").select("id");
  if (!won?.length) return { paid: true as const, screeningId: purchase.screening_id as string | null, accountCreated: false };

  const { data: screening } = await sb.from("screenings").select("id, email, user_id, answers, results").eq("id", purchase.screening_id).maybeSingle();
  if (!screening) return { paid: true as const, screeningId: null, accountCreated: false };
  const account = screening.user_id ? { id: screening.user_id as string, created: false } : await accountFor(screening.email);
  await sb.from("screenings").update({ paid: true, paid_at: new Date().toISOString(), user_id: account.id }).eq("id", screening.id);
  await sb.from("plan_purchases").update({ user_id: account.id }).eq("id", purchase.id);
  await sb.from("profiles").update({ latest_answers: screening.answers, updated_at: new Date().toISOString() }).eq("id", account.id);

  const { months } = await loadPlanSettings();
  await grantPlan(account.id, months, screening.answers as Answers, screening.results as Results);

  if (emailConfigured()) {
    const m = resultsEmail(screening.results as Results);
    await sendEmail(screening.email, m.subject, m.html, m.text);
    const loaded = await loadPlan(account.id);
    if (loaded?.goals.length) {
      const whys = Object.fromEntries(loaded.goals.map((g) => [g.area, personalWhy(g.area, screening.answers as Answers, screening.results as Results)]));
      const w = welcomeEmail(loaded.goals, null, { email: screening.email, newAccount: account.created, whys });
      await sendEmail(screening.email, w.subject, w.html, w.text);
    }
  }
  return { paid: true as const, screeningId: screening.id as string, accountCreated: account.created };
}
