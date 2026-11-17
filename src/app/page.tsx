import Link from "next/link";
import { site } from "@/config/site";
import { Icon, type IconName } from "@/components/icons";
import { Illustration, IllustrationCard } from "@/components/illustrations";
import { ButtonLink, Logo, Overline, Pill } from "@/components/ui";
import { StartButton } from "./start-button";

const FINDINGS: { icon: IconName; title: string; text: string; tint: string }[] = [
  { icon: "heart", title: "Heart age", text: "How old your heart is working, and your 10-year risk of a heart attack or stroke.", tint: "bg-coral-tint" },
  { icon: "drop", title: "Diabetes risk", text: "Your chance of type 2 diabetes, and whether a sugar test is a good idea.", tint: "bg-sun-tint" },
  { icon: "moon", title: "Sleep", text: "Whether you're sleeping enough, and signs of sleep apnoea.", tint: "bg-lavender-tint" },
  { icon: "sun", title: "Mood and worry", text: "A gentle check on low mood and anxiety.", tint: "bg-leaf-tint" },
  { icon: "gauge", title: "Body and blood pressure", text: "Your BMI, waist-to-height and blood pressure, in plain words.", tint: "bg-leaf-tint" },
  { icon: "shield", title: "Check-ups you're due", text: "Blood pressure, sugar, hepatitis B, genotype and women's screening.", tint: "bg-sun-tint" },
];

