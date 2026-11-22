import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Save a screening, tolerating columns that later SQL scripts add.
 */
export async function insertScreening(sb: SupabaseClient, row: Record<string, unknown>) {
  let attempt = { ...row };
  let res = await sb.from("screenings").insert(attempt).select("id").single();
  // Columns added by later SQL scripts: if the database hasn't had them yet, save without them.
  for (const col of ["wellbeing_score", "paid"]) {
    if (res.error && new RegExp(col).test(res.error.message ?? "")) {
      const { [col]: _skip, ...rest } = attempt;
      void _skip;
      attempt = rest;
      res = await sb.from("screenings").insert(attempt).select("id").single();
    }
  }
  return res;
}
