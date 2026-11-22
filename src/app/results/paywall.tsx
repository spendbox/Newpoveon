"use client";
import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { Icon, type IconName } from "@/components/icons";
import { Button, Notice } from "@/components/ui";
import { SupportScreen } from "@/components/support-screen";
import { planHints } from "@/lib/plan/hints";
import { AREA_INFO } from "@/lib/plan/options";
import { memberPrice } from "@/lib/plan/perks";
import type { Answers } from "@/lib/questions";
import type { Results } from "@/lib/scoring/results";
import { saveSaved, type SavedScreening } from "@/lib/storage";
import type { Offer } from "./results-view";

const ngn = (n: number) => `₦${n.toLocaleString("en-NG")}`;

/** Count up to a number once (shown at the end straight away for reduced motion). */
function CountUp({ to, reduce }: { to: number; reduce: boolean }) {
  const [n, setN] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) return;
    const c = animate(0, to, { duration: 1.1, delay: 0.3, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [to, reduce]);
  return <>{n}</>;
}

type Perk = { icon: IconName; anim: string; tint: string; title: string; text: string };

/**
 * Before paying. Built on methods that are known to help people decide, without pressure tricks:
 * credit for the effort already made, a locked preview of their own results, what their plan will
 * focus on, the value laid out clearly, a small daily price, a refund promise, and the button always
 * in reach. Anything urgent is shown free.
 */
