"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
import { bioAgeEmail } from "@/lib/bioage/server";
import { checkValues, exactAge, MARKERS, phenoAge, toBase, type MarkerKey, type Values } from "@/lib/bioage/phenoage";
import { supabaseAdmin } from "@/lib/supabase/server";
import { lagosDay } from "@/lib/plan/engine";
import { requireAdmin } from "../../guard";

const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const ymd = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);

/**
 * Save a biological age result. Everything is recalculated here from the typed numbers: the preview
 * on the page is only a help. Then the person is emailed (unless the box was unticked).
 */
export async function saveBioAge(f: FormData) {
  const admin = await requireAdmin();
  const userId = str(f, "user_id", 40);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("bad id");
  const sb = supabaseAdmin();
  const { data: profile } = await sb.from("profiles").select("id, email, full_name, member_code").eq("id", userId).maybeSingle();
  if (!profile?.member_code) throw new Error("No such member");

  const back = (error: string) => redirect(`/admin/bio-age?code=${encodeURIComponent(profile.member_code)}&error=${encodeURIComponent(error)}`);
  const sample = ymd(str(f, "sample_date", 10));
  const dob = ymd(str(f, "dob", 10));
  if (!sample || sample > lagosDay()) back("Enter the date the sample was taken (not in the future).");
  const age = dob && sample ? exactAge(dob, sample) : null;
  if (age === null || age < 18 || age > 100) back("Enter a valid date of birth (18 or older on the test day).");

  const entered = {} as Record<MarkerKey, { value: number; unit: string }>;
  const values = {} as Values;
  for (const m of MARKERS) {
    const raw = str(f, m.key, 20).replace(",", ".");
    const unit = str(f, `${m.key}_unit`, 20) || m.units[0].label;
    const v = raw === "" ? NaN : Number(raw);
    entered[m.key] = { value: v, unit };
    values[m.key] = toBase(m.key, v, unit);
  }
  const problems = checkValues(values);
  if (problems.length) back(`Check ${problems.map((p) => MARKERS.find((m) => m.key === p.key)!.name).join(", ")}.`);

  const r = phenoAge(age!, values);
  const row = {
    user_id: userId, member_code: profile.member_code, sample_date: sample!, age_years: Math.round(age! * 100) / 100,
    markers: values, entered, pheno_age: Math.round(r.phenoAge * 10) / 10,
    lab_name: str(f, "lab_name", 120) || null, lab_ref: str(f, "lab_ref", 120) || null, notes: str(f, "notes", 1000) || null,
    entered_by: admin.email,
  };
  const { data: saved, error } = await sb.from("bio_age_results").insert(row).select("id").single();
  if (error || !saved) back("Couldn't save. Has SQL 17 been run?");

  let emailed = false;
  if (f.get("send_email") === "on" && profile.email) {
    const m = bioAgeEmail(row, profile.full_name);
    emailed = await sendEmail(profile.email, m.subject, m.html, m.text).catch(() => false);
    if (emailed) await sb.from("bio_age_results").update({ emailed_at: new Date().toISOString() }).eq("id", saved!.id);
  }
  revalidatePath("/admin/bio-age");
  revalidatePath("/account/bio-age");
  redirect(`/admin/bio-age?code=${encodeURIComponent(profile.member_code)}&saved=${emailed ? "emailed" : "1"}`);
}

/** Remove a result entered by mistake. Needs the member ID typed to confirm. */
export async function deleteBioAge(f: FormData) {
  await requireAdmin();
  const id = str(f, "id", 40);
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("bad id");
  const sb = supabaseAdmin();
  const { data: row } = await sb.from("bio_age_results").select("member_code").eq("id", id).maybeSingle();
  if (!row) redirect("/admin/bio-age");
  if (str(f, "confirm", 20).toUpperCase() !== row.member_code) redirect(`/admin/bio-age?code=${encodeURIComponent(row.member_code)}&error=${encodeURIComponent("Not deleted: type the member ID exactly to confirm.")}`);
  await sb.from("bio_age_results").delete().eq("id", id);
  revalidatePath("/admin/bio-age");
  revalidatePath("/account/bio-age");
  redirect(`/admin/bio-age?code=${encodeURIComponent(row.member_code)}&deleted=1`);
}

/** Set the price shown for the Biological Age Check (paid on WhatsApp for now). */
export async function saveBioAgePrice(f: FormData) {
  await requireAdmin();
  const price = Math.round(Number(str(f, "price", 12).replace(/[^\d.]/g, "")));
  if (!Number.isFinite(price) || price < 1000 || price > 10_000_000) redirect(`/admin/bio-age?error=${encodeURIComponent("Enter a price between ₦1,000 and ₦10,000,000.")}`);
  const { data, error } = await supabaseAdmin().from("home_tests").update({ price_naira: price, updated_at: new Date().toISOString() }).eq("code", "biological-age").select("id");
  if (error || !data?.length) redirect(`/admin/bio-age?error=${encodeURIComponent("Couldn't save the price. Has SQL 17 been run?")}`);
  revalidatePath("/admin/bio-age");
  revalidatePath("/home-tests");
  revalidatePath("/account/bio-age");
  revalidatePath("/");
  redirect("/admin/bio-age?price=saved");
}
