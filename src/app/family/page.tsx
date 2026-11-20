export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { features, site } from "@/config/site";
import { Icon, type IconName } from "@/components/icons";
import { Logo, Overline } from "@/components/ui";
import { loadFx, publicPlansForGoal, type Fx, type PublicPlan } from "@/lib/care-plans";
import { supabaseConfigured } from "@/lib/supabase/server";
import { FamilyPlans, FamilyForm } from "./family-client";

export const metadata: Metadata = {
  title: "Care for your parents in Nigeria",
  description: "A named Nigerian doctor, regular checks at home, medicines delivered and a monthly report, for your parents in Nigeria, managed from abroad.",
};

const INCLUDED: { icon: IconName; title: string; text: string }[] = [
  { icon: "stethoscope", title: "A named doctor", text: "One Nigerian doctor who knows your parent, reviews them regularly and answers your questions." },
  { icon: "home", title: "Checks at home", text: "Blood pressure, sugar and lab samples taken at home, so your parent doesn't queue at a hospital." },
  { icon: "box", title: "Medicines delivered", text: "The right medicines, delivered every month, with reminders so doses aren't missed." },
  { icon: "clipboard", title: "A monthly family report", text: "Readings, visits, medicines and the doctor's notes, sent to you and anyone you add." },
  { icon: "chat", title: "Family video calls", text: "Talk to the doctor together with your parent, wherever you live." },
  { icon: "alert", title: "Help in an emergency", text: "On higher plans, one number to call: we arrange the ambulance and hospital and keep you updated." },
];

