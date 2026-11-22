export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { discountLabel } from "@/lib/plan/perks";
import { loadPlanSettings } from "@/lib/plan/settings";
import { ResultsView } from "./results-view";

export const metadata: Metadata = { title: "Your results", robots: { index: false } };

export default async function ResultsPage() {
  const s = await loadPlanSettings().catch(() => null);
  return <ResultsView offer={{ price: s?.price ?? 1500, months: s?.months ?? 3, perk: s ? discountLabel(s.discount) : "" }} />;
}
