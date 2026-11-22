import "server-only";
import { site } from "@/config/site";
import { button, layout } from "@/lib/email";
import { currentUser, supabaseAdmin, supabaseUser } from "@/lib/supabase/server";
import { differenceText, type MarkerKey, type Values } from "./phenoage";
export { normaliseMemberCode } from "./member";

export type BioAgeRow = {
  id: string; user_id: string; member_code: string; sample_date: string; age_years: number; pheno_age: number;
  markers: Values; entered: Record<MarkerKey, { value: number; unit: string }> | null;
  lab_name: string | null; lab_ref: string | null; notes: string | null; entered_by: string; emailed_at: string | null; created_at: string;
};

const COLS = "id, user_id, member_code, sample_date, age_years, pheno_age, markers, entered, lab_name, lab_ref, notes, entered_by, emailed_at, created_at";

/** The signed-in person's own results, newest first (row-level security keeps it to them). Empty before SQL 17. */
export async function myBioAges(): Promise<BioAgeRow[]> {
  const sb = await supabaseUser();
  const { data, error } = await sb.from("bio_age_results").select(COLS).order("sample_date", { ascending: false }).order("created_at", { ascending: false }).limit(50);
  if (error) return [];
  return (data ?? []).map(num) as BioAgeRow[];
}

/** Anyone's results, for Admin only. */
export async function bioAgesFor(userId: string): Promise<BioAgeRow[]> {
  const { data } = await supabaseAdmin().from("bio_age_results").select(COLS).eq("user_id", userId).order("sample_date", { ascending: false }).limit(50);
  return (data ?? []).map(num) as BioAgeRow[];
}

/** Postgres numerics arrive as strings. */
function num(r: Record<string, unknown>) {
  return { ...r, age_years: Number(r.age_years), pheno_age: Number(r.pheno_age) };
}

/** The signed-in person's member ID, or null before SQL 17. */
export async function myMemberCode(userId: string): Promise<string | null> {
  const sb = await supabaseUser();
  const { data, error } = await sb.from("profiles").select("member_code").eq("id", userId).maybeSingle();
  if (error) return null;
  return (data?.member_code as string | null) ?? null;
}

/** The member ID of whoever is logged in, or null for visitors (and before SQL 17). */
export async function currentMemberCode(): Promise<string | null> {
  const user = await currentUser().catch(() => null);
  return user ? myMemberCode(user.id) : null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function bioAgeEmail(r: { pheno_age: number; age_years: number; sample_date: string }, name?: string | null) {
  const url = `${site.siteUrl}/account/bio-age`;
  const diff = r.pheno_age - r.age_years;
  const when = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${r.sample_date}T12:00:00Z`));
  const html = layout("Your biological age is ready", `<p>${name ? `Hi ${esc(name.split(" ")[0])},` : "Hi,"}</p>
<p>Your blood results from ${esc(when)} are in, and we've worked out your biological age.</p>
<p style="margin:16px 0;font-size:40px;font-weight:800;color:#136F58;text-align:center">${Math.round(r.pheno_age)}</p>
<p style="text-align:center;margin:0 0 16px;font-size:16px">That's <b>${esc(differenceText(diff))}</b>.</p>
<p>See which results helped, which added years, and what to do next on your dashboard.</p>
${button(url, "See my biological age")}
<p style="margin-top:16px;font-size:13px;color:#5E706A">Biological age is an estimate from routine blood tests (Levine's PhenoAge, 2018). It's not a diagnosis. If any result worries you, talk to one of our doctors.</p>`);
  return { subject: "Your Poveon biological age is ready", html, text: `Your biological age is ${Math.round(r.pheno_age)}: ${differenceText(diff)}. See the details: ${url}` };
}
