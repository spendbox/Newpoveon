import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

/** Bookable slots: from 1 hour from now, for the next 21 days. Expired holds count as free. */
export async function openSlots() {
  const from = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const to = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin()
    .from("availability_slots")
    .select("id, starts_at, duration_min")
    .gte("starts_at", from)
    .lte("starts_at", to)
    .or(`status.eq.open,and(status.eq.held,held_until.lt.${now})`)
    .order("starts_at")
    .limit(300);
  if (error) throw error;
  return data ?? [];
}
