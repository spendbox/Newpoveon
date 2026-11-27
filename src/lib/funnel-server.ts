import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { SessionRow, ViewRow } from "./funnel";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function all(build: (a: number, b: number) => PromiseLike<{ data: any[] | null; error: { message: string } | null }>) {
  const rows: any[] = [];
  for (let a = 0; a < 300_000; a += 1000) {
    const { data, error } = await build(a, a + 999);
    if (error) return { rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return { rows, error: null };
}

export type FunnelData = { views: ViewRow[]; sessions: SessionRow[]; paid: number; needsSql: boolean };

/** Page views and check attempts in a period, and the health checks paid for in it. */
export async function loadFunnel(r: { from: Date; to: Date }): Promise<FunnelData> {
  const sb = supabaseAdmin();
  const from = r.from.toISOString(), to = r.to.toISOString();
  const [views, sessions, paid] = await Promise.all([
    all((a, b) => sb.from("page_views").select("path, visitor, source, device, created_at").gte("created_at", from).lt("created_at", to).order("id").range(a, b)),
    all((a, b) => sb.from("check_sessions").select("*").gte("started_at", from).lt("started_at", to).order("id").range(a, b)),
    sb.from("plan_purchases").select("id", { count: "exact", head: true }).eq("kind", "check").eq("status", "paid").gte("paid_at", from).lt("paid_at", to),
  ]);
  return { views: views.rows, sessions: sessions.rows, paid: paid.count ?? 0, needsSql: !!(views.error || sessions.error) };
}

/** When counting began (the first page view), for "All time". */
export async function firstView(): Promise<Date | null> {
  const { data } = await supabaseAdmin().from("page_views").select("created_at").order("created_at", { ascending: true }).limit(1);
  return data?.[0] ? new Date(data[0].created_at) : null;
}
