import { site } from "@/config/site";
import { availableSlots } from "@/lib/consults";
import { cleanText, handleError, isEmail, isPhone, json, readJson } from "@/lib/http";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { canManageScreening } from "@/lib/share/access";
import { currentUser, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { randomToken } from "@/lib/tokens";

/**
 * Book a goal-based consult: the price comes from the consult type the person chose
 * (set in Admin → Consults), never from the browser. Holds the time, then starts Paystack.
 */
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
    if (reason.length < 3) return json({ error: "Please tell us briefly what's going on." }, 400);
    const email = (b.email as string).trim().toLowerCase();
    const sb = supabaseAdmin();

    const typeId = typeof b.consultTypeId === "string" && /^[0-9a-f-]{36}$/i.test(b.consultTypeId) ? b.consultTypeId : null;
    if (!typeId) return json({ error: "Please choose what you need help with." }, 400);
    const { data: type } = await sb.from("consult_types").select("id, name, doctor_type, price_naira, active").eq("id", typeId).maybeSingle();
    if (!type || !type.active || type.price_naira == null) return json({ error: "That option isn't available right now. Please choose another." }, 400);
    const amount = type.price_naira * 100;

    // The time must be one we actually offer and still have room for.
    let startsAt: string | null = null;
    let capacity = 1;
    let hold: number = site.slotHoldMinutes;
    if (typeof b.startsAt === "string") {
      const { slots, settings } = await availableSlots();
      const want = new Date(b.startsAt).toISOString();
      const slot = slots.find((s) => s.startsAt === want);
      if (!slot) return json({ error: "Sorry, that time was just taken. Please pick another." }, 409);
      startsAt = slot.startsAt;
      capacity = slot.capacity;
      hold = settings.holdMinutes;
    }

    const user = await currentUser();
    const shareResults = b.shareResults !== false;
    let screeningId: string | null = null;
    if (shareResults && typeof b.screeningId === "string") {
      const s = await canManageScreening(b.screeningId, typeof b.ownerToken === "string" ? b.ownerToken : null);
      if (s) screeningId = s.id;
    }
    if (shareResults && !screeningId && user) {
      const { data } = await sb.from("screenings").select("id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      screeningId = data?.id ?? null;
    }

    const reference = `HC-${randomToken(9)}`;
    const { data: booking, error } = await sb
      .from("bookings")
      .insert({
        user_id: user?.id ?? null, name, phone, email, reason, share_results: shareResults, screening_id: screeningId,
        amount_kobo: amount, paystack_reference: reference, consult_type_id: type.id, consult_type_name: type.name, doctor_type: type.doctor_type,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (startsAt) {
      const { data: ok, error: e2 } = await sb.rpc("book_time", { p_booking: booking.id, p_starts: startsAt, p_capacity: capacity, p_hold_minutes: hold });
      if (e2) throw e2;
      if (!ok) {
        await sb.from("bookings").delete().eq("id", booking.id);
        return json({ error: "Sorry, someone just booked that time. Please pick another." }, 409);
      }
    }

    const tx = await initializeTransaction({
      email, amountKobo: amount, reference,
      callbackUrl: `${site.siteUrl}/doctor/confirmed`,
      metadata: { booking_id: booking.id, purpose: "consult", consult: type.name, custom_fields: [{ display_name: "Consult", variable_name: "consult", value: type.name }] },
    });
    return json({ authorizationUrl: tx.authorization_url, reference });
  } catch (e) {
    return handleError(e);
  }
}
