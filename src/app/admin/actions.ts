"use server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "./guard";

const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const uuid = (f: FormData, k: string) => {
  const v = str(f, k, 40);
  if (!/^[0-9a-f-]{36}$/i.test(v)) throw new Error("bad id");
  return v;
};

/* ---------------- Bookings ---------------- */
export async function setBookingStatus(f: FormData) {
  await requireAdmin();
  const status = str(f, "status");
  if (!["completed", "cancelled", "paid"].includes(status)) throw new Error("bad status");
  const id = uuid(f, "id");
  await supabaseAdmin().from("bookings").update({ status, admin_notes: str(f, "notes", 2000) || undefined }).eq("id", id);
  if (status === "cancelled") await supabaseAdmin().from("availability_slots").update({ status: "open", booking_id: null, held_until: null }).eq("booking_id", id);
  revalidatePath("/admin/bookings");
}
export async function saveBookingNotes(f: FormData) {
  await requireAdmin();
  await supabaseAdmin().from("bookings").update({ admin_notes: str(f, "notes", 2000), needs_reschedule: f.get("needs_reschedule") === "on" }).eq("id", uuid(f, "id"));
  revalidatePath("/admin/bookings");
}

/* ---------------- Slots ---------------- */
/** Lagos is UTC+1 all year (no daylight saving), so local times convert with a fixed offset. */
export async function addSlots(f: FormData) {
  await requireAdmin();
  const date = str(f, "date", 10);
  const from = str(f, "from", 5);
  const to = str(f, "to", 5);
  const every = Math.max(10, Math.min(120, Number(f.get("every") || 20)));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to)) throw new Error("bad input");
  const start = new Date(`${date}T${from}:00+01:00`).getTime();
  const end = new Date(`${date}T${to}:00+01:00`).getTime();
  const rows = [];
  for (let t = start; t + every * 60000 <= end && rows.length < 60; t += every * 60000) rows.push({ starts_at: new Date(t).toISOString(), duration_min: every });
  if (rows.length) await supabaseAdmin().from("availability_slots").upsert(rows, { onConflict: "starts_at", ignoreDuplicates: true });
  revalidatePath("/admin/slots");
}
export async function setSlotStatus(f: FormData) {
  await requireAdmin();
  const status = str(f, "status");
  const id = uuid(f, "id");
  if (status === "delete") await supabaseAdmin().from("availability_slots").delete().eq("id", id).in("status", ["open", "blocked"]);
  else if (status === "open" || status === "blocked") await supabaseAdmin().from("availability_slots").update({ status }).eq("id", id).in("status", ["open", "blocked"]);
  revalidatePath("/admin/slots");
}

/* ---------------- Requests ---------------- */
export async function setRequestStatus(f: FormData) {
  await requireAdmin();
  const status = str(f, "status");
  if (!["new", "in_progress", "handled", "cancelled"].includes(status)) throw new Error("bad status");
  await supabaseAdmin().from("service_requests").update({ status, handled_at: status === "handled" ? new Date().toISOString() : null, admin_notes: str(f, "notes", 2000) || undefined }).eq("id", uuid(f, "id"));
  revalidatePath("/admin/requests");
}

/* ---------------- Home tests ---------------- */
export async function saveTest(f: FormData) {
  await requireAdmin();
  const priceRaw = str(f, "price", 12).replace(/[^\d]/g, "");
  const cats = ["full", "heart", "diabetes", "women", "men", "fertility", "sexual", "premarital", "pregnancy", "organs", "wellness", "single"];
  const includes = str(f, "includes", 4000).split(/\n|,(?![^(]*\))/).map((x) => x.trim()).filter(Boolean).slice(0, 60);
  const row = {
    code: str(f, "code", 60).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: str(f, "name", 120),
    description: str(f, "description", 500) || null,
    price_naira: priceRaw ? Number(priceRaw) : null,
    category: cats.includes(str(f, "category")) ? str(f, "category") : "single",
    is_bundle: includes.length > 1,
    includes,
    sample: str(f, "sample", 80) || null,
    fasting: f.get("fasting") === "on",
    turnaround: str(f, "turnaround", 40) || null,
    notes: str(f, "notes", 600) || null,
    for_sex: ["female", "male"].includes(str(f, "for_sex")) ? str(f, "for_sex") : null,
    collection: ["home", "lab", "both"].includes(str(f, "collection")) ? str(f, "collection") : "home",
    featured: f.get("featured") === "on",
    active: f.get("active") === "on",
    sort: Number(f.get("sort") || 100),
    updated_at: new Date().toISOString(),
  };
  if (!row.code || !row.name) throw new Error("Code and name are required");
  const id = str(f, "id", 40);
  if (id) await supabaseAdmin().from("home_tests").update(row).eq("id", id);
  else await supabaseAdmin().from("home_tests").insert(row);
  revalidatePath("/admin/tests");
  revalidatePath("/home-tests");
}

/* ---------------- Emergency contacts ---------------- */
export async function saveContact(f: FormData) {
  await requireAdmin();
  const phone = str(f, "phone", 30).replace(/[^\d+ ]/g, "") || null;
  const row = { label: str(f, "label", 120), phone, description: str(f, "description", 300) || null, active: f.get("active") === "on", sort: Number(f.get("sort") || 100), is_placeholder: !phone };
  if (!row.label) throw new Error("Label is required");
  const id = str(f, "id", 40);
  if (f.get("delete") === "1" && id) await supabaseAdmin().from("emergency_contacts").delete().eq("id", id);
  else if (id) await supabaseAdmin().from("emergency_contacts").update(row).eq("id", id);
  else await supabaseAdmin().from("emergency_contacts").insert(row);
  revalidatePath("/admin/contacts");
}

