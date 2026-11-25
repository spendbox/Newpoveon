export const dynamic = "force-dynamic";
import Link from "next/link";
import { site } from "@/config/site";
import { SubmitButton } from "@/components/buttons";
import { kidneyForResult, MARKER_BY_KEY, MARKERS, type MarkerKey } from "@/lib/bioage/phenoage";
import { bioAgeOffer, bioAgePrice, bioAgesFor, memberFacts, normaliseMemberCode, type BioAgeRow } from "@/lib/bioage/server";
import { lagosDay } from "@/lib/plan/engine";
import { supabaseAdmin } from "@/lib/supabase/server";
import { aBtn, aBtnQuiet, aInput, Badge, Card, H1 } from "../../ui";
import { BioAgeForm } from "./bio-age-form";
import { deleteBioAge, saveBioAgePrice } from "./actions";
import { LabRequest } from "./lab-request";

type Member = { id: string; email: string; full_name: string | null; phone: string | null; member_code: string; latest_answers: Record<string, unknown> | null };

/**
 * Admin → Biological age. Find the person by their member ID (they share it on WhatsApp), type the
 * nine results from the lab report, and the age is worked out, saved and emailed to them.
 */
export default async function BioAgePage({ searchParams }: PageProps<"/admin/bio-age">) {
  const sp = await searchParams;
  const q = typeof sp.code === "string" ? sp.code.trim().slice(0, 100) : typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sb = supabaseAdmin();
  const dayFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "UTC" });
  const fmtDay = (d: string) => dayFmt.format(new Date(`${d}T12:00:00Z`));

  // Find the member: by ID first, then by email, name or phone.
  let members: Member[] = [];
  let missingColumn = false;
  if (q) {
    const code = normaliseMemberCode(q);
    const cols = "id, email, full_name, phone, member_code, latest_answers";
    const res = code
      ? await sb.from("profiles").select(cols).eq("member_code", code).limit(1)
      : await sb.from("profiles").select(cols).or(`email.ilike.%${q.replace(/[%,()]/g, " ")}%,full_name.ilike.%${q.replace(/[%,()]/g, " ")}%,phone.ilike.%${q.replace(/[%,()]/g, " ")}%`).limit(10);
    if (res.error) missingColumn = true;
    members = (res.data ?? []) as Member[];
  }
  const member = members.length === 1 ? members[0] : null;
  const [history, facts] = member ? await Promise.all([bioAgesFor(member.id), memberFacts(member.id, member.email, member.latest_answers)]) : [[], null];

  const price = await bioAgePrice();
  const offer = member ? await bioAgeOffer(member.id) : null;
  const { data: recentRaw, error: recentErr } = await sb.from("bio_age_results")
    .select("id, member_code, sample_date, age_years, pheno_age, entered_by, emailed_at, created_at, lab_name")
    .order("created_at", { ascending: false }).limit(30);
  const recent = (recentRaw ?? []) as Pick<BioAgeRow, "id" | "member_code" | "sample_date" | "age_years" | "pheno_age" | "entered_by" | "emailed_at" | "created_at" | "lab_name">[];

  return (
    <>
      <H1 sub="Find the person by the member ID they send on WhatsApp, then type their nine results. The age is worked out, saved and emailed to them.">Biological age</H1>

      {(recentErr || missingColumn) && <p className="mb-4 rounded-lg bg-check-bg px-4 py-2 text-sm font-medium text-check-text">Run SQL 17 in Supabase first. Member IDs and biological age results need it.</p>}
      {sp.saved && <p className="mb-4 rounded-lg bg-good-bg px-4 py-2 text-sm font-medium text-good-text">Saved{sp.saved === "emailed" ? " and emailed" : ". Not emailed"}. It&apos;s on their dashboard now.</p>}
      {sp.deleted && <p className="mb-4 rounded-lg bg-good-bg px-4 py-2 text-sm font-medium text-good-text">Result deleted.</p>}
      {typeof sp.error === "string" && <p className="mb-4 rounded-lg bg-act-bg px-4 py-2 text-sm font-medium text-act-text">{sp.error}</p>}

      {sp.price === "saved" && <p className="mb-4 rounded-lg bg-good-bg px-4 py-2 text-sm font-medium text-good-text">Price saved. It&apos;s showing on the website now.</p>}
      {!member && (
        <Card className="mb-5">
          <form action={saveBioAgePrice} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-semibold">Price of the Biological Age Check
              <span className="mt-1 flex items-center gap-2">
                <span className="text-base font-bold">₦</span>
                <input name="price" inputMode="numeric" defaultValue={price} className={aInput} aria-describedby="price-help" required />
              </span>
              <span id="price-help" className="mt-1 block text-xs font-normal text-muted">Shown on the home page, the lab tests page and the dashboard. People pay on WhatsApp for now.</span>
            </label>
            <SubmitButton className={`${aBtn} shrink-0`}>Save price</SubmitButton>
          </form>
        </Card>
      )}

      <LabRequest memberCode={member?.member_code ?? null} />

      <form className="mb-5 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Member ID (PV-…), email, name or phone" className={aInput} aria-label="Find a member" autoFocus={!q} />
        <SubmitButton className={aBtnQuiet}>Find</SubmitButton>
        {q && <Link href="/admin/bio-age" className={`${aBtnQuiet} inline-flex items-center`}>Clear</Link>}
      </form>

      {q && !member && (
        <Card className="mb-6">
          {members.length === 0 ? <p className="text-sm text-muted">No member matches &ldquo;{q}&rdquo;. They need an account: ask them to log in once, then send the ID from their dashboard.</p> : (
            <ul className="flex flex-col divide-y divide-line">
              {members.map((m) => (
                <li key={m.id}><Link href={`/admin/bio-age?code=${encodeURIComponent(m.member_code)}`} className="flex items-center justify-between gap-3 py-2.5 hover:underline">
                  <span><b>{m.full_name || m.email}</b> <span className="text-sm text-muted">{m.full_name ? m.email : ""}</span></span>
                  <span className="font-mono text-sm font-semibold">{m.member_code}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {member && (
        <div className="mb-8 flex flex-col gap-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{member.full_name || member.email}</p>
                <p className="text-sm text-muted">{member.email}{member.phone ? ` · ${member.phone}` : ""}</p>
              </div>
              <span className="rounded-lg bg-primary-soft px-3 py-1.5 font-mono text-lg font-bold text-primary">{member.member_code}</span>
            </div>
            <div className="mt-3 rounded-lg bg-ground px-3 py-2 text-sm">
              {offer?.member != null
                ? <>Active plan member until <b>{dayFmt.format(new Date(`${offer.until}T12:00:00Z`))}</b>: charge <b>₦{offer.member.toLocaleString("en-NG")}</b> instead of ₦{offer.price.toLocaleString("en-NG")} ({offer.perk}).</>
                : <>No active plan: charge the full price, <b>₦{(offer?.price ?? price).toLocaleString("en-NG")}</b>.</>}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Add a result</h2>
            <BioAgeForm userId={member.id} dobGuess={facts?.dob ?? null} defaultSex={facts?.sex ?? null} today={lagosDay()} />
          </Card>

          {history.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold">Their results</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {history.map((h) => (
                  <li key={h.id}>
                    <details className="rounded-lg border border-line">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 p-3">
                        <span className="font-semibold">{fmtDay(h.sample_date)}</span>
                        <span className="text-sm">Biological age <b>{h.pheno_age}</b> · real age {h.age_years.toFixed(1)}</span>
                        {h.emailed_at ? <Badge tone="good">Emailed</Badge> : <Badge>Not emailed</Badge>}
                      </summary>
                      <div className="border-t border-line p-3 text-sm">
                        <table className="w-full text-left">
                          <thead><tr className="text-xs text-subtle"><th className="py-1 font-medium">Result</th><th className="font-medium">As typed</th><th className="font-medium">Used</th></tr></thead>
                          <tbody>
                            {MARKERS.map((m) => (
                              <tr key={m.key} className="border-t border-line">
                                <td className="py-1.5">{m.name}</td>
                                <td>{h.entered?.[m.key as MarkerKey] ? `${h.entered[m.key as MarkerKey].value} ${h.entered[m.key as MarkerKey].unit}` : "–"}</td>
                                <td>{round(h.markers[m.key as MarkerKey])} {MARKER_BY_KEY[m.key].units[0].label}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {kidneyForResult(h) && <p className="mt-2 text-sm">Kidney function (eGFR): <b>{kidneyForResult(h)!.egfr}</b> · {kidneyForResult(h)!.label} ({kidneyForResult(h)!.stage})</p>}
                        <p className="mt-2 text-xs text-muted">Entered by {h.entered_by} on {dayFmt.format(new Date(h.created_at))}{h.lab_name ? ` · ${h.lab_name}` : ""}{h.lab_ref ? ` · ref ${h.lab_ref}` : ""}</p>
                        {h.notes && <p className="mt-1 text-xs text-muted">Note: {h.notes}</p>}
                        <form action={deleteBioAge} className="mt-3 flex flex-col gap-2 rounded-lg bg-act-bg p-3 sm:flex-row">
                          <input type="hidden" name="id" value={h.id} />
                          <input name="confirm" placeholder={`Type ${h.member_code} to delete`} className={aInput} aria-label="Type the member ID to confirm" autoComplete="off" />
                          <SubmitButton className="min-h-[40px] shrink-0 rounded-lg bg-act-text px-4 text-sm font-semibold whitespace-nowrap text-white hover:opacity-90">Delete</SubmitButton>
                        </form>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      <h2 className="mb-2 text-lg font-semibold">Recently entered</h2>
      <p className="mb-3 text-sm text-muted">For quality checks: who entered each result, and whether it was emailed.</p>
      {recent.length === 0 ? <Card><p className="text-sm text-muted">No results yet.</p></Card> : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-ground text-xs text-subtle"><tr><th className="px-3 py-2 font-medium">Member ID</th><th className="font-medium">Sample</th><th className="font-medium">Bio age</th><th className="font-medium">Real age</th><th className="font-medium">Entered by</th><th className="font-medium">Emailed</th></tr></thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-3 py-2"><Link href={`/admin/bio-age?code=${encodeURIComponent(r.member_code)}`} className="font-mono font-semibold text-primary hover:underline">{r.member_code}</Link></td>
                  <td>{fmtDay(r.sample_date)}</td>
                  <td className="font-semibold">{Number(r.pheno_age)}</td>
                  <td>{Number(r.age_years).toFixed(1)}</td>
                  <td className="text-muted">{r.entered_by}</td>
                  <td>{r.emailed_at ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-subtle">Times shown in {site.timeZone}. Biological age uses Levine&apos;s PhenoAge (Aging, 2018).</p>
    </>
  );
}

const round = (n: number | undefined) => (n === undefined ? "–" : Math.round(n * 100) / 100);
