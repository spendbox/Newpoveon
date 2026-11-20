import "server-only";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

export type HomeTest = {
  id: string; code: string; name: string; description: string | null; price_naira: number | null; is_bundle: boolean; includes: string[];
  category: string; sample: string | null; fasting: boolean; turnaround: string | null; notes: string | null;
  for_sex: "female" | "male" | null; collection: "home" | "lab" | "both"; featured: boolean;
};

export const LAB_CATEGORIES: { key: string; label: string }[] = [
  { key: "full", label: "Full health checks" },
  { key: "heart", label: "Heart" },
  { key: "diabetes", label: "Diabetes" },
  { key: "women", label: "Women" },
  { key: "men", label: "Men" },
  { key: "fertility", label: "Fertility" },
  { key: "sexual", label: "Sexual health" },
  { key: "premarital", label: "Pre-marital" },
  { key: "pregnancy", label: "Pregnancy" },
  { key: "organs", label: "Kidney, liver and thyroid" },
  { key: "wellness", label: "Energy and vitamins" },
  { key: "single", label: "Single tests" },
];

export async function activeHomeTests(): Promise<HomeTest[]> {
  if (!supabaseConfigured()) return [];
  const { data, error } = await supabaseAdmin()
    .from("home_tests")
    .select("id, code, name, description, price_naira, is_bundle, includes, category, sample, fasting, turnaround, notes, for_sex, collection, featured")
    .eq("active", true)
    .order("sort");
  if (error) {
    // Older database without the package columns: fall back to the basic fields.
    const { data: basic } = await supabaseAdmin().from("home_tests").select("id, code, name, description, price_naira, is_bundle, includes").eq("active", true).order("sort");
    return (basic ?? []).map((t) => ({ ...t, category: t.is_bundle ? "full" : "single", sample: null, fasting: false, turnaround: null, notes: null, for_sex: null, collection: "home", featured: false })) as HomeTest[];
  }
  return (data ?? []) as HomeTest[];
}
