export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { discountLabel } from "@/lib/plan/perks";
import { loadPlanSettings } from "@/lib/plan/settings";
import { currentUser, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { ResultsView } from "./results-view";

export const metadata: Metadata = { title: "Your results", robots: { index: false } };

export default async function ResultsPage() {
  const s = await loadPlanSettings().catch(() => null);
  // The general consult fee, to show how little the check costs by comparison.
  let consult: number | null = null;
  if (supabaseConfigured()) {
    const { data } = await supabaseAdmin().from("consult_types").select("price_naira").eq("code", "doctor-consult").eq("active", true).maybeSingle();
    consult = data?.price_naira ?? null;
  }
  const user = await currentUser().catch(() => null);
  return <ResultsView signedInEmail={user?.email ?? null} offer={{ price: s?.price ?? 1500, months: s?.months ?? 3, perk: s ? discountLabel(s.discount) : "", discount: s?.discount ?? null, consult }} />;
}
