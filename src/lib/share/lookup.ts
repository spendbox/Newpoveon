import "server-only";
import { shareSummary, type Results } from "@/lib/scoring/results";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/** Look up a share link. Returns ONLY the non-sensitive summary, or null if off / not found. */
export async function findShared(token: string) {
  if (!supabaseConfigured() || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const { data } = await supabaseAdmin().from("screenings").select("results, created_at").eq("share_token", token).eq("share_enabled", true).single();
  if (!data) return null;
  return { summary: shareSummary(data.results as Results), createdAt: data.created_at as string };
}
