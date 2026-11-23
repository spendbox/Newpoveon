import "server-only";
import { site } from "@/config/site";
import { button, layout, sendEmail } from "@/lib/email";
import { verifyTransaction } from "@/lib/paystack";
import { supabaseAdmin } from "@/lib/supabase/server";
import { addDays, AREAS, lagosDay, mondayOf, progress, weekScore, type Area, type Goal, type Log, type Progress } from "./engine";
import { AREA_INFO } from "./options";

export type PlanRow = { id: string; user_id: string; status: "draft" | "active" | "expired" | "cancelled"; starts_on: string | null; paid_until: string | null; reminders: boolean; last_weekly_email: string | null; last_nudge_email: string | null };
export type GoalRow = { id: string; area: Area; settings: Goal["settings"]; active: boolean };
export type GoalView = { id: string; area: Area; settings: Goal["settings"]; progress: Progress };

/** Everything the plan page needs, worked out fresh from the logs every time. */
export async function loadPlan(userId: string, today = lagosDay()) {
  const sb = supabaseAdmin();
  const { data: plan } = await sb.from("plans").select("*").eq("user_id", userId).maybeSingle();
  if (!plan) return null;
  const { data: goals } = await sb.from("plan_goals").select("id, area, settings, active").eq("plan_id", plan.id).eq("active", true);
  const ids = (goals ?? []).map((g) => g.id);
  const { data: logs } = ids.length ? await sb.from("plan_logs").select("goal_id, day, done, value").in("goal_id", ids) : { data: [] };
  const start = (plan as PlanRow).starts_on ?? mondayOf(today);
  const sorted = ((goals ?? []) as GoalRow[]).sort((a, b) => AREAS.indexOf(a.area) - AREAS.indexOf(b.area));
  const ctx = { hasMove: sorted.some((g) => g.area === "move"), hasEat: sorted.some((g) => g.area === "eat") };
  const views: GoalView[] = sorted.map((g) => ({
    id: g.id, area: g.area, settings: g.settings,
    progress: progress({ area: g.area, settings: g.settings }, ((logs ?? []) as (Log & { goal_id: string })[]).filter((l) => l.goal_id === g.id), start, today, ctx),
  }));
  return { plan: plan as PlanRow, goals: views, today };
}

export function isActive(plan: PlanRow | null | undefined, today = lagosDay()) {
  return !!plan && plan.status === "active" && !!plan.paid_until && plan.paid_until >= today;
}

export { planHints } from "./hints";

/* ------------------------------------------------------------------ Payment */

/**
 * The ONE place a plan becomes paid. Called by the Paystack webhook and the return page.
 * Re-checks with Paystack, checks the amount, then extends the plan by a year. Safe to call twice.
 */
export async function confirmPlanPayment(reference: string, source: "webhook" | "verify") {
  const sb = supabaseAdmin();
  const { data: purchase } = await sb.from("plan_purchases").select("*").eq("reference", reference).maybeSingle();
  if (!purchase) return { paid: false };
  if (purchase.status === "paid") return { paid: true };
  const tx = await verifyTransaction(reference);
  await sb.from("payments").insert({ reference, source, status: tx.status, amount_kobo: tx.amount, currency: tx.currency, raw: { status: tx.status, amount: tx.amount, currency: tx.currency, paid_at: tx.paid_at, purpose: "plan" } });
  if (tx.status !== "success" || tx.currency !== "NGN" || tx.amount < purchase.amount_kobo) return { paid: false };

  // Only one caller wins this update, so the year is added once.
  const { data: won } = await sb.from("plan_purchases").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", purchase.id).eq("status", "pending").select("id");
  if (!won?.length) return { paid: true };

  const today = lagosDay();
  const { data: plan } = await sb.from("plans").select("*").eq("id", purchase.plan_id).single();
  const from = plan?.paid_until && plan.paid_until > today ? plan.paid_until : today;
  const paidUntil = new Date(`${from}T00:00:00Z`);
  paidUntil.setUTCFullYear(paidUntil.getUTCFullYear() + 1);
  await sb.from("plans").update({
    status: "active", starts_on: plan?.status === "active" && plan.starts_on ? plan.starts_on : mondayOf(today),
    paid_until: paidUntil.toISOString().slice(0, 10), updated_at: new Date().toISOString(),
  }).eq("id", purchase.plan_id);

  const { data: profile } = await sb.from("profiles").select("email, full_name").eq("id", purchase.user_id).maybeSingle();
  if (profile?.email) {
    const loaded = await loadPlan(purchase.user_id);
    const m = welcomeEmail(loaded?.goals ?? [], profile.full_name);
    await sendEmail(profile.email, m.subject, m.html, m.text);
  }
  return { paid: true };
}

/* ------------------------------------------------------------------ Emails */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const planUrl = () => `${site.siteUrl}/account/plan`;
const hi = (name?: string | null) => (name ? `Hi ${esc(name.split(" ")[0])},` : "Hi,");

