import Link from "next/link";
import { features } from "@/config/site";
import { Icon, type IconName } from "@/components/icons";
import { Logo, Overline } from "@/components/ui";
import { StartButton } from "./start-button";
import { AccountLink } from "@/components/account-link";
import { RotatingHeadline } from "@/components/rotating-headline";
import { MannequinHero } from "@/components/mannequin-hero";
import { BodyMap } from "@/components/body-map";

const FINDINGS: { icon: IconName; title: string; text: string; tint: string }[] = [
  { icon: "sun", title: "Wellbeing score", text: "How you've really been feeling, out of 100.", tint: "bg-sun-soft text-check-text" },
  { icon: "heart", title: "Heart age", text: "And your 10-year risk of heart attack or stroke.", tint: "bg-coral-soft text-act-text" },
  { icon: "drop", title: "Diabetes risk", text: "Whether a sugar test is a good idea.", tint: "bg-lavender-soft text-lavender" },
  { icon: "moon", title: "Sleep", text: "Hours, snoring and signs of sleep apnoea.", tint: "bg-lavender-soft text-night" },
  { icon: "mind", title: "Mood and stress", text: "A gentle check on low mood and worry.", tint: "bg-lavender-soft text-lavender" },
  { icon: "scale", title: "Body and blood pressure", text: "BMI, waist and blood pressure, in plain words.", tint: "bg-primary-soft text-primary" },
  { icon: "shield", title: "Check-ups you're due", text: "Screenings to book, based on your age and sex.", tint: "bg-primary-soft text-primary" },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 md:px-8">
      <header className="flex items-center justify-between gap-3 py-5">
        <Logo animate />
        <nav className="flex items-center gap-1" aria-label="Main">
          <Link href="/doctor" className="hidden rounded-full px-3 py-2 text-[15px] font-medium text-muted hover:text-ink md:inline-block">Get help</Link>
          <Link href="/home-tests" className="hidden rounded-full px-3 py-2 text-[15px] font-medium text-muted hover:text-ink md:inline-block">Lab tests</Link>
          <AccountLink />
        </nav>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="grid items-center gap-4 pt-6 pb-8 md:grid-cols-[1.05fr_1fr] md:gap-10 md:pt-10 md:pb-20">
        <div>
          <div className="mb-4 md:hidden"><MannequinHero compact /></div>
          <RotatingHeadline className="text-[40px] leading-[1.04] font-bold md:text-[64px]" />
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted md:text-lg">
            <span className="md:hidden">Your wellbeing score, heart age and more in 10 minutes. Free.</span>
            <span className="hidden md:inline">Answer a few quick questions and find out your wellbeing score, heart age, diabetes risk and more. No sign-up needed.</span>
          </p>
          <div className="mt-7 max-w-sm">
            <StartButton />
          </div>
          <p className="mt-4 hidden items-center gap-2 text-[13px] text-subtle md:flex">
            <Icon name="shield" size={16} strokeWidth={2} /> Built on WHO and other validated screening tools. Not a diagnosis.
          </p>
        </div>
        <div className="hidden md:block"><MannequinHero /></div>
      </section>

      {/* ---------------- Phone: four simple choices ---------------- */}
      <nav className="flex flex-col divide-y divide-line overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface md:hidden" aria-label="What would you like to do?">
        {[
          { href: "/doctor", icon: "stethoscope" as const, title: "Get help with a health concern", text: "We match you with the right doctor", tint: "bg-primary-soft text-primary" },
          { href: "/home-tests", icon: "flask" as const, title: "Lab tests", text: "Samples collected at home", tint: "bg-lavender-soft text-lavender" },
          { href: "/medication", icon: "box" as const, title: "Medication delivery", text: "Any medicine, even hard-to-find ones", tint: "bg-sun-soft text-check-text" },
          ...(features.familyCare ? [{ href: "/family", icon: "family" as const, title: "Care for parents in Nigeria", text: "For family living abroad", tint: "bg-coral-soft text-act-text" }] : []),
        ].map((x) => (
          <Link key={x.href} href={x.href} className="flex items-center gap-3.5 px-4 py-3.5 active:bg-surface-2">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${x.tint}`}><Icon name={x.icon} size={20} strokeWidth={2} /></span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold">{x.title}</span>
              <span className="block text-[13px] text-muted">{x.text}</span>
            </span>
            <Icon name="arrowRight" size={18} strokeWidth={2} className="text-subtle" />
          </Link>
        ))}
      </nav>
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-[12px] text-subtle md:hidden">
        <Icon name="shield" size={14} strokeWidth={2} /> Built on WHO screening tools. Private. Not a diagnosis.
      </p>

      {/* ---------------- Explore the body ---------------- */}
      <section className="py-12 md:py-16" aria-labelledby="explore">
        <Overline>What we check</Overline>
        <h2 id="explore" className="mt-2 max-w-xl text-3xl font-bold md:text-[40px] md:leading-tight">Tap the body to see what we look at</h2>
        <p className="mt-2 max-w-xl text-[16px] text-muted">Each part opens a full guide: what it means, how to improve it, and when to see a doctor.</p>
        <div className="mt-8"><BodyMap mode="explore" /></div>
      </section>

      <div className="hidden md:block">

      {/* ---------------- What you'll find out ---------------- */}
      <section className="py-12" aria-labelledby="find-out">
        <Overline>What you&apos;ll find out</Overline>
        <h2 id="find-out" className="mt-2 max-w-xl text-3xl font-bold md:text-[40px] md:leading-tight">Seven things worth knowing about your health</h2>
        <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {FINDINGS.map((f) => (
            <div key={f.title} className="flex gap-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${f.tint}`}>
                <Icon name={f.icon} size={22} strokeWidth={2} />
              </span>
              <div>
                <h3 className="text-[17px] font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-0.5 text-[15px] leading-snug text-muted">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="py-12" aria-labelledby="how">
        <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 md:p-10">
          <Overline>How it works</Overline>
          <h2 id="how" className="mt-2 text-3xl font-bold md:text-[40px]">Simple from start to finish</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ["Answer", "One question at a time, with tap-to-answer choices."],
              ["See your results", "Instantly, with a copy sent to your email."],
              ["Take the next step", "Talk to a doctor, book a lab test, or check again later."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4 md:flex-col md:gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-base font-bold text-primary">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-semibold">{t}</h3>
                  <p className="mt-0.5 text-[15px] text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- Services ---------------- */}
      <section className="py-12" aria-labelledby="services">
        <Overline>Care when you need it</Overline>
        <h2 id="services" className="mt-2 text-3xl font-bold md:text-[40px]">From results to real help</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href="/doctor" className="group flex flex-col rounded-[var(--radius-xl)] bg-ink p-6 text-white shadow-[var(--shadow-md)] transition-transform hover:-translate-y-0.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-white/10"><Icon name="stethoscope" size={22} strokeWidth={2} /></span>
            <h3 className="mt-5 text-2xl font-semibold">Get help with a health concern</h3>
            <p className="mt-1 text-[15px] text-white/70">Tell us what&apos;s going on and we&apos;ll match you with the right doctor, at a time that suits you.</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold">Get help now <Icon name="arrowRight" size={16} strokeWidth={2} /></span>
          </Link>
          <Link href="/home-tests" className="group flex flex-col rounded-[var(--radius-xl)] border border-line bg-surface p-6 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-lavender-soft text-lavender"><Icon name="flask" size={22} strokeWidth={2} /></span>
            <h3 className="mt-5 text-2xl font-semibold">Lab tests</h3>
            <p className="mt-1 text-[15px] text-muted">Full health checks, heart, diabetes, fertility, sexual health and more. Request on WhatsApp; samples collected at home.</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-primary">See tests <Icon name="arrowRight" size={16} strokeWidth={2} /></span>
          </Link>
          <Link href="/medication" className="group flex flex-col rounded-[var(--radius-xl)] border border-line bg-surface p-6 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-sun-soft text-check-text"><Icon name="box" size={22} strokeWidth={2} /></span>
            <h3 className="mt-5 text-2xl font-semibold">Medication delivery</h3>
            <p className="mt-1 text-[15px] text-muted">Any medicine, even rare or imported ones, sourced by our partners. Order on WhatsApp.</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-primary">See medicines <Icon name="arrowRight" size={16} strokeWidth={2} /></span>
          </Link>
        </div>
      </section>

      {/* ---------------- Family abroad ---------------- */}
{features.familyCare && (
      <section className="py-6" aria-labelledby="family">
        <Link href="/family" className="group flex flex-col gap-5 rounded-[var(--radius-xl)] border border-line bg-surface p-6 transition-shadow hover:shadow-[var(--shadow-md)] md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-sun-soft text-check-text"><Icon name="family" size={24} strokeWidth={2} /></span>
            <div>
              <h2 id="family" className="text-2xl font-bold">Living abroad? Care for your parents at home</h2>
              <p className="mt-1 max-w-xl text-[15px] text-muted">A named doctor, checks at home, medicines delivered and a monthly report, for your parents in Nigeria.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 font-semibold text-primary">Find out more <Icon name="arrowRight" size={18} strokeWidth={2} /></span>
        </Link>
      </section>
      )}

      {/* ---------------- Privacy + last CTA ---------------- */}
      </div>
      <section className="hidden py-12 md:block" aria-labelledby="private">
        <div className="flex flex-col items-start gap-6 rounded-[var(--radius-xl)] bg-primary-soft p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-xl">
            <h2 id="private" className="text-2xl font-bold md:text-3xl">Private by design</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Your answers stay on your phone until you ask for your results. We keep them under the Nigeria Data Protection Act, never sell them, and you can delete them at any time.{" "}
              <Link href="/privacy" className="font-medium text-ink underline underline-offset-2">Privacy notice</Link>
            </p>
          </div>
          <div className="w-full md:w-72"><StartButton compact /></div>
        </div>
      </section>
    </main>
  );
}
