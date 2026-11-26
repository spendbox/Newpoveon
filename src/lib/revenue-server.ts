import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isSource, type Payment } from "./revenue";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Supabase returns up to 1,000 rows at a time, so read page by page. */
async function all(build: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: { message: string } | null }>) {
  const rows: any[] = [];
  for (let from = 0; from < 200_000; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) return { rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return { rows, error: null };
}

/**
 * Every payment ever received, newest first: paid health checks and plans, paid consults (even ones
 * cancelled later, since the money came in), and WhatsApp payments the team entered.
 * needsSql is true until SQL 18 is run (refunds and WhatsApp payments need it).
 */
export async function loadPayments(): Promise<{ payments: Payment[]; needsSql: boolean }> {
  const sb = supabaseAdmin();
  let needsSql = false;

  const purchases = async (refunds: boolean) => all((a, b) => sb.from("plan_purchases")
    .select(`id, kind, user_id, email, reference, amount_kobo, paid_at, created_at${refunds ? ", refunded_at, refund_note" : ""}`)
    .eq("status", "paid").order("id").range(a, b));
  const bookings = async (refunds: boolean) => all((a, b) => sb.from("bookings")
    .select(`id, user_id, name, phone, email, amount_kobo, paid_at, status, paystack_reference, consult_type_name${refunds ? ", refunded_at, refund_note" : ""}`)
    .not("paid_at", "is", null).order("id").range(a, b));

  let [pp, bk] = await Promise.all([purchases(true), bookings(true)]);
  if (pp.error || bk.error) {
    needsSql = true;
    [pp, bk] = await Promise.all([purchases(false), bookings(false)]);
  }
  const off = await all((a, b) => sb.from("offline_payments").select("*").order("id").range(a, b));
  if (off.error) needsSql = true;

  // Names and member IDs for people with an account.
  const ids = [...new Set([...pp.rows, ...bk.rows, ...off.rows].map((r) => r.user_id).filter(Boolean))] as string[];
  const people = new Map<string, { email: string | null; full_name: string | null; phone: string | null; member_code: string | null }>();
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const res = await sb.from("profiles").select("id, email, full_name, phone, member_code").in("id", chunk);
    const data: any[] = res.error ? ((await sb.from("profiles").select("id, email, full_name, phone").in("id", chunk)).data ?? []) : (res.data ?? []);
    for (const p of data) people.set(p.id, { email: p.email, full_name: p.full_name, phone: p.phone, member_code: p.member_code ?? null });
  }
  const who = (r: any) => people.get(r.user_id);

  const payments: Payment[] = [
    ...pp.rows.map((r): Payment => ({
      id: r.id, table: "plan_purchases", source: r.kind === "check" ? "check" : "plan", amountKobo: r.amount_kobo,
      paidAt: r.paid_at ?? r.created_at, name: who(r)?.full_name ?? null, email: r.email ?? who(r)?.email ?? null, phone: who(r)?.phone ?? null,
      memberCode: who(r)?.member_code ?? null, reference: r.reference, via: "paystack", description: r.kind === "check" ? "Health check (online)" : "Poveon plan (online)",
      refundedAt: r.refunded_at ?? null, refundNote: r.refund_note ?? null, enteredBy: null, status: null,
    })),
    ...bk.rows.map((r): Payment => ({
      id: r.id, table: "bookings", source: "consult", amountKobo: r.amount_kobo, paidAt: r.paid_at,
      name: r.name ?? who(r)?.full_name ?? null, email: r.email ?? who(r)?.email ?? null, phone: r.phone ?? who(r)?.phone ?? null,
      memberCode: who(r)?.member_code ?? null, reference: r.paystack_reference, via: "paystack", description: r.consult_type_name ?? "Doctor consult",
      refundedAt: r.refunded_at ?? null, refundNote: r.refund_note ?? null, enteredBy: null, status: r.status,
    })),
    ...off.rows.map((r): Payment => ({
      id: r.id, table: "offline_payments", source: isSource(r.kind) ? r.kind : "other", amountKobo: r.amount_kobo, paidAt: r.paid_at,
      name: r.name ?? who(r)?.full_name ?? null, email: r.email ?? who(r)?.email ?? null, phone: r.phone ?? who(r)?.phone ?? null,
      memberCode: r.member_code ?? who(r)?.member_code ?? null, reference: r.reference, via: r.paid_via, description: r.description,
      refundedAt: r.refunded_at ?? null, refundNote: r.refund_note ?? null, enteredBy: r.entered_by, status: null,
    })),
  ].filter((p) => p.paidAt && p.amountKobo > 0);

  payments.sort((x, y) => y.paidAt.localeCompare(x.paidAt));
  return { payments, needsSql };
}
