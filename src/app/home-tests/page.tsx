import type { Metadata } from "next";
import Link from "next/link";
import { LAB_GROUPS, TEST_NAMES } from "@/config/catalog";
import { Icon } from "@/components/icons";
import { WhatsAppButton, WhatsAppCatalog } from "@/components/whatsapp-catalog";
import { BioAgeStudy } from "@/components/bio-age-study";
import { BIO_AGE_PREP, BIO_AGE_TESTS } from "@/lib/bioage/phenoage";
import { withMemberId } from "@/lib/bioage/member";
import { bioAgePrice, currentMemberCode } from "@/lib/bioage/server";

export const metadata: Metadata = { title: "Lab tests" };
export const dynamic = "force-dynamic";

export default async function LabTestsPage({ searchParams }: PageProps<"/home-tests">) {
  const sp = await searchParams;
  const highlight = typeof sp.test === "string" ? TEST_NAMES[sp.test] ?? null : null;
  const [memberCode, price] = await Promise.all([currentMemberCode(), bioAgePrice()]);
  return (
    <WhatsAppCatalog
      eyebrow="Lab tests"
      title="Lab tests, collected at home"
      intro="Tell us what you need on WhatsApp. A trained phlebotomist collects your sample at home or you visit a partner lab, and an accredited lab runs the test."
      icon="flask"
      kind="lab test"
      groups={LAB_GROUPS}
      highlight={highlight}
      memberCode={memberCode}
      steps={["Message us with the test you need", "We confirm the price and a time", "We collect your sample and send your results"]}
    >
      <BioAgePackage memberCode={memberCode} price={price} />
      <BioAgeStudy id="bio-study" className="mt-8" />
    </WhatsAppCatalog>
  );
}

/** The Biological Age Check: featured at the top of the lab tests page. */
function BioAgePackage({ memberCode, price }: { memberCode: string | null; price: number }) {
  return (
    <section id="biological-age" className="mt-10 scroll-mt-6 overflow-hidden rounded-[var(--radius-xl)] border-2 border-lavender/40 bg-surface" aria-labelledby="bio-title">
      <div className="bg-lavender-soft px-5 py-5 md:px-8 md:py-7">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[13px] font-semibold text-lavender"><span className="h-2 w-2 rounded-full bg-lavender" aria-hidden="true" /> New</p>
        <h2 id="bio-title" className="mt-3 text-[28px] leading-tight font-bold md:text-4xl">Biological Age Check</h2>
        <p className="mt-1 max-w-2xl text-[16px] text-ink/75">How old is your body, really? Nine routine blood results, turned into one number, with what&apos;s adding years and what&apos;s taking them off.</p>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-2"><span className="font-display text-[32px] leading-none font-bold">₦{price.toLocaleString("en-NG")}</span><span className="text-[14px] text-ink/70">all nine results and your biological age · pay when we confirm on WhatsApp</span></p>
      </div>
      <div className="grid gap-6 px-5 py-5 md:grid-cols-2 md:px-8 md:py-7">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">What&apos;s tested</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-[15px]">
            {BIO_AGE_TESTS.map((t) => <li key={t} className="flex gap-2"><Icon name="check" size={16} strokeWidth={2.4} className="mt-1 shrink-0 text-primary" />{t}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">Before the test</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-[15px]">
            {BIO_AGE_PREP.map((t) => <li key={t} className="flex gap-2"><Icon name="clock" size={16} strokeWidth={2.2} className="mt-1 shrink-0 text-primary" />{t}</li>)}
          </ul>
          <p className="mt-4 text-[14px] text-muted">Your result appears on your dashboard and we email it to you. Re-test every 6 to 12 months to watch it change.</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-line px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        {memberCode ? (
          <p className="text-[14px] text-muted">Your message will include your Poveon ID, <b className="font-mono text-ink">{memberCode}</b>, so your result goes straight to your dashboard.</p>
        ) : (
          <p className="text-[14px] text-muted"><Link href="/login?next=/home-tests" className="font-semibold text-primary underline">Log in</Link> first, so your result goes straight to your dashboard.</p>
        )}
        <WhatsAppButton size="sm" message={withMemberId("Hello, I'd like to book the Biological Age Check.", memberCode)} className="shrink-0 self-start md:self-auto">Book on WhatsApp</WhatsAppButton>
      </div>
    </section>
  );
}
