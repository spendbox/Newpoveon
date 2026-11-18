import "server-only";
import { pricePlan, type Component, type PlanPrice, type PricingSettings } from "@/lib/pricing";
import { supabaseAdmin } from "@/lib/supabase/server";

export type DbComponent = { id: string; code: string; name: string; category: string; unit: string; cost_naira: number | null; notes: string | null; active: boolean; sort: number };
export type DbGoal = { id: string; code: string; name: string; area: string; description: string | null; active: boolean; sort: number };
export type DbItem = { id: string; plan_id: string; component_id: string; quantity: number; note: string | null };
export type DbPlan = { id: string; goal_id: string; tier: string; name: string; summary: string | null; markup_override: number | null; price_override_naira: number | null; active: boolean; sort: number };
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
