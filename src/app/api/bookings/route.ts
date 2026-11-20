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
const VOICE_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/aac", "audio/wav"];

export async function POST(req: Request) {
  try {
    if (!supabaseConfigured() || !paystackConfigured()) return json({ error: "Online booking isn't switched on yet. Please message us on WhatsApp." }, 503);
    // The form sends JSON, or multipart (JSON in "data" + an optional "voice" recording).
    let b: Record<string, unknown>;
    let voice: File | null = null;
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      if (Number(req.headers.get("content-length") ?? 0) > 3_500_000) return json({ error: "That voice note is too long. Please keep it under 2 minutes." }, 413);
      const form = await req.formData();
      try {
        b = JSON.parse(String(form.get("data") ?? "{}"));
      } catch {
        return json({ error: "Something went wrong. Please try again." }, 400);
      }
      const v = form.get("voice");
      if (v instanceof File && v.size > 0) {
        const kind = v.type.split(";")[0];
        if (v.size > 3_145_728) return json({ error: "That voice note is too long. Please keep it under 2 minutes." }, 413);
        if (!VOICE_TYPES.includes(kind)) return json({ error: "We couldn't read that recording. Please type instead." }, 400);
        voice = v;
      }
    } else {
      b = await readJson(req, 5000);
    }
    const name = cleanText(b.name, 120);
    const phone = cleanText(b.phone, 30);
    const reason = cleanText(b.reason, 1000) || (voice ? "(Voice note)" : "");
    if (name.length < 2) return json({ error: "Please tell us your name." }, 400);
    if (!isPhone(phone)) return json({ error: "Please enter a phone number we can call." }, 400);
    if (!isEmail(b.email)) return json({ error: "Please enter a valid email address." }, 400);
    if (reason.length < 3 && !voice) return json({ error: "Please tell us briefly what's going on, by voice note or text." }, 400);
    const email = (b.email as string).trim().toLowerCase();
    const sb = supabaseAdmin();

    const typeId = typeof b.consultTypeId === "string" && /^[0-9a-f-]{36}$/i.test(b.consultTypeId) ? b.consultTypeId : null;
    if (!typeId) return json({ error: "Please choose what you need help with." }, 400);
    const { data: type } = await sb.from("consult_types").select("id, code, name, doctor_type, price_naira, active").eq("id", typeId).maybeSingle();
    if (!type || !type.active || type.price_naira == null) return json({ error: "That option isn't available right now. Please choose another." }, 400);
    // "Something else": the person names their concern in a few words.
    const otherTopic = type.code === "something-else" ? cleanText(b.otherTopic, 80) : "";
    if (type.code === "something-else" && otherTopic.length < 3) return json({ error: "Please tell us in a few words what you need help with." }, 400);
    const typeName = otherTopic ? `Something else: ${otherTopic}` : type.name;
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
        amount_kobo: amount, paystack_reference: reference, consult_type_id: type.id, consult_type_name: typeName, doctor_type: type.doctor_type,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (voice) {
      const kind = voice.type.split(";")[0];
      const ext = kind.includes("mp4") || kind.includes("aac") ? "m4a" : kind.includes("ogg") ? "ogg" : kind.includes("mpeg") ? "mp3" : kind.includes("wav") ? "wav" : "webm";
      const path = `${new Date().toISOString().slice(0, 7)}/${booking.id}.${ext}`;
      const { error: upErr } = await sb.storage.from("voice-notes").upload(path, voice, { contentType: kind, upsert: false });
      if (upErr) {
        console.error("[bookings] voice upload", upErr.message);
        await sb.from("bookings").delete().eq("id", booking.id);
        return json({ error: "We couldn't save your voice note. Please try again, or type instead." }, 502);
      }
      await sb.from("bookings").update({ voice_note_path: path }).eq("id", booking.id);
    }

    if (startsAt) {
      const { data: ok, error: e2 } = await sb.rpc("book_time", { p_booking: booking.id, p_starts: startsAt, p_capacity: capacity, p_hold_minutes: hold });
      if (e2) throw e2;
      if (!ok) {
        const { data: gone } = await sb.from("bookings").delete().eq("id", booking.id).select("voice_note_path").maybeSingle();
        if (gone?.voice_note_path) await sb.storage.from("voice-notes").remove([gone.voice_note_path]);
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
