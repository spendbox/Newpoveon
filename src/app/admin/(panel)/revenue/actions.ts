"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normaliseMemberCode } from "@/lib/bioage/member";
import { isSource, parseLagosLocal } from "@/lib/revenue";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "../../guard";

const str = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").trim().slice(0, max);
const TABLES = ["plan_purchases", "bookings", "offline_payments"] as const;
const VIA = ["transfer", "cash", "pos", "paystack", "other"];

/** Back to the page, keeping the filters the admin had. */
const back = (f: FormData, extra: Record<string, string>) => {
  const qs = new URLSearchParams(str(f, "return", 500).replace(/^\?/, ""));
  for (const k of ["saved", "error", "refunded", "deleted"]) qs.delete(k);
  for (const [k, v] of Object.entries(extra)) qs.set(k, v);
  redirect(`/admin/revenue?${qs.toString()}#top`);
};

/** A payment received on WhatsApp (transfer, cash or POS). Matched to an account when the member ID or email is known. */
export async function recordPayment(f: FormData) {
  const admin = await requireAdmin();
  const kind = str(f, "kind", 20);
  const amount = Number(str(f, "amount", 20).replace(/[₦,\s]/g, ""));
  const paidAt = parseLagosLocal(str(f, "paid_at", 20));
  const via = str(f, "paid_via", 20);
  const whoRaw = str(f, "who", 200);
  if (!isSource(kind) || kind === "consult") back(f, { error: "Choose what the payment was for." });
  if (!Number.isFinite(amount) || amount < 1 || amount > 50_000_000) back(f, { error: "Enter the amount in naira, like 125000." });
  if (!paidAt || paidAt.getTime() > Date.now() + 5 * 60_000) back(f, { error: "Enter when it was paid (not in the future)." });
  if (!VIA.includes(via)) back(f, { error: "Choose how they paid." });

  const sb = supabaseAdmin();
  const code = normaliseMemberCode(whoRaw);
  const email = !code && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(whoRaw) ? whoRaw.toLowerCase() : null;
  let profile: { id: string; email: string; full_name: string | null; phone: string | null; member_code: string | null } | null = null;
  if (code || email) {
    const { data } = await sb.from("profiles").select("id, email, full_name, phone, member_code").eq(code ? "member_code" : "email", (code ?? email)!).maybeSingle();
    profile = data;
    if (code && !profile) back(f, { error: `No member has the ID ${code}. Check it, or type their name instead.` });
  }
  const name = str(f, "name", 120) || profile?.full_name || (!code && !email ? whoRaw : "") || null;
  if (!name && !profile && !email) back(f, { error: "Enter who paid: their member ID, email or name." });

  const { error } = await sb.from("offline_payments").insert({
    kind, description: str(f, "description", 200) || null,
    user_id: profile?.id ?? null, member_code: profile?.member_code ?? code ?? null, name, email: profile?.email ?? email,
    phone: str(f, "phone", 30) || profile?.phone || null,
    amount_kobo: Math.round(amount * 100), paid_via: via, paid_at: paidAt!.toISOString(),
    reference: str(f, "reference", 120) || null, note: str(f, "note", 500) || null, entered_by: admin.email,
  });
  if (error) back(f, { error: error.message.includes("offline_payments") ? "Run SQL 18 in Supabase first." : "Couldn't save. Try again." });
  revalidatePath("/admin/revenue");
  back(f, { saved: "1" });
}

/** Mark a payment as refunded (or undo it). The money comes off the totals; the payment stays in the list. */
export async function setRefund(f: FormData) {
  await requireAdmin();
  const table = str(f, "table", 30) as (typeof TABLES)[number];
  const id = str(f, "id", 40);
  if (!TABLES.includes(table) || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("bad input");
  const undo = str(f, "undo", 5) === "1";
  const { error } = await supabaseAdmin().from(table)
    .update(undo ? { refunded_at: null, refund_note: null } : { refunded_at: new Date().toISOString(), refund_note: str(f, "refund_note", 300) || null })
    .eq("id", id);
  if (error) back(f, { error: "Run SQL 18 in Supabase first. Refunds need it." });
  revalidatePath("/admin/revenue");
  back(f, { refunded: undo ? "undone" : "1" });
}

/** Delete a WhatsApp payment entered by mistake. Website payments can't be deleted, only refunded. */
export async function deletePayment(f: FormData) {
  await requireAdmin();
  const id = str(f, "id", 40);
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("bad id");
  if (str(f, "confirm", 20).toLowerCase() !== "delete") back(f, { error: "Type delete to confirm." });
  await supabaseAdmin().from("offline_payments").delete().eq("id", id);
  revalidatePath("/admin/revenue");
  back(f, { deleted: "1" });
}