const STEPS: { n: string; title: string; text: string }[] = [
  { n: "1", title: "Answer friendly questions", text: "One at a time, with big picture answers. About 10 minutes. No sign-up." },
  { n: "2", title: "See your results", text: "Your heart age and scores straight away, with a copy sent to your email." },
  { n: "3", title: "Take the next step", text: "Talk to a doctor, order a home test, or simply check again later." },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6">
      <header className="flex items-center justify-between gap-3 pt-7">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Main">
          <Link href="/doctor" className="hidden rounded-full px-3 py-2 text-[15px] font-extrabold sm:inline-block hover:bg-surface">Talk to a doctor</Link>
          <Link href="/home-tests" className="hidden rounded-full px-3 py-2 text-[15px] font-extrabold md:inline-block hover:bg-surface">Home tests</Link>
          <Link href="/account" className="whitespace-nowrap rounded-full px-3 py-2 text-[15px] font-extrabold hover:bg-surface">Log in</Link>
          <span className="hidden rounded-full bg-surface px-3 py-1.5 text-[13px] font-bold text-muted lg:inline-block">Free · Private</span>
        </nav>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="grid items-center gap-6 pt-4 pb-10 md:grid-cols-2 md:gap-12 md:pt-12 md:pb-16">
        <div className="order-2 md:order-1">
          <Pill className="mb-4 md:hidden">Free · Private</Pill>
          <h1 className="text-[38px] leading-[1.02] md:text-6xl">Let&apos;s check in on you</h1>
          <p className="mt-3 max-w-md text-[17px] leading-relaxed text-muted md:text-xl">
            A few friendly questions, about 10 minutes. Find out your heart age and more.
          </p>
          <ul className="mt-5 grid max-w-md grid-cols-2 gap-2.5" aria-label="What you'll get">
            {[
              ["heart", "Heart age", "bg-coral-tint"],
              ["drop", "Diabetes risk", "bg-sun-tint"],
              ["moon", "Sleep", "bg-lavender-tint"],
              ["sun", "Mood", "bg-leaf-tint"],
            ].map(([icon, label, tint]) => (
              <li key={label} className="flex items-center gap-2.5 rounded-2xl bg-surface p-3">
                <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-[11px] ${tint}`}>
                  <Icon name={icon as IconName} size={18} strokeWidth={2.2} />
                </span>
                <span className="text-sm font-extrabold">{label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 max-w-md">
            <StartButton />
            <p className="mt-4 text-center text-[13px] font-semibold text-muted-soft md:text-left">
              Not a diagnosis. A doctor reviews anything worrying.
            </p>
          </div>
        </div>
        <div className="order-1 flex justify-center md:order-2">
          <Illustration name="welcome" className="h-[280px] w-[320px] md:h-[440px] md:w-[500px]" />
        </div>
      </section>

      {/* ---------------- What you'll find out ---------------- */}
      <section className="py-10" aria-labelledby="find-out">
        <Overline>What you&apos;ll find out</Overline>
        <h2 id="find-out" className="mt-1 text-3xl md:text-4xl">Your health, in plain words</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FINDINGS.map((f) => (
            <div key={f.title} className="flex gap-3.5 rounded-[var(--radius-md)] bg-surface p-4">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] ${f.tint}`}>
                <Icon name={f.icon} size={26} />
              </span>
              <div>
                <h3 className="text-xl">{f.title}</h3>
                <p className="mt-0.5 text-[15px] leading-snug text-muted">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] font-bold text-muted-soft">
          Based on trusted tools: WHO 2019 heart risk charts, FINDRISC, STOP-Bang, PHQ-9, GAD-7 and AUDIT-C. Every result is an estimate, not a diagnosis.
        </p>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="py-10" aria-labelledby="how">
        <Overline>How it works</Overline>
        <h2 id="how" className="mt-1 text-3xl md:text-4xl">Three easy steps</h2>
        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-[var(--radius-md)] bg-surface p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-[2.5px] border-ink bg-sun font-display text-xl font-extrabold">{s.n}</span>
              <h3 className="mt-3 text-xl">{s.title}</h3>
              <p className="mt-1 text-[15px] leading-snug text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------- Doctor ---------------- */}
      <section className="my-10 grid items-center gap-6 rounded-[var(--radius-lg)] bg-ink p-6 text-white md:grid-cols-2 md:p-10" aria-labelledby="doctor">
        <div>
          <p className="text-[13px] font-extrabold tracking-[0.08em] text-[#BFE3D6] uppercase">No login needed</p>
          <h2 id="doctor" className="mt-1 text-3xl text-white md:text-4xl">
            Talk to a doctor for <span className="text-sun">₦{site.consultPriceNaira.toLocaleString("en-NG")}</span>
          </h2>
          <p className="mt-2 max-w-md text-[17px] leading-relaxed text-[#DDEFE8]">
            Pick a time that suits you and a Nigerian physician will call you. Share your results with them in one tap so you don&apos;t have to repeat yourself.
          </p>
          <ButtonLink href="/doctor" icon="chat" className="mt-6">Book a doctor</ButtonLink>
        </div>
        <IllustrationCard name="doctor" className="md:h-[260px]" />
      </section>

      {/* ---------------- Services ---------------- */}
      <section className="py-10" aria-labelledby="services">
        <Overline>Our services</Overline>
        <h2 id="services" className="mt-1 text-3xl md:text-4xl">Tests and medicines, at your door</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-[var(--radius-lg)] bg-surface p-4">
            <IllustrationCard name="homeTest" />
            <h3 className="mt-4 text-2xl">Home tests</h3>
            <p className="mt-1 text-[15px] text-muted">Blood pressure, sugar, cholesterol, hepatitis B, genotype and more. We come to you at a time that suits you.</p>
            <ButtonLink href="/home-tests" variant="secondary" iconRight="arrowRight" className="mt-4 self-start">Order a home test</ButtonLink>
          </div>
          <div className="flex flex-col rounded-[var(--radius-lg)] bg-surface p-4">
            <IllustrationCard name="delivery" />
            <h3 className="mt-4 text-2xl">Medication delivery</h3>
            <p className="mt-1 text-[15px] text-muted">Get your regular medicines delivered. Prescription medicines are only supplied after a doctor consult.</p>
            <ButtonLink href="/medication" variant="secondary" iconRight="arrowRight" className="mt-4 self-start">Request a delivery</ButtonLink>
          </div>
        </div>
      </section>

      {/* ---------------- Privacy + last CTA ---------------- */}
      <section className="py-10 text-center" aria-labelledby="private">
        <h2 id="private" className="text-3xl md:text-4xl">Private by design</h2>
        <p className="mx-auto mt-2 max-w-xl text-[17px] text-muted">
          Your answers stay on your phone until you choose to get your results. We store them under the Nigeria Data Protection Act 2023, never sell them, and you can delete them at any time.{" "}
          <Link href="/privacy" className="font-extrabold underline">Read our privacy notice</Link>.
        </p>
        <div className="mx-auto mt-6 max-w-sm">
          <StartButton />
        </div>
      </section>
    </main>
  );
}