export default async function FamilyPage() {
  // Hidden until the next launch (NEXT_PUBLIC_FEATURE_FAMILY_CARE=true switches it on).
  if (!features.familyCare) notFound();
  let plans: PublicPlan[] = [];
  let offered = false;
  let fx: Fx = [];
  if (supabaseConfigured()) {
    try {
      [{ plans, offered }, fx] = await Promise.all([publicPlansForGoal("parent-care"), loadFx()]);
    } catch {
      /* show the page without plans */
    }
  }
  return (
    <main className="mx-auto w-full max-w-6xl px-5 md:px-8">
      <header className="flex items-center justify-between gap-3 py-5">
        <Logo />
        <a href="#enquire" className="rounded-full border border-line bg-surface px-4 py-2 text-[15px] font-medium hover:border-line-strong">Talk to us</a>
      </header>

      <section className="grid items-center gap-8 pt-4 pb-14 md:grid-cols-[1.1fr_1fr] md:pt-10">
        <div>
          <Overline>For Nigerians abroad</Overline>
          <h1 className="mt-3 text-[38px] leading-[1.03] font-bold md:text-[60px]">Care for your parents in Nigeria, <span className="text-primary">from wherever you are</span></h1>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted md:text-lg">
            A named Nigerian doctor, regular checks at home, medicines delivered, and a monthly report you can trust. You stay close, even from far away.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#enquire" className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary px-6 text-[17px] font-semibold text-white hover:bg-primary-hover">Tell us about your parent <Icon name="arrowRight" size={20} strokeWidth={2} /></a>
            <a href="#plans" className="inline-flex min-h-[50px] items-center justify-center rounded-[var(--radius-md)] border border-line-strong bg-surface px-5 font-semibold hover:bg-surface-2">See plans</a>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[400px]" aria-hidden="true">
          <div className="absolute -top-4 -right-2 h-24 w-24 rounded-full bg-sun/50" />
          <div className="relative rounded-[28px] border border-line bg-surface p-5 shadow-[var(--shadow-lg)]">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-subtle uppercase">Monthly report · Mum</p>
            <p className="mt-1 font-display text-xl font-semibold">Blood pressure is steady</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[["128/82", "Average BP"], ["2", "Home visits"], ["100%", "Doses taken"]].map(([v, l]) => (
                <div key={l} className="rounded-[14px] bg-surface-2 px-2 py-3">
                  <p className="font-display text-lg font-semibold tabular">{v}</p>
                  <p className="text-[11px] text-muted">{l}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-[14px] bg-primary-soft p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white"><Icon name="stethoscope" size={16} strokeWidth={2} /></span>
              <p className="text-[13px] leading-snug">&quot;Her readings are good on the new dose. Next review in 4 weeks.&quot; <span className="text-muted">— her doctor</span></p>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-subtle">An example report</p>
        </div>
      </section>

      <section className="py-12" aria-labelledby="why">
        <div className="rounded-[var(--radius-xl)] bg-ink p-6 text-white md:p-10">
          <h2 id="why" className="max-w-2xl text-2xl font-bold text-white md:text-4xl">Distance makes it hard to know how they really are</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              ["You hear about problems late", "Often only when it's already an emergency."],
              ["You rely on relatives", "Who are busy, and not health experts."],
              ["You pay for care you can't check", "With no clear picture of what was done."],
            ].map(([t, d]) => (
              <div key={t}>
                <p className="text-lg font-semibold">{t}</p>
                <p className="mt-1 text-[15px] text-white/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12" aria-labelledby="how">
        <Overline>How it works</Overline>
        <h2 id="how" className="mt-2 text-3xl font-bold md:text-[40px]">Four simple steps</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            ["Tell us about your parent", "Where they live, their health and what worries you."],
            ["We call you both", "We explain the plan to your parent and get their agreement."],
            ["A doctor's home assessment", "A full check, tests at home, and a plan for the year."],
            ["Care all year", "Visits, medicines and a report every month."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-4 md:flex-col md:gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display font-bold text-primary">{i + 1}</span>
              <div><h3 className="text-lg font-semibold">{t}</h3><p className="mt-0.5 text-[15px] text-muted">{d}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-12" aria-labelledby="included">
        <Overline>What&apos;s included</Overline>
        <h2 id="included" className="mt-2 text-3xl font-bold md:text-[40px]">Real care, not just a phone number</h2>
        <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map((f) => (
            <div key={f.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name={f.icon} size={22} strokeWidth={2} /></span>
              <div><h3 className="text-[17px] font-semibold">{f.title}</h3><p className="mt-0.5 text-[15px] text-muted">{f.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="plans" className="scroll-mt-6 py-12" aria-labelledby="plans-title">
        <Overline>Plans</Overline>
        <h2 id="plans-title" className="mt-2 text-3xl font-bold md:text-[40px]">Choose how much support they need</h2>
        <FamilyPlans plans={plans} fx={fx} offered={offered} />
      </section>

      <section className="py-12" aria-labelledby="trust">
        <div className="grid gap-6 rounded-[var(--radius-xl)] bg-primary-soft p-6 md:grid-cols-3 md:p-10">
          <div className="md:col-span-1"><h2 id="trust" className="text-2xl font-bold">Your parent stays in charge</h2></div>
          <div className="space-y-3 text-[15px] text-muted md:col-span-2">
            <p>We only start care, and only share your parent&apos;s health information with you, once your parent has agreed. That&apos;s the law under the Nigeria Data Protection Act, and it&apos;s the right thing to do.</p>
            <p>Every doctor is registered with the Medical and Dental Council of Nigeria. Tests go to accredited labs and medicines come from licensed pharmacies.</p>
          </div>
        </div>
      </section>

      <section className="py-12" aria-labelledby="faq">
        <h2 id="faq" className="text-3xl font-bold">Questions</h2>
        <div className="mt-6 divide-y divide-line rounded-[var(--radius-xl)] border border-line bg-surface">
          {[
            ["How do I pay from abroad?", "By card, yearly, quarterly or monthly. Plans are charged in naira; prices in your currency are a guide at today's rate, and your bank does the conversion."],
            ["Where do you cover?", "Tell us where your parent lives and we'll confirm whether we can visit them at home there."],
            ["What happens in an emergency?", `Call 112 first. On Premium and Concierge plans you also get one number to call, and we coordinate the hospital and keep the family updated.`],
            ["Can my brothers and sisters get the reports too?", "Yes. Add as many family members as your parent agrees to."],
            ["Can you look after both parents?", "Yes. Tell us in the form, and we'll offer a plan for both."],
          ].map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">{q}<span className="text-primary group-open:rotate-45 transition-transform" aria-hidden="true">+</span></summary>
              <p className="mt-2 text-[15px] text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="enquire" className="scroll-mt-6 py-12" aria-labelledby="enquire-title">
        <div className="mx-auto max-w-2xl">
          <Overline>Get started</Overline>
          <h2 id="enquire-title" className="mt-2 text-3xl font-bold md:text-[40px]">Tell us about your parent</h2>
          <p className="mt-2 text-[15px] text-muted">We&apos;ll reply within one working day by WhatsApp or email. Nothing is charged until you and your parent agree a plan.</p>
          <FamilyForm plans={plans.map((p) => p.name)} />
          <p className="mt-6 text-center text-sm text-muted">Living in Nigeria yourself? <Link href="/" className="font-medium text-primary hover:underline">Do the free {site.appName} check</Link></p>
        </div>
      </section>
    </main>
  );
}
