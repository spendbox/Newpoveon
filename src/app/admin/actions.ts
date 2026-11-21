"use server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { deleteUserAndData } from "@/lib/delete-user";
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

/* ---------------- Weekly schedule ---------------- */
const hhmm = (f: FormData, k: string) => {
  const v = str(f, k, 5);
  if (!/^\d{2}:\d{2}$/.test(v)) throw new Error("bad time");
  return v;
};
const revalidateSchedule = () => {
  revalidatePath("/admin/slots");
  revalidatePath("/doctor");
};

export async function saveBookingSettings(f: FormData) {
  await requireAdmin();
  const n = (k: string, lo: number, hi: number, d: number) => Math.max(lo, Math.min(hi, Number(f.get(k) || d)));
  await supabaseAdmin().from("booking_settings").upsert({
    id: 1, slot_minutes: n("slot_minutes", 5, 180, 20), min_notice_hours: n("min_notice_hours", 0, 168, 2),
    horizon_days: n("horizon_days", 1, 120, 21), hold_minutes: n("hold_minutes", 5, 120, 30), updated_at: new Date().toISOString(),
  });
  revalidateSchedule();
}

export async function addRule(f: FormData) {
  await requireAdmin();
  const days = f.getAll("weekday").map(Number).filter((d) => d >= 0 && d <= 6);
  const start = hhmm(f, "start_time");
  const end = hhmm(f, "end_time");
  if (end <= start) throw new Error("End must be after start");
  const capacity = Math.max(1, Math.min(50, Number(f.get("capacity") || 1)));
  if (days.length) await supabaseAdmin().from("availability_rules").insert(days.map((weekday) => ({ weekday, start_time: start, end_time: end, capacity })));
  revalidateSchedule();
}

export async function deleteRule(f: FormData) {
  await requireAdmin();
  await supabaseAdmin().from("availability_rules").delete().eq("id", uuid(f, "id"));
  revalidateSchedule();
}

export async function addException(f: FormData) {
  await requireAdmin();
  const date = str(f, "on_date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("bad date");
  const kind = str(f, "kind") === "extra" ? "extra" : "closed";
  const row: Record<string, unknown> = { on_date: date, kind, note: str(f, "note", 120) || null };
  if (kind === "extra") Object.assign(row, { start_time: hhmm(f, "start_time"), end_time: hhmm(f, "end_time"), capacity: Math.max(1, Number(f.get("capacity") || 1)) });
  await supabaseAdmin().from("availability_exceptions").insert(row);
  revalidateSchedule();
}

export async function deleteException(f: FormData) {
  await requireAdmin();
  await supabaseAdmin().from("availability_exceptions").delete().eq("id", uuid(f, "id"));
  revalidateSchedule();
}

/* ---------------- Consult types ---------------- */
export async function saveConsultType(f: FormData) {
  await requireAdmin();
  const priceRaw = str(f, "price_naira", 12).replace(/[^\d]/g, "");
  const row = {
    code: str(f, "code", 60).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: str(f, "name", 160),
    description: str(f, "description", 300) || null,
    grp: str(f, "grp", 40) || "Common",
    doctor_type: str(f, "doctor_type", 60) || "General physician",
    duration_min: Math.max(5, Math.min(180, Number(f.get("duration_min") || 20))),
    price_naira: priceRaw ? Number(priceRaw) : null,
    urgent_check: f.get("urgent_check") === "on",
    credit_to_plan: f.get("credit_to_plan") === "on",
    active: f.get("active") === "on",
    sort: Number(f.get("sort") || 100),
    updated_at: new Date().toISOString(),
  };
  if (!row.code || !row.name) throw new Error("Code and name are required");
  const id = str(f, "id", 40);
  if (id) await supabaseAdmin().from("consult_types").update(row).eq("id", id);
  else await supabaseAdmin().from("consult_types").insert(row);
  revalidatePath("/admin/consults");
  revalidatePath("/doctor");
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

/* ---------------- Users ---------------- */
/** Delete a registered user and their saved checks. The admin must type the user's email to confirm. */
export async function deleteUser(f: FormData) {
  await requireAdmin();
  const id = uuid(f, "id");
  const confirm = str(f, "confirm", 320).toLowerCase();
  const sb = supabaseAdmin();
  const { data: profile } = await sb.from("profiles").select("email").eq("id", id).maybeSingle();
  const email = (profile?.email ?? "").toLowerCase();
  if (!email || confirm !== email) redirect(`/admin/users?error=confirm&open=${id}`);
  await deleteUserAndData(id, email);
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  redirect("/admin/users?deleted=1");
}

/* ---------------- Health plan price and member discount ---------------- */
export async function savePlanPerks(f: FormData) {
  await requireAdmin();
  const type = ["none", "percent", "fixed"].includes(String(f.get("plan_discount_type"))) ? String(f.get("plan_discount_type")) : "fixed";
  const price = Math.round(Number(f.get("plan_price_naira") || 1500));
  let value = Math.round(Number(f.get("plan_discount_value") || 0));
  if (!Number.isFinite(price) || price < 100 || price > 1_000_000) throw new Error("The plan price must be between ₦100 and ₦1,000,000.");
  if (!Number.isFinite(value) || value < 0) value = 0;
  if (type === "percent") value = Math.min(100, value);
  value = Math.min(1_000_000, value);
  const { error } = await supabaseAdmin().from("booking_settings").upsert({ id: 1, plan_price_naira: price, plan_discount_type: type, plan_discount_value: value, updated_at: new Date().toISOString() });
  if (error) throw new Error("Couldn't save. Has SQL 14 been run?");
  revalidatePath("/admin/consults");
  revalidatePath("/doctor");
  revalidatePath("/account/plan");
}