export function Paywall({ results, answers, saved, offer, confirming, onOffline }: {
  results: Results; answers: Answers; saved: SavedScreening; offer: Offer; confirming: boolean; onOffline: () => void;
}) {
  const reduce = !!useReducedMotion();
  const [support, setSupport] = useState(results.selfHarmFlag);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const good = results.cards.filter((c) => c.status === "good").length;
  const look = results.cards.length - good;
  const urgent = results.cards.filter((c) => c.id === "bp" && c.status === "act" && /180\/110/.test(c.summary));
  const answered = Object.keys(answers).length;
  const focus = planHints(answers, results).recs.slice(0, 2).map((r) => r.area);
  const perDay = Math.ceil(offer.price / (offer.months * 30));
  const member = offer.consult && offer.discount ? memberPrice(offer.consult, offer.discount) : null;

  const perks: Perk[] = [
    { icon: "gauge", anim: "pw-swing", tint: "bg-primary-soft text-primary", title: "Every score, in full", text: "Wellbeing, heart age, diabetes risk, blood pressure, sleep, mood and more." },
    { icon: "target", anim: "pw-pulse", tint: "bg-coral-soft text-act-text", title: `A ${offer.months}-month plan for you`, text: focus.length ? `Starting with ${focus.map((a) => AREA_INFO[a].title.toLowerCase()).join(" and ")}, made from your answers.` : "Made from your answers, around your day." },
    { icon: "check", anim: "pw-pop", tint: "bg-sun-soft text-check-text", title: "Daily check-ins that work", text: "Tick off each day. Targets step up as you keep going, and ease back when life gets busy." },
    ...(offer.perk ? [{ icon: "stethoscope" as IconName, anim: "pw-wiggle", tint: "bg-lavender-soft text-lavender", title: `${offer.perk} consultations`, text: member && offer.consult ? `Talk to a doctor for ${ngn(member)} instead of ${ngn(offer.consult)}, for ${offer.months} months.` : `On every doctor consultation for ${offer.months} months.` }] : []),
    { icon: "sparkle", anim: "pw-spin", tint: "bg-primary-soft text-primary", title: "How to improve each one", text: "Plain-English guides for every result, with what to do this week." },
    { icon: "shield", anim: "pw-float", tint: "bg-surface-2 text-ink", title: "Saved and emailed to you", text: "Kept privately in your account, so you can watch your scores move." },
  ];

  async function pay() {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/check/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ screeningId: saved.screeningId, ownerToken: saved.ownerToken }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (r?.ok && d.authorizationUrl) { window.location.assign(d.authorizationUrl); return; }
    if (r?.ok && d.paid) { saveSaved({ ...saved, paid: true }); window.location.reload(); return; }
    if (r?.status === 503) { onOffline(); return; }
    setBusy(false);
    setError(d.error ?? "We couldn't start the payment. Please try again.");
  }

  const rise = (i: number) => (reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.15 + i * 0.07, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const } });
  const cta = (
    <Button className="w-full" loading={busy || confirming} onClick={pay} iconRight="arrowRight">
      {confirming ? "Checking your payment…" : `Unlock for ${ngn(offer.price)}`}
    </Button>
  );

  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pt-6 pb-40">
      {support && <SupportScreen onClose={() => setSupport(false)} />}

      {/* 1. Credit for the effort, and the headline count */}
      <motion.section {...(reduce ? {} : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.6 } })}
        className="relative overflow-hidden rounded-[var(--radius-xl)] bg-ink px-6 pt-6 pb-7 text-center text-white shadow-[var(--shadow-lg)]">
        <span className="pw-glow absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
        <p className="relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-3 py-1 text-[13px] font-semibold"><Icon name="check" size={14} strokeWidth={3} /> Hard part done · {answered} answers</p>
        <h1 className="relative mt-4 font-body text-[13px] font-semibold tracking-[0.08em] text-white/65 uppercase">Your results are ready</h1>
        <p className="relative mt-2 font-display text-[44px] leading-none font-bold tabular"><CountUp to={good} reduce={reduce} /> <span className="text-[26px] font-semibold text-white/85">looking good</span></p>
        {look > 0 && <p className="relative mt-1 font-display text-[30px] font-bold text-sun tabular"><CountUp to={look} reduce={reduce} /> <span className="text-[22px] font-semibold">worth a closer look</span></p>}
      </motion.section>

      {urgent.map((c) => <div key={c.id} className="mt-4"><Notice tone="warn"><b>Please act on this now:</b> {c.summary}</Notice></div>)}

      {/* 2. A locked preview of their own results */}
      <section className="mt-6" aria-labelledby="pw-preview">
        <h2 id="pw-preview" className="text-xl font-semibold">Your results, waiting for you</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {results.cards.map((c, i) => (
            <motion.div key={c.id} {...rise(i)} className="relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-3.5">
              <p className="pr-5 text-[13px] font-medium text-muted">{c.topic}</p>
              <p className="mt-1 h-6 w-20 rounded-md bg-gradient-to-r from-line via-surface-2 to-line blur-[3px] pw-shimmer" aria-label="Locked" />
              <p className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.status === "good" ? "bg-good-bg text-good-text" : "bg-check-bg text-check-text"}`}>
                {c.status === "good" ? <Icon name="check" size={11} strokeWidth={3} /> : <Icon name="alert" size={11} strokeWidth={2.6} />}
                {c.status === "good" ? "Looking good" : "Needs a look"}
              </p>
              <span className="absolute top-3 right-3 text-subtle"><Icon name="lock" size={16} strokeWidth={2.2} /></span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. What they get, as cards with gently moving icons */}
      <section className="mt-8" aria-labelledby="pw-get">
        <h2 id="pw-get" className="text-xl font-semibold">Unlock everything for {ngn(offer.price)}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {perks.map((p, i) => (
            <motion.article key={p.title} {...rise(i + 2)} className="flex gap-3.5 rounded-[var(--radius-xl)] border border-line bg-surface p-4 shadow-[var(--shadow-sm)]">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${p.tint}`}><Icon name={p.icon} size={24} strokeWidth={2} className={p.anim} /></span>
              <span className="min-w-0">
                <span className="block font-semibold leading-snug">{p.title}</span>
                <span className="mt-0.5 block text-[14px] leading-snug text-muted">{p.text}</span>
              </span>
            </motion.article>
          ))}
        </div>
      </section>

      {/* 4. The price, made easy to say yes to */}
      <motion.section {...rise(9)} className="mt-8 overflow-hidden rounded-[var(--radius-xl)] border-2 border-primary bg-surface" aria-labelledby="pw-price">
        <div className="bg-primary px-5 py-2.5 text-center text-[13px] font-semibold text-white">One payment · {offer.months} months of support · nothing renews automatically</div>
        <div className="p-5 text-center">
          <p id="pw-price" className="font-display text-[44px] leading-none font-bold">{ngn(offer.price)}</p>
          <p className="mt-1.5 text-[15px] text-muted">That&apos;s less than <b className="text-ink">{ngn(perDay)} a day</b></p>
          {error && <div className="mt-4 text-left"><Notice tone="warn">{error}</Notice></div>}
          <div className="mt-5">{cta}</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-[12px] font-medium text-muted">
            <span className="flex flex-col items-center gap-1"><Icon name="shield" size={18} strokeWidth={2} className="text-primary" />Paystack secure</span>
            <span className="flex flex-col items-center gap-1"><Icon name="arrowLeft" size={18} strokeWidth={2} className="text-primary" />7-day refund</span>
            <span className="flex flex-col items-center gap-1"><Icon name="heart" size={18} strokeWidth={2} className="text-primary" />WHO-based tools</span>
          </div>
        </div>
      </motion.section>

      <p className="mt-5 text-center text-xs text-subtle">Every result is an estimate, not a diagnosis. If you feel unwell, talk to a doctor. In an emergency call 112.</p>

      {/* 5. The button stays in reach on phones */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ground/95 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <div className="mx-auto max-w-[520px]">{cta}</div>
      </div>
    </div>
  );
}
