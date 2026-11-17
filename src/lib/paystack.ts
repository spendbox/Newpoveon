import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { site } from "@/config/site";
import { bookingEmail, sendEmail, teamEmail, formatWhen } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/server";
import { whatsappLink } from "@/lib/whatsapp";

const API = "https://api.paystack.co";
const secret = () => process.env.PAYSTACK_SECRET_KEY || "";

/**
 * TEST MODE LOCK: live keys (sk_live_…) are refused unless PAYSTACK_LIVE_MODE=true is set on purpose.
 */
export function paystackConfigured() {
  const k = secret();
  if (!k) return false;
  if (k.startsWith("sk_live_") && process.env.PAYSTACK_LIVE_MODE !== "true") {
    console.error("[paystack] Live key found but PAYSTACK_LIVE_MODE is not 'true'. Refusing to take real payments.");
    return false;
  }
  return true;
}
export const paystackTestMode = () => secret().startsWith("sk_test_");

export const consultAmountKobo = () => site.consultPriceNaira * 100;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status !== true) throw new Error(`Paystack ${path} failed: ${body.message ?? res.status}`);
  return body.data as T;
}

export function initializeTransaction(p: { email: string; amountKobo: number; reference: string; callbackUrl: string; metadata: Record<string, unknown> }) {
  return call<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email: p.email, amount: p.amountKobo, currency: "NGN", reference: p.reference, callback_url: p.callbackUrl, metadata: p.metadata }),
  });
}

export function verifyTransaction(reference: string) {
  return call<{ status: string; amount: number; currency: string; reference: string; paid_at: string | null }>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw body using your secret key. */
export function validWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature || !secret()) return false;
  const expected = createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The ONE place a booking becomes "paid". Called by the webhook and by the confirmation page.
 * Always re-checks with Paystack's API (never trusts the browser or the webhook body alone),
 * checks amount + currency, and sends the confirmation email exactly once.
 */
export async function confirmBookingPayment(reference: string, source: "webhook" | "verify") {
  const sb = supabaseAdmin();
  const tx = await verifyTransaction(reference);
  await sb.from("payments").insert({
    reference, source, status: tx.status, amount_kobo: tx.amount, currency: tx.currency,
    booking_id: (await sb.from("bookings").select("id").eq("paystack_reference", reference).maybeSingle()).data?.id ?? null,
    raw: { status: tx.status, amount: tx.amount, currency: tx.currency, paid_at: tx.paid_at },
  });
  if (tx.status !== "success" || tx.currency !== "NGN") return { paid: false, status: tx.status };

  const { data: rows, error } = await sb.rpc("mark_booking_paid", { p_reference: reference, p_amount: tx.amount });
  if (error) throw error;
  const booking = Array.isArray(rows) ? rows[0] : null;
  if (booking) {
    // First confirmation: send emails.
    const wa = whatsappLink(`Hello, I just booked a doctor consult. My reference is ${reference}.`);
    const m = bookingEmail(booking, wa);
    const sent = await sendEmail(booking.email, m.subject, m.html, m.text);
    if (sent) await sb.from("bookings").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", booking.id);
    if (site.teamEmail) {
      const t = teamEmail("New paid doctor consult", {
        Name: booking.name, Phone: booking.phone, Email: booking.email,
        When: booking.slot_starts_at ? formatWhen(booking.slot_starts_at) : "No slot chosen: call to agree a time",
        "Needs a new time": booking.needs_reschedule ? "YES" : "no",
        "Shared results": booking.share_results && booking.screening_id ? "Yes (see admin)" : "No",
        Reason: booking.reason, Reference: reference,
      });
      await sendEmail(site.teamEmail, t.subject, t.html, t.text);
    }
  }
  return { paid: true, status: tx.status };
}
