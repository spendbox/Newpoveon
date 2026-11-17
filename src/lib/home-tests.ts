import "server-only";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

export type HomeTest = { id: string; code: string; name: string; description: string | null; price_naira: number | null; is_bundle: boolean; includes: string[] };

export async function activeHomeTests(): Promise<HomeTest[]> {
  if (!supabaseConfigured()) return [];
  const { data } = await supabaseAdmin().from("home_tests").select("id, code, name, description, price_naira, is_bundle, includes").eq("active", true).order("sort");
  return (data ?? []) as HomeTest[];
}
