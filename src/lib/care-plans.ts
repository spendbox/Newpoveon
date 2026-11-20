import "server-only";
import { pricePlan, type Component, type PlanPrice, type PricingSettings } from "@/lib/pricing";
import { supabaseAdmin } from "@/lib/supabase/server";

export type DbComponent = { id: string; code: string; name: string; category: string; unit: string; cost_naira: number | null; notes: string | null; active: boolean; sort: number };
export type DbGoal = { id: string; code: string; name: string; area: string; description: string | null; active: boolean; sort: number };
export type DbItem = { id: string; plan_id: string; component_id: string; quantity: number; note: string | null };
export type DbPlan = { id: string; goal_id: string; tier: string; audience?: string; name: string; summary: string | null; markup_override: number | null; price_override_naira: number | null; active: boolean; sort: number };
export type DbOption = { id: string; code: string; name: string; description: string | null; category: string | null; multiplier: number; add_naira: number; active: boolean; sort: number };

export const COMPONENT_CATEGORIES = ["doctor", "coordinator", "test", "visit", "medicine", "device", "delivery", "partner", "overhead", "other"] as const;
export const TIERS = ["essential", "plus", "premium", "concierge", "custom"] as const;

export async function loadSettings(): Promise<PricingSettings> {
  const { data } = await supabaseAdmin().from("pricing_settings").select("*").eq("id", 1).maybeSingle();
  return {
    defaultMarkup: Number(data?.default_markup ?? 4),
    quarterlyPremium: Number(data?.quarterly_premium ?? 0.1),
    monthlyPremium: Number(data?.monthly_premium ?? 0.15),
    roundTo: Number(data?.round_to ?? 1000),
  };
}

export async function loadCatalogue() {
  const sb = supabaseAdmin();
  const [settings, comps, goals, plans, items, options] = await Promise.all([
    loadSettings(),
    sb.from("care_components").select("*").order("sort"),
    sb.from("care_goals").select("*").order("sort"),
    sb.from("care_plans").select("*").order("sort"),
    sb.from("care_plan_items").select("*"),
    sb.from("care_options").select("*").order("sort"),
  ]);
  const components = (comps.data ?? []) as DbComponent[];
  const engineComponents: Component[] = components.map((c) => ({ id: c.id, name: c.name, category: c.category, costNaira: c.cost_naira }));
  const allItems = (items.data ?? []) as DbItem[];
  const priced = ((plans.data ?? []) as DbPlan[]).map((p) => {
    const its = allItems.filter((i) => i.plan_id === p.id);
    const price: PlanPrice = pricePlan(
      { items: its.map((i) => ({ componentId: i.component_id, quantity: Number(i.quantity) })), markupOverride: p.markup_override != null ? Number(p.markup_override) : null, priceOverrideNaira: p.price_override_naira },
      engineComponents,
      settings,
    );
    return { plan: p, items: its, price };
  });
  return { settings, components, goals: (goals.data ?? []) as DbGoal[], plans: priced, options: (options.data ?? []) as DbOption[] };
}

export const naira = (n: number | null | undefined) => (n == null ? "—" : `₦${Math.round(n).toLocaleString("en-NG")}`);

/* ---------------- Public-safe views (never include unit costs) ---------------- */
export type Fx = { code: "GBP" | "USD" | "EUR" | "CAD"; symbol: string; rate: number }[];

export async function loadFx(): Promise<Fx> {
  const { data } = await supabaseAdmin().from("pricing_settings").select("fx_gbp, fx_usd, fx_eur, fx_cad").eq("id", 1).maybeSingle();
  const all = [
    { code: "GBP", symbol: "£", rate: Number(data?.fx_gbp) },
    { code: "USD", symbol: "$", rate: Number(data?.fx_usd) },
    { code: "EUR", symbol: "€", rate: Number(data?.fx_eur) },
    { code: "CAD", symbol: "CA$", rate: Number(data?.fx_cad) },
  ] as Fx;
  return all.filter((f) => Number.isFinite(f.rate) && f.rate > 0);
}

export type PublicPlan = { id: string; tier: string; name: string; summary: string | null; annual: number | null; quarterly: number | null; monthly: number | null; includes: string[] };

/** Plans for one goal, with prices but no costs. Prices only when the goal is switched on. */
export async function publicPlansForGoal(goalCode: string): Promise<{ offered: boolean; plans: PublicPlan[] }> {
  const { goals, plans, components } = await loadCatalogue();
  const goal = goals.find((g) => g.code === goalCode);
  if (!goal) return { offered: false, plans: [] };
  const byId = new Map(components.map((c) => [c.id, c]));
  const out = plans
    .filter((p) => p.plan.goal_id === goal.id && p.plan.active)
    .map(({ plan, items, price }) => ({
      id: plan.id,
      tier: plan.tier,
      name: plan.name,
      summary: plan.summary,
      annual: goal.active ? price.annual : null,
      quarterly: goal.active ? price.quarterly : null,
      monthly: goal.active ? price.monthly : null,
      includes: items
        .map((i) => ({ c: byId.get(i.component_id), q: Number(i.quantity) }))
        .filter((x) => x.c && x.c.category !== "overhead")
        .map(({ c, q }) => (c!.unit.startsWith("per month") ? c!.name : `${q % 1 === 0 ? q : q.toFixed(1)} × ${c!.name.charAt(0).toLowerCase()}${c!.name.slice(1)} a year`)),
    }));
  return { offered: goal.active, plans: out };
}
