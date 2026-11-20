import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEARN, LEARN_ORDER, type LearnSlug } from "@/content/learn";
import { Icon } from "@/components/icons";
import { Mannequin } from "@/components/mannequin";
import { ButtonLink, Logo } from "@/components/ui";
import { WhatsAppButton } from "@/components/whatsapp-catalog";
import { STATUS_LABEL } from "@/lib/scoring/results";
import { YourResult } from "./your-result";

export function generateStaticParams() {
  return LEARN_ORDER.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = LEARN[slug as LearnSlug];
  return t ? { title: `${t.title}: what it means and how to improve it`, description: t.tagline } : {};
}

const BAND = { good: "bg-good-bg text-good-text", check: "bg-check-bg text-check-text", act: "bg-act-bg text-act-text" } as const;

export default async function LearnPage({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const t = LEARN[slug as LearnSlug];
  if (!t) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-6 pb-20">
      <div className="flex items-center justify-between">
        <Logo />
        <Link href="/learn" className="text-sm font-medium text-muted hover:text-ink">All topics</Link>
      </div>

      {/* Hero */}
      <section className="mt-6 grid items-center gap-6 overflow-hidden rounded-[var(--radius-xl)] bg-surface p-6 md:grid-cols-[1fr_220px] md:p-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-[13px] font-semibold text-primary"><Icon name={t.icon} size={16} strokeWidth={2} /> Health guide</span>
          <h1 className="mt-4 text-[36px] leading-[1.05] font-bold md:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-xl text-[18px] text-muted">{t.tagline}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={`/doctor?type=${t.consult}`} icon="stethoscope">{t.consultLabel}</ButtonLink>
            {t.test && <WhatsAppButton message={`Hello, I'd like to request a test: ${t.test.name}.`} className="sm:w-auto">Request a test</WhatsAppButton>}
          </div>
        </div>
        <div className="mx-auto hidden w-[200px] md:block"><Mannequin highlight={t.area} className="h-auto w-full" /></div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <section className="md:hidden"><YourResult slug={t.slug} /></section>

          <section className="rounded-[var(--radius-xl)] border border-line bg-surface p-6" aria-labelledby="what">
            <h2 id="what" className="text-2xl font-semibold">What it is</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-ink/85">{t.whatItIs}</p>
            <h3 className="mt-5 text-lg font-semibold">Why it matters</h3>
            <ul className="mt-2 grid gap-2">
              {t.whyItMatters.map((x) => <li key={x} className="flex gap-2.5 text-[15px] leading-snug"><Icon name="check" size={18} strokeWidth={2.4} className="mt-0.5 shrink-0 text-primary" />{x}</li>)}
            </ul>
          </section>

          <section className="rounded-[var(--radius-xl)] border border-line bg-surface p-6" aria-labelledby="bands">
            <h2 id="bands" className="text-2xl font-semibold">What your result means</h2>
            <ul className="mt-4 grid gap-2.5">
              {t.bands.map((b) => (
                <li key={b.label} className="grid gap-1 rounded-[var(--radius-md)] border border-line p-4 sm:grid-cols-[150px_1fr] sm:gap-4">
                  <div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${BAND[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                    <p className="mt-1 font-semibold">{b.label}</p>
                    <p className="text-[13px] text-muted">{b.range}</p>
                  </div>
                  <p className="text-[15px] text-ink/85 sm:self-center">{b.meaning}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="improve">
            <h2 id="improve" className="text-2xl font-semibold md:text-3xl">How to improve it</h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2">
              {t.improve.map((x, i) => (
                <li key={x.title} className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
                  <h3 className="mt-3 text-lg font-semibold">{x.title}</h3>
                  <p className="mt-1 text-[15px] leading-snug text-muted">{x.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-[var(--radius-xl)] bg-ink p-6 text-white" aria-labelledby="doctor">
            <h2 id="doctor" className="text-2xl font-semibold text-white">When to see a doctor</h2>
            <ul className="mt-3 grid gap-2">
              {t.seeDoctor.map((x) => <li key={x} className="flex gap-2.5 text-[15px] text-white/85"><Icon name="arrowRight" size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-sun" />{x}</li>)}
            </ul>
            {t.urgent && (
              <p className="mt-4 flex gap-2.5 rounded-[var(--radius-md)] bg-coral/20 p-3 text-[15px] font-medium text-white">
                <Icon name="warning" size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-coral" />{t.urgent}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={`/doctor?type=${t.consult}`} icon="stethoscope" variant="secondary">{t.consultLabel}</ButtonLink>
            </div>
          </section>

          <section className="rounded-[var(--radius-xl)] border border-line bg-surface-2 p-5 text-[14px] text-muted" aria-labelledby="how">
            <h2 id="how" className="font-body text-sm font-semibold tracking-[0.04em] text-ink uppercase">How we check it</h2>
            <p className="mt-1.5"><b className="text-ink">{t.howWeCheck.tool}.</b> {t.howWeCheck.detail}</p>
            <p className="mt-1.5 text-[13px]">Source: {t.howWeCheck.source}</p>
            <p className="mt-1.5 text-[13px]">This guide is general health information, not a diagnosis or personal medical advice.</p>
          </section>
        </div>

        <aside className="flex flex-col gap-4 md:sticky md:top-6 md:self-start">
          <div className="hidden md:block"><YourResult slug={t.slug} /></div>
          {t.test && (
            <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-lavender-soft text-lavender"><Icon name="flask" size={20} strokeWidth={2} /></span>
              <p className="mt-3 font-semibold">Recommended test</p>
              <p className="text-lg font-semibold">{t.test.name}</p>
              <p className="mt-1 text-[14px] text-muted">{t.test.why}</p>
              <WhatsAppButton size="sm" message={`Hello, I'd like to request a test: ${t.test.name}.`} className="mt-4">Request on WhatsApp</WhatsAppButton>
            </div>
          )}
          <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name="stethoscope" size={20} strokeWidth={2} /></span>
            <p className="mt-3 font-semibold">Talk to a doctor</p>
            <p className="mt-1 text-[14px] text-muted">Private, from your phone, at a time that suits you.</p>
            <ButtonLink href={`/doctor?type=${t.consult}`} variant="secondary" className="mt-4 w-full">Book a consult</ButtonLink>
          </div>
          <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
            <p className="font-semibold">Related</p>
            <ul className="mt-2 grid gap-1">
              {t.related.map((r) => (
                <li key={r}><Link href={`/learn/${r}`} className="flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-2 text-[15px] hover:bg-surface-2">{LEARN[r].title}<Icon name="arrowRight" size={16} strokeWidth={2} className="text-subtle" /></Link></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
