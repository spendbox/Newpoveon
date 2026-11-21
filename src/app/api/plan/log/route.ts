import { handleError, json, readJson } from "@/lib/http";
import { addDays, lagosDay, mondayOf } from "@/lib/plan/engine";
import { isActive, type PlanRow } from "@/lib/plan/server";
import { currentUser, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/**
 * Tick a day done (or undo it). Allowed for any day this week up to today, and yesterday,
 * so people can catch up if they forgot, but can't fill in the past to game their review.
 */
export async function POST(req: Request) {
  try {
    if (!supabaseConfigured()) return json({ error: "Plans aren't switched on yet." }, 503);
    const user = await currentUser();
    if (!user) return json({ error: "Please log in again." }, 401);
    const { goalId, day, done, value } = await readJson(req, 500);
    if (typeof goalId !== "string" || !/^[0-9a-f-]{36}$/i.test(goalId) || typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return json({ error: "Something went wrong." }, 400);
    const sb = supabaseAdmin();
    const { data: goal } = await sb.from("plan_goals").select("id, area, plan_id, plans(*)").eq("id", goalId).eq("user_id", user.id).eq("active", true).maybeSingle();
    const plan = (goal as unknown as { plans: PlanRow } | null)?.plans;
    if (!goal || !isActive(plan)) return json({ error: "Your plan isn't active." }, 403);
    const today = lagosDay(), yesterday = addDays(today, -1);
    const inWindow = day <= today && (day >= mondayOf(today) || day === yesterday);
    if (!inWindow || (plan!.starts_on && day < plan!.starts_on)) return json({ error: "You can only tick off this week, or yesterday." }, 400);

    if (goal.area === "weight") {
      const kg = Number(value);
      if (!Number.isFinite(kg) || kg < 30 || kg > 250) return json({ error: "Please enter your weight in kg." }, 400);
      const { error } = await sb.from("plan_logs").upsert({ goal_id: goal.id, user_id: user.id, day, done: true, value: Math.round(kg * 10) / 10 }, { onConflict: "goal_id,day" });
      if (error) throw error;
    } else if (done === false) {
      await sb.from("plan_logs").delete().eq("goal_id", goal.id).eq("day", day);
    } else {
      const { error } = await sb.from("plan_logs").upsert({ goal_id: goal.id, user_id: user.id, day, done: true }, { onConflict: "goal_id,day" });
      if (error) throw error;
    }
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
