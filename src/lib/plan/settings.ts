import "server-only";
import { site } from "@/config/site";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import type { Discount } from "./perks";

export type PlanSettings = { price: number; discount: Discount };

/** Plan price and member discount, from Admin → Consults and fees (safe defaults until SQL 14 is run). */
export async function loadPlanSettings(): Promise<PlanSettings> {
  const fallback: PlanSettings = { price: site.planPriceNaira, discount: { type: "fixed", value: 2500 } };
  if (!supabaseConfigured()) return fallback;
  const { data, error } = await supabaseAdmin().from("booking_settings").select("plan_price_naira, plan_discount_type, plan_discount_value").eq("id", 1).maybeSingle();
  if (error || !data) return fallback;
  return {
    price: data.plan_price_naira ?? fallback.price,
    discount: { type: (data.plan_discount_type ?? "fixed") as Discount["type"], value: data.plan_discount_value ?? 2500 },
  };
}
