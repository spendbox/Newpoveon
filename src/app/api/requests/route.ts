import { features, site } from "@/config/site";
import { sendEmail, teamEmail } from "@/lib/email";
import { cleanText, handleError, isEmail, isPhone, json, readJson } from "@/lib/http";
import { currentUser, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/** Home-test and medication requests: saved to the database, team notified by email. */
export async function POST(req: Request) {
  try {
    if (!supabaseConfigured()) return json({ error: "Requests aren't switched on yet. Please message us on WhatsApp." }, 503);
    const b = await readJson(req, 8000);
    if (b.kind === "family_care") return features.familyCare ? familyCare(b) : json({ error: "Not available yet." }, 404);
    const kind = b.kind === "home_test" || b.kind === "medication" ? b.kind : null;
    if (!kind) return json({ error: "Unknown request" }, 400);
    const name = cleanText(b.name, 120);
    const phone = cleanText(b.phone, 30);
    const address = cleanText(b.address, 500);
    const email = b.email ? String(b.email).trim().toLowerCase() : null;
    if (name.length < 2 || !isPhone(phone) || address.length < 5) return json({ error: "Please fill in your name, phone and address." }, 400);
    if (email && !isEmail(email)) return json({ error: "That email doesn't look right." }, 400);

    const sb = supabaseAdmin();
    let test: { id: string; name: string; price_naira: number | null } | null = null;
    if (kind === "home_test" && typeof b.testId === "string") {
      const { data } = await sb.from("home_tests").select("id, name, price_naira").eq("id", b.testId).eq("active", true).maybeSingle();
      test = data;
    }
    const details: Record<string, string> = {};
    let hasPrescription: boolean | null = null;
    if (kind === "home_test" && !test && b.need) details.need = cleanText(b.need, 500);
    if (kind === "medication") {
      details.medicines = cleanText(b.medicines, 1500);
      details.prescription_answer = String(b.prescription ?? "");
      details.consult_reference = cleanText(b.consultReference, 40);
      if (!details.medicines) return json({ error: "Please tell us which medicines you need." }, 400);
      hasPrescription = b.prescription === "yes" || b.prescription === "unsure";
      // Prescription medicines only after a consult with us.
      if (hasPrescription && details.consult_reference.length < 4) return json({ error: "Please book a doctor consult first for prescription medicines." }, 400);
    }

    const user = await currentUser();
    const { data, error } = await sb.from("service_requests").insert({
      kind, user_id: user?.id ?? null, name, phone, email, address, preferred_time: cleanText(b.preferredTime, 120),
      test_id: test?.id ?? null, test_name: test?.name ?? null, details, has_prescription: hasPrescription,
      amount_kobo: test?.price_naira != null ? test.price_naira * 100 : null,
    }).select("id").single();
    if (error) throw error;

    if (site.teamEmail) {
      const t = teamEmail(kind === "home_test" ? "New home test request" : "New medication delivery request", {
        Name: name, Phone: phone, Email: email, Address: address, "Preferred time": b.preferredTime,
        Test: test?.name ?? details.need, Price: test?.price_naira != null ? `₦${test.price_naira.toLocaleString("en-NG")}` : undefined,
        Medicines: details.medicines, "Prescription medicine": kind === "medication" ? String(b.prescription) : undefined,
        "Consult reference": details.consult_reference,
      });
      await sendEmail(site.teamEmail, t.subject, t.html, t.text);
    }
    return json({ id: data.id });
  } catch (e) {
    return handleError(e);
  }
}

/** "Care for your parents": an enquiry from family abroad. */
async function familyCare(b: Record<string, unknown>) {
  const name = cleanText(b.name, 120);
  const phone = cleanText(b.phone, 30);
  const email = String(b.email ?? "").trim().toLowerCase();
  const location = cleanText(b.location, 200);
  const relationship = cleanText(b.relationship, 40);
  if (name.length < 2 || !isPhone(phone) || !isEmail(email) || location.length < 2 || !relationship) {
    return json({ error: "Please fill in your name, email, WhatsApp number, who the care is for and where they live." }, 400);
  }
  if (b.consent !== true) return json({ error: "Please tick the consent box." }, 400);
  const concerns = Array.isArray(b.concerns) ? b.concerns.slice(0, 12).map((c) => cleanText(c, 60)).filter(Boolean) : [];
  const details = {
    country: cleanText(b.country, 80),
    relationship,
    parent_name: cleanText(b.parentName, 80),
    parent_age: cleanText(b.parentAge, 3),
    concerns,
    plan: cleanText(b.plan, 120),
    notes: cleanText(b.notes, 1000),
    consent_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin()
    .from("service_requests")
    .insert({ kind: "family_care", name, phone, email, address: location, details, preferred_time: null })
    .select("id")
    .single();
  if (error) throw error;
  if (site.teamEmail) {
    const t = teamEmail("New family care enquiry", {
      From: `${name} (${details.country || "country not given"})`, Email: email, WhatsApp: phone,
      "Care for": `${relationship}${details.parent_name ? `: ${details.parent_name}` : ""}${details.parent_age ? `, ${details.parent_age}` : ""}`,
      "Lives in": location, Concerns: concerns.join(", "), Plan: details.plan, Notes: details.notes,
    });
    await sendEmail(site.teamEmail, t.subject, t.html, t.text);
  }
  return json({ id: data.id });
}
