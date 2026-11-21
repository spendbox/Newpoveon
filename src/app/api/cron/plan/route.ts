import { sendEmail } from "@/lib/email";
import { addDays, lagosDay, weekdayOf } from "@/lib/plan/engine";
import { expirePlans, loadPlan, nextWeekDay, nudgeEmail, renewalEmail, weeklyEmail, type PlanRow } from "@/lib/plan/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Runs once a day at 6pm Lagos time (Vercel Cron, see vercel.json).
 * Sunday: each member's week in review, with next week's adjusted targets.
 * Wednesday: a gentle nudge, only for people who haven't ticked anything off since Monday.
 * Vercel sends "Authorization: Bearer CRON_SECRET"; anything else is refused.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("unauthorised", { status: 401 });
  if (!supabaseConfigured()) return Response.json({ ok: false, reason: "no database" });
  const today = lagosDay();
  const wd = weekdayOf(today);
  await expirePlans(today);
  const sb = supabaseAdmin();

  // Renewal reminder, 14 days before the plan year ends (every day of the week).
  let sent = 0;
  const { data: ending } = await sb.from("plans").select("user_id, paid_until").eq("status", "active").eq("paid_until", addDays(today, 14));
  if (ending?.length) {
    const { data: ppl } = await sb.from("profiles").select("id, email, full_name").in("id", ending.map((p) => p.user_id));
    for (const p of ending) {
      const person = ppl?.find((x) => x.id === p.user_id);
      if (!person?.email) continue;
      const m = renewalEmail(p.paid_until, person.full_name);
      if (await sendEmail(person.email, m.subject, m.html, m.text)) sent++;
    }
  }
  if (wd !== 0 && wd !== 3) return Response.json({ ok: true, sent });

  const { data: plans } = await sb.from("plans").select("*").eq("status", "active").eq("reminders", true).gte("paid_until", today);
  const ids = (plans ?? []).map((p) => p.user_id);
  const { data: people } = ids.length ? await sb.from("profiles").select("id, email, full_name").in("id", ids) : { data: [] };
  const who = new Map((people ?? []).map((p) => [p.id, p as { email: string; full_name: string | null }]));
  for (const plan of (plans ?? []) as PlanRow[]) {
    const row = { ...plan, profiles: who.get(plan.user_id) };
    if (!row.profiles?.email) continue;
    try {
      if (wd === 0 && row.last_weekly_email === today) continue;
      if (wd === 3 && row.last_nudge_email === today) continue;
      const now = await loadPlan(row.user_id, today);
      if (!now?.goals.length) continue;
      if (wd === 0) {
        const next = await loadPlan(row.user_id, nextWeekDay(today));
        const m = weeklyEmail(now.goals, next?.goals ?? [], row.profiles!.full_name);
        if (await sendEmail(row.profiles!.email, m.subject, m.html, m.text)) { sent++; await sb.from("plans").update({ last_weekly_email: today }).eq("id", row.id); }
      } else if (now.goals.every((g) => g.progress.thisWeek.done === 0)) {
        const m = nudgeEmail(now.goals, row.profiles!.full_name);
        if (await sendEmail(row.profiles!.email, m.subject, m.html, m.text)) { sent++; await sb.from("plans").update({ last_nudge_email: today }).eq("id", row.id); }
      }
    } catch (e) {
      console.error("[cron plan]", row.id, (e as Error).message);
    }
  }
  return Response.json({ ok: true, sent });
}
