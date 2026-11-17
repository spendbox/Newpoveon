import { site } from "@/config/site";
import { cleanText, handleError, isEmail, isPhone, json, readJson } from "@/lib/http";
import { consultAmountKobo, initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { canManageScreening } from "@/lib/share/access";
import { currentUser, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { randomToken } from "@/lib/tokens";

/** Create a booking, hold the slot, and start a ₦5,000 Paystack payment. No login needed. */
export async function POST(req: Request) {
  try {
    if (!supabaseConfigured() || !paystackConfigured()) return json({ error: "Online booking isn't switched on yet. Please message us on WhatsApp." }, 503);
    const b = await readJson(req, 5000);
    const name = cleanText(b.name, 120);
    const phone = cleanText(b.phone, 30);
    const reason = cleanText(b.reason, 1000);
    if (name.length < 2) return json({ error: "Please tell us your name." }, 400);
    if (!isPhone(phone)) return json({ error: "Please enter a phone number we can call." }, 400);
    if (!isEmail(b.email)) return json({ error: "Please enter a valid email address." }, 400);
    if (reason.length < 3) return json({ error: "Please tell us briefly why you'd like to talk to a doctor." }, 400);
    const email = (b.email as string).trim().toLowerCase();
    const slotId = typeof b.slotId === "string" && /^[0-9a-f-]{36}$/i.test(b.slotId) ? b.slotId : null;
    const shareResults = b.shareResults !== false;

    const sb = supabaseAdmin();
    const user = await currentUser();

    // Only link results the person can prove are theirs (owner token or their own account).
    let screeningId: string | null = null;
    if (shareResults && typeof b.screeningId === "string") {
      const s = await canManageScreening(b.screeningId, typeof b.ownerToken === "string" ? b.ownerToken : null);
      if (s) screeningId = s.id;
    }
    if (shareResults && !screeningId && user) {
      const { data } = await sb.from("screenings").select("id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      screeningId = data?.id ?? null;
    }

    let slotStartsAt: string | null = null;
    if (slotId) {
      const { data: slot } = await sb.from("availability_slots").select("starts_at").eq("id", slotId).single();
      if (!slot) return json({ error: "That time is no longer available. Please pick another." }, 409);
      slotStartsAt = slot.starts_at;
    }

    const reference = `HC-${randomToken(9)}`;
    const amount = consultAmountKobo();
    const { data: booking, error } = await sb
      .from("bookings")
      .insert({ user_id: user?.id ?? null, name, phone, email, reason, slot_id: slotId, slot_starts_at: slotStartsAt, share_results: shareResults, screening_id: screeningId, amount_kobo: amount, paystack_reference: reference })
      .select("id")
      .single();
    if (error) throw error;

    if (slotId) {
      const { data: ok, error: e2 } = await sb.rpc("reserve_slot", { p_slot: slotId, p_booking: booking.id, p_minutes: site.slotHoldMinutes });
      if (e2) throw e2;
      if (!ok) {
        await sb.from("bookings").delete().eq("id", booking.id);
        return json({ error: "Sorry, someone just booked that time. Please pick another." }, 409);
      }
    }

    const tx = await initializeTransaction({
      email, amountKobo: amount, reference,
      callbackUrl: `${site.siteUrl}/doctor/confirmed`,
      metadata: { booking_id: booking.id, purpose: "doctor_consult", custom_fields: [{ display_name: "Service", variable_name: "service", value: "Doctor consult" }] },
    });
    return json({ authorizationUrl: tx.authorization_url, reference });
  } catch (e) {
    return handleError(e);
  }
}