function goalList(goals: GoalView[], whys: Partial<Record<Area, string>> = {}) {
  return goals.map((g) => {
    const why = whys[g.area] ? `<br><span style="color:#5E706A;font-size:13px">${esc(whys[g.area]!)}</span>` : "";
    return `<li style="margin:8px 0"><b>${esc(AREA_INFO[g.area].title)}:</b> ${esc(g.progress.target.headline)}${why}</li>`;
  }).join("");
}

export function welcomeEmail(goals: GoalView[], name?: string | null, opts: { email?: string; newAccount?: boolean; whys?: Partial<Record<Area, string>> } = {}) {
  const login = opts.newAccount && opts.email
    ? `<p style="background:#E3F2EC;border-radius:12px;padding:12px 14px">We've made a Poveon account for <b>${esc(opts.email)}</b>. To log in, tap the button below and enter this email. We'll send you a code, then you choose a password.</p>`
    : "";
  const html = layout("Your plan starts now", `<p>${hi(name)}</p>
<p>Your personal plan is ready, made from your check. Here's week 1, and why each part is in your plan:</p><ul style="padding-left:18px">${goalList(goals, opts.whys)}</ul>
<p>Tick things off in the app each day. Every Sunday we'll send your week's summary and adjust next week: a step up when it's going well, a step back if life got busy.</p>
${login}
${button(planUrl(), "Open my plan")}`);
  return { subject: "Your Poveon plan starts now", html, text: `Your personal plan is ready. Open it: ${planUrl()}` };
}

/** Sunday evening: how the week went, and what changes next week. */
export function weeklyEmail(goals: GoalView[], next: GoalView[], name?: string | null) {
  const s = weekScore(goals.map((g) => g.progress));
  const rows = goals.map((g, i) => {
    const p = g.progress, n = next[i]?.progress;
    const verdict = n && n.level > p.level ? "Stepping up next week" : n && n.level < p.level ? "Easing back next week" : "Same again next week";
    const w = g.area === "weight" && p.weight?.latest != null ? ` · ${p.weight.latest} kg${p.weight.lost != null && p.weight.lost > 0 ? `, down ${p.weight.lost} kg so far` : ""}` : "";
    return `<tr><td style="padding:8px 0;border-bottom:1px solid #E1E9E5"><b>${esc(AREA_INFO[g.area].title)}</b>: ${Math.min(p.thisWeek.done, p.thisWeek.needed)} of ${p.thisWeek.needed}${w}<br><span style="color:#5E706A;font-size:13px">${verdict}${n ? `: ${esc(n.target.headline)}` : ""}</span></td></tr>`;
  }).join("");
  const pct = s.needed ? Math.round((s.done / s.needed) * 100) : 0;
  const html = layout("Your week in review", `<p>${hi(name)}</p>
<p style="font-size:18px;font-weight:800">You did ${pct}% of your plan this week.</p>
<table role="presentation" width="100%">${rows}</table>
<p style="margin-top:14px">${pct >= 80 ? "Brilliant week. Keep it going." : pct >= 50 ? "Good effort. Small steps add up." : "Busy week? That's fine. Next week is a fresh start, and we've made it a little easier."}</p>
${button(planUrl(), "See next week")}`);
  return { subject: `Your week: ${pct}% of your plan`, html, text: `You did ${pct}% of your plan this week. See next week: ${planUrl()}` };
}

/** Wednesday nudge, only if nothing has been ticked off since Monday. */
export function nudgeEmail(goals: GoalView[], name?: string | null) {
  const html = layout("A quick nudge", `<p>${hi(name)}</p>
<p>Nothing ticked off yet this week. There's still time. This week's plan:</p><ul style="padding-left:18px">${goalList(goals)}</ul>
<p>Even one small win today counts.</p>
${button(planUrl(), "Tick off today")}`);
  return { subject: "Still time to hit this week's plan", html, text: `Still time to hit this week's plan: ${planUrl()}` };
}

/** 14 days before a plan year ends (plans don't renew automatically). */
export function renewalEmail(paidUntil: string, name?: string | null) {
  const when = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${paidUntil}T12:00:00Z`));
  const html = layout("Your plan ends soon", `<p>${hi(name)}</p>
<p>Your Poveon plan runs until <b>${when}</b>. Nothing renews automatically, so nothing will be charged.</p>
<p>It's a good time for a new check: see how your scores have moved, and your plan carries on with your history and progress.</p>
${button(`${site.siteUrl}/account/retake`, "Take a new check")}`);
  return { subject: "Your Poveon plan ends in 2 weeks", html, text: `Your plan runs until ${when}. Take a new check: ${site.siteUrl}/account/retake` };
}

/** Plans whose year has run out become "expired" (the person keeps their history). */
export async function expirePlans(today = lagosDay()) {
  await supabaseAdmin().from("plans").update({ status: "expired", updated_at: new Date().toISOString() }).eq("status", "active").lt("paid_until", today);
}

export const nextWeekDay = (today: string) => addDays(mondayOf(today), 7);
