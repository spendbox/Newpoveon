import "server-only";
import { site } from "@/config/site";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import type { Discount } from "./perks";

/** `price`: the health check price (it includes the plan). `months`: how long each paid check's plan lasts. */
export type PlanSettings = { price: number; months: number; discount: Discount };

/** Plan price and member discount, from Admin → Consults and fees (safe defaults until SQL 14 is run). */
export async function loadPlanSettings(): Promise<PlanSettings> {
  const fallback: PlanSettings = { price: site.planPriceNaira, months: 3, discount: { type: "fixed", value: 2500 } };
  if (!supabaseConfigured()) return fallback;
  const sb = supabaseAdmin();
  let { data, error } = await sb.from("booking_settings").select("plan_price_naira, plan_discount_type, plan_discount_value, plan_months").eq("id", 1).maybeSingle();
  if (error) ({ data, error } = await sb.from("booking_settings").select("plan_price_naira, plan_discount_type, plan_discount_value").eq("id", 1).maybeSingle() as never);
  if (error || !data) return fallback;
  return {
    price: data.plan_price_naira ?? fallback.price,
    months: (data as { plan_months?: number }).plan_months ?? 3,
    discount: { type: (data.plan_discount_type ?? "fixed") as Discount["type"], value: data.plan_discount_value ?? 2500 },
  };
}
