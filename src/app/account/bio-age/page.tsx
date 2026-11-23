export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MemberId } from "@/components/member-id";
import { TrendLine } from "@/components/trend-line";
import { WhatsAppButton } from "@/components/whatsapp-catalog";
import { withMemberId } from "@/lib/bioage/member";
import { bioAgePrice, myBioAges, myMemberCode } from "@/lib/bioage/server";
import { supabaseConfigured } from "@/lib/supabase/server";
import { getAccount } from "../data";
import { PageHead } from "../panels";
import { BioAgeStudy } from "@/components/bio-age-study";
import { Intro, Latest } from "./parts";

export const metadata: Metadata = { title: "Biological age", robots: { index: false } };

const dayFmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("en-NG", { month: "short", year: "2-digit", timeZone: "UTC" });
const day = (d: string) => new Date(`${d}T12:00:00Z`);

export default async function BioAgePage() {
  if (!supabaseConfigured()) redirect("/account");
  const { user } = await getAccount();
  const [rows, code, price] = await Promise.all([myBioAges(), myMemberCode(user.id), bioAgePrice()]);
  const latest = rows[0];
  const ask = withMemberId(latest ? "Hello, I'd like to book a repeat Biological Age Check." : "Hello, I'd like to book the Biological Age Check.", code);

  return (
    <>
      <PageHead eyebrow="My health" title="Biological age" sub="How old your body seems, from nine routine blood results." />
      <div className="flex flex-col gap-6">
        {latest ? <Latest row={latest} /> : <Intro />}

        {rows.length >= 2 && (
          <section className="rounded-[var(--radius-xl)] border border-line bg-surface p-5" aria-labelledby="trend">
            <h2 id="trend" className="font-semibold">Over time</h2>
            <p className="text-[13px] text-muted">Biological age, in years. Lower is better.</p>
            <div className="mt-3">
              <TrendLine label="Biological age over time" points={[...rows].reverse().map((r) => ({ date: shortFmt.format(day(r.sample_date)), value: Math.round(r.pheno_age) }))}
                min={Math.max(0, Math.floor((Math.min(...rows.map((r) => r.pheno_age)) - 5) / 5) * 5)} max={Math.ceil((Math.max(...rows.map((r) => r.pheno_age)) + 5) / 5) * 5} />
            </div>
            <ul className="mt-4 divide-y divide-line text-[15px]">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="font-medium">{dayFmt.format(day(r.sample_date))}</span>
                  <span><b>{Math.round(r.pheno_age)}</b> <span className="text-muted">· real age {Math.floor(r.age_years)}</span></span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-4 rounded-[var(--radius-xl)] bg-primary-soft p-5 md:flex-row md:items-center md:justify-between" aria-label="Book a test">
          <div>
            <p className="font-semibold">{latest ? "Re-test in 6 to 12 months" : "Book your test"} · ₦{price.toLocaleString("en-NG")}</p>
            <p className="text-[15px] text-ink/75">{latest ? "See if your changes are taking years off." : "A home blood test. Your result appears here, and we email you."} Message us on WhatsApp{code ? " with your ID" : ""}.</p>
          </div>
          <WhatsAppButton message={ask} size="sm" className="shrink-0 self-start md:self-auto">Book on WhatsApp</WhatsAppButton>
        </section>

        {code && <MemberId code={code} />}

        <BioAgeStudy id="study" />
      </div>
    </>
  );
}
