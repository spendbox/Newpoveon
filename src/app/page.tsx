import Link from "next/link";
import { site } from "@/config/site";
import { Icon, type IconName } from "@/components/icons";
import { Logo, Overline, Pill } from "@/components/ui";
import { StartButton } from "./start-button";

const FINDINGS: { icon: IconName; title: string; text: string; tint: string }[] = [
  { icon: "heart", title: "Heart age", text: "And your 10-year risk of heart attack or stroke.", tint: "bg-coral-soft text-act-text" },
  { icon: "drop", title: "Diabetes risk", text: "Whether a sugar test is a good idea.", tint: "bg-lavender-soft text-lavender" },
  { icon: "moon", title: "Sleep", text: "Hours, snoring and signs of sleep apnoea.", tint: "bg-lavender-soft text-night" },
  { icon: "sun", title: "Mood and stress", text: "A gentle check on low mood and worry.", tint: "bg-sun-soft text-check-text" },
  { icon: "scale", title: "Body and blood pressure", text: "BMI, waist and blood pressure, in plain words.", tint: "bg-primary-soft text-primary" },
  { icon: "shield", title: "Check-ups you're due", text: "Screenings to book, based on your age and sex.", tint: "bg-primary-soft text-primary" },
];

/** A preview of real results: modern, product-first, and a little playful. */
function HeroPreview() {
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[420px] md:h-[440px]" aria-hidden="true">
      <div className="absolute inset-x-6 top-6 bottom-6 rounded-[40px] bg-primary-soft" />
      <div className="absolute -top-2 right-2 h-24 w-24 rounded-full bg-sun/50" />
      <div className="absolute bottom-0 left-0 h-20 w-20 rounded-[28px] rotate-12 bg-coral/25" />

      <div className="float absolute top-10 left-1/2 w-[250px] -translate-x-1/2 rounded-[24px] bg-ink p-5 text-white shadow-[var(--shadow-lg)] md:top-14 md:w-[280px]">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-white/60 uppercase">Your heart age</p>
        <div className="mt-2 flex items-end gap-3">
          <span className="font-display text-6xl leading-none font-bold">38</span>
          <span className="mb-1.5 rounded-full bg-good-bg px-2 py-0.5 text-xs font-semibold text-good-text">4 years younger</span>
        </div>
        <svg className="mt-4 w-full" height="34" viewBox="0 0 240 34" fill="none" aria-hidden="true">
          <path d="M0 20h52l8-12 10 22 9-26 9 30 7-14h48l7-9 8 18 7-9h75" stroke="#FF6B4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-3 text-xs text-white/60">10-year risk 2.1% · WHO risk charts</p>
      </div>

      <div className="float-slow absolute bottom-16 left-0 w-[180px] rounded-[18px] border border-line bg-surface p-3.5 shadow-[var(--shadow-md)] md:bottom-20">
        <p className="text-xs font-medium text-muted">Diabetes risk</p>
        <p className="mt-0.5 font-display text-lg font-semibold">Low</p>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-good-bg px-2 py-0.5 text-[11px] font-semibold text-good-text">
          <Icon name="check" size={11} strokeWidth={3} /> Looking good
        </span>
      </div>

      <div className="float absolute right-0 bottom-6 w-[170px] rounded-[18px] border border-line bg-surface p-3.5 shadow-[var(--shadow-md)] md:bottom-10">
        <p className="text-xs font-medium text-muted">Sleep</p>
        <p className="mt-0.5 font-display text-lg font-semibold">6 h a night</p>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-check-bg px-2 py-0.5 text-[11px] font-semibold text-check-text">
          <Icon name="warning" size={11} strokeWidth={2.6} /> Worth checking
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 md:px-8">
      <header className="flex items-center justify-between gap-3 py-5">
        <Logo />
        <nav className="flex items-center gap-1" aria-label="Main">
          <Link href="/doctor" className="hidden rounded-full px-3 py-2 text-[15px] font-medium text-muted hover:text-ink sm:inline-block">Doctors</Link>
          <Link href="/home-tests" className="hidden rounded-full px-3 py-2 text-[15px] font-medium text-muted hover:text-ink sm:inline-block">Lab tests</Link>
          <Link href="/account" className="whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-[15px] font-medium hover:border-line-strong">Log in</Link>
        </nav>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="grid items-center gap-4 pt-4 pb-12 md:grid-cols-[1.05fr_1fr] md:gap-10 md:pt-10 md:pb-20">
        <div>
          <Pill><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Free · 10 minutes · Private</Pill>
          <h1 className="mt-4 text-[40px] leading-[1.02] font-bold md:text-[64px]">
            Let&apos;s check in <span className="text-primary">on you</span>
          </h1>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted md:text-lg">
            Answer a few quick questions and find out your heart age, diabetes risk, sleep and more. No sign-up needed.
          </p>
          <div className="mt-7 max-w-sm">
            <StartButton />
          </div>
          <p className="mt-4 flex items-center gap-2 text-[13px] text-subtle">
            <Icon name="shield" size={16} strokeWidth={2} /> Built on WHO and other validated screening tools. Not a diagnosis.
          </p>
        </div>
        <HeroPreview />
      </section>

      {/* ---------------- What you'll find out ---------------- */}
      <section className="py-12" aria-labelledby="find-out">
        <Overline>What you&apos;ll find out</Overline>
        <h2 id="find-out" className="mt-2 max-w-xl text-3xl font-bold md:text-[40px] md:leading-tight">Six things worth knowing about your health</h2>
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
            <h3 className="mt-5 text-2xl font-semibold">Talk to a doctor</h3>
            <p className="mt-1 text-[15px] text-white/70">A phone consult with a Nigerian physician, at a time that suits you. Share your results in one tap.</p>
            <p className="mt-auto pt-6 font-display text-2xl font-bold text-sun">₦{site.consultPriceNaira.toLocaleString("en-NG")}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold">Book a consult <Icon name="arrowRight" size={16} strokeWidth={2} /></span>
          </Link>
          <Link href="/home-tests" className="group flex flex-col rounded-[var(--radius-xl)] border border-line bg-surface p-6 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-lavender-soft text-lavender"><Icon name="flask" size={22} strokeWidth={2} /></span>
            <h3 className="mt-5 text-2xl font-semibold">Lab tests and packages</h3>
            <p className="mt-1 text-[15px] text-muted">Full health checks, heart, diabetes, fertility, sexual health and more. Samples collected at home.</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-primary">See packages <Icon name="arrowRight" size={16} strokeWidth={2} /></span>
          </Link>
          <Link href="/medication" className="group flex flex-col rounded-[var(--radius-xl)] border border-line bg-surface p-6 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-sun-soft text-check-text"><Icon name="box" size={22} strokeWidth={2} /></span>
            <h3 className="mt-5 text-2xl font-semibold">Medication delivery</h3>
            <p className="mt-1 text-[15px] text-muted">Your regular medicines, delivered. Prescription medicines only after a doctor consult.</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-primary">Request a delivery <Icon name="arrowRight" size={16} strokeWidth={2} /></span>
          </Link>
        </div>
      </section>

      {/* ---------------- Privacy + last CTA ---------------- */}
      <section className="py-12" aria-labelledby="private">
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