/* ---------------- Care plan pricing ---------------- */
const num = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").replace(/[^\d.]/g, "");
  return v === "" ? null : Number(v);
};
const revalidatePricing = () => {
  revalidatePath("/family");
  revalidatePath("/admin/pricing");
  revalidatePath("/admin/plans");
};

export async function savePricingSettings(f: FormData) {
  await requireAdmin();
  const markup = num(f, "default_markup");
  const q = num(f, "quarterly_premium");
  const m = num(f, "monthly_premium");
  const r = num(f, "round_to");
  await supabaseAdmin().from("pricing_settings").upsert({
    id: 1,
    default_markup: markup && markup >= 1 ? markup : 4,
    quarterly_premium: q != null ? Math.min(q, 100) / 100 : 0.1,
    monthly_premium: m != null ? Math.min(m, 100) / 100 : 0.15,
    round_to: r ?? 1000,
    fx_gbp: num(f, "fx_gbp"),
    fx_usd: num(f, "fx_usd"),
    fx_eur: num(f, "fx_eur"),
    fx_cad: num(f, "fx_cad"),
    fx_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/family");
  revalidatePricing();
}

export async function saveComponent(f: FormData) {
  await requireAdmin();
  const cats = ["doctor", "coordinator", "test", "visit", "medicine", "device", "delivery", "partner", "overhead", "other"];
  const row = {
    code: str(f, "code", 60).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: str(f, "name", 120),
    category: cats.includes(str(f, "category")) ? str(f, "category") : "other",
    unit: str(f, "unit", 40) || "each",
    cost_naira: num(f, "cost_naira"),
    notes: str(f, "notes", 300) || null,
    active: f.get("active") === "on",
    sort: Number(f.get("sort") || 100),
    updated_at: new Date().toISOString(),
  };
  if (!row.code || !row.name) throw new Error("Code and name are required");
  const id = str(f, "id", 40);
  if (id) await supabaseAdmin().from("care_components").update(row).eq("id", id);
  else await supabaseAdmin().from("care_components").insert(row);
  revalidatePricing();
}

export async function saveCareGoal(f: FormData) {
  await requireAdmin();
  const row = {
    code: str(f, "code", 60).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: str(f, "name", 160),
    area: str(f, "area", 60) || "Other",
    description: str(f, "description", 500) || null,
    active: f.get("active") === "on",
    sort: Number(f.get("sort") || 100),
  };
  if (!row.code || !row.name) throw new Error("Code and name are required");
  const id = str(f, "id", 40);
  if (id) await supabaseAdmin().from("care_goals").update(row).eq("id", id);
  else await supabaseAdmin().from("care_goals").insert(row);
  revalidatePricing();
}

export async function saveCarePlan(f: FormData) {
  await requireAdmin();
  const tiers = ["essential", "plus", "premium", "concierge", "custom"];
  const markup = num(f, "markup_override");
  const row = {
    goal_id: uuid(f, "goal_id"),
    tier: tiers.includes(str(f, "tier")) ? str(f, "tier") : "custom",
    name: str(f, "name", 160),
    summary: str(f, "summary", 500) || null,
    markup_override: markup && markup >= 1 ? markup : null,
    price_override_naira: num(f, "price_override_naira"),
    audience: ["self", "family", "both"].includes(str(f, "audience")) ? str(f, "audience") : "self",
    active: f.get("active") === "on",
    sort: Number(f.get("sort") || 100),
    updated_at: new Date().toISOString(),
  };
  if (!row.name) throw new Error("Name is required");
  const id = str(f, "id", 40);
  if (id) await supabaseAdmin().from("care_plans").update(row).eq("id", id);
  else await supabaseAdmin().from("care_plans").insert(row);
  revalidatePricing();
}

export async function savePlanItem(f: FormData) {
  await requireAdmin();
  const qty = num(f, "quantity");
  const plan = uuid(f, "plan_id");
  const comp = uuid(f, "component_id");
  if (!qty || qty <= 0) await supabaseAdmin().from("care_plan_items").delete().eq("plan_id", plan).eq("component_id", comp);
  else await supabaseAdmin().from("care_plan_items").upsert({ plan_id: plan, component_id: comp, quantity: qty }, { onConflict: "plan_id,component_id" });
  revalidatePricing();
}

export async function saveCareOption(f: FormData) {
  await requireAdmin();
  const row = {
    code: str(f, "code", 60).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: str(f, "name", 120),
    description: str(f, "description", 300) || null,
    category: str(f, "category") || null,
    multiplier: num(f, "multiplier") || 1,
    add_naira: num(f, "add_naira") ?? 0,
    active: f.get("active") === "on",
    sort: Number(f.get("sort") || 100),
  };
  if (!row.code || !row.name) throw new Error("Code and name are required");
  const id = str(f, "id", 40);
  if (id) await supabaseAdmin().from("care_options").update(row).eq("id", id);
  else await supabaseAdmin().from("care_options").insert(row);
  revalidatePricing();
}
