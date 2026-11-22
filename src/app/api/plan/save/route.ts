import { handleError, json, readJson } from "@/lib/http";
import { cleanGoals } from "@/lib/plan/validate";
import { currentUser, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/** Create or update the signed-in person's plan goals. The plan itself comes with a paid health check. */
export async function POST(req: Request) {
  try {
    if (!supabaseConfigured()) return json({ error: "Plans aren't switched on yet." }, 503);
    const user = await currentUser();
    if (!user) return json({ error: "Please log in first." }, 401);
    const { goals: raw } = await readJson(req, 5000);
    const goals = cleanGoals(raw);
    if (!goals) return json({ error: "Please check your choices and try again." }, 400);
    const sb = supabaseAdmin();
    let { data: plan } = await sb.from("plans").select("id, status").eq("user_id", user.id).maybeSingle();
    if (!plan) {
      const ins = await sb.from("plans").insert({ user_id: user.id, status: "draft" }).select("id, status").single();
      if (ins.error) throw ins.error;
      plan = ins.data;
    }
    // Turn off areas no longer chosen (their history is kept), then save the chosen ones.
    await sb.from("plan_goals").update({ active: false }).eq("plan_id", plan.id).not("area", "in", `(${goals.map((g) => g.area).join(",")})`);
    const { error } = await sb.from("plan_goals").upsert(goals.map((g) => ({ plan_id: plan!.id, user_id: user.id, area: g.area, settings: g.settings, active: true })), { onConflict: "plan_id,area" });
    if (error) throw error;
    await sb.from("plans").update({ updated_at: new Date().toISOString() }).eq("id", plan.id);
    return json({ ok: true, active: plan.status === "active" });
  } catch (e) {
    return handleError(e);
  }
}
