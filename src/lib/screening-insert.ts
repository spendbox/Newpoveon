import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Save a screening. If the database hasn't had SQL 8 yet (no wellbeing_score column),
 * save without that column instead of failing: the score is still inside "results".
 */
export async function insertScreening(sb: SupabaseClient, row: Record<string, unknown>) {
  const first = await sb.from("screenings").insert(row).select("id").single();
  if (first.error && /wellbeing_score/.test(first.error.message ?? "")) {
    const { wellbeing_score: _skip, ...rest } = row;
    void _skip;
    return sb.from("screenings").insert(rest).select("id").single();
  }
  return first;
}
