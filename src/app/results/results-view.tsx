"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { EXTENDED_MIN_AGE } from "@/config/site";
import { CONSENT_TEXT } from "@/lib/consent";
import { Icon } from "@/components/icons";
import { IllustrationCard } from "@/components/illustrations";
import { Button, ButtonLink, Field, inputCls, Notice, ResultCard, StatusLabel } from "@/components/ui";
import { SupportScreen } from "@/components/support-screen";
import { BodyMap } from "@/components/body-map";
import { WellbeingHero } from "@/components/score-widgets";
import { ShareSection } from "./share-section";
import { Steps } from "@/components/steps";
import { isComplete } from "@/lib/questions";
import { computeResults, displayValue, type Results } from "@/lib/scoring/results";
import { loadPrefill, loadProgress, loadSaved, saveSaved, type Progress, type SavedScreening } from "@/lib/storage";

export function ResultsView() {
  const [progress, setProgress] = useState<Progress | null | undefined>(undefined);
  const [saved, setSaved] = useState<SavedScreening | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const p = loadProgress();
    const s = loadSaved();
    /* eslint-disable react-hooks/set-state-in-effect -- reading browser storage after mount */
    setProgress(p);
    setSaved(s);
    if (p && s && s.savedAt >= p.startedAt) setUnlocked(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const results = useMemo(() => (progress && isComplete(progress.answers) ? computeResults(progress.answers) : null), [progress]);

  if (progress === undefined) return <div className="min-h-[70vh]" aria-busy="true" />;
  if (!progress || !results) {
    return (
      <div className="mx-auto w-full max-w-[430px] px-6 pt-10">
        <IllustrationCard name="checklist" />
        <h1 className="mt-5 text-[27px]">Let&apos;s finish your check first</h1>
        <p className="mt-2 text-muted">Answer the questions and your results will appear here.</p>
        <ButtonLink href="/check" className="mt-6 w-full" iconRight="arrowRight">{progress ? "Carry on" : "Let's start"}</ButtonLink>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <EmailGate
        progress={progress}
        onDone={(s) => {
          if (s) {
            saveSaved(s);
            setSaved(s);
          }
          setUnlocked(true);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }
  return <Reveal results={results} saved={saved} />;
}

/* ------------------------------------------------------------------ Email + consent */

function EmailGate({ progress, onDone }: { progress: Progress; onDone: (s: SavedScreening | null) => void }) {
  const prior = typeof window !== "undefined" ? loadSaved() : null;
  const pre = typeof window !== "undefined" ? loadPrefill() : null;
  const [email, setEmail] = useState(pre?.email ?? prior?.email ?? "");
  const [phone, setPhone] = useState(pre?.phone ?? prior?.phone ?? "");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  async function submit() {
    if (!emailOk || !consent) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() || null, consent: true, answers: progress.answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.screeningId) {
        onDone({ screeningId: data.screeningId, ownerToken: data.ownerToken, email: email.trim(), phone: phone.trim() || undefined, savedAt: new Date().toISOString() });
      } else if (res.status === 503) {
        // Backend not connected yet (e.g. a preview): still show results, nothing stored.
        onDone(null);
      } else {
        setError(data.error || "We couldn't save your results just now. You can still see them.");
        setBusy(false);
      }
    } catch {
      setError("You seem to be offline. You can still see your results, and we'll email them next time.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[460px] px-5 pt-6">
      <IllustrationCard name="checklist" compact />
      <h1 className="mt-5 text-[26px] leading-[1.15] font-semibold">All done. Where should we send your results?</h1>
      <p className="mt-2 text-[15px] text-muted">We&apos;ll show them on the next screen and email you a copy to keep.</p>
      <Steps
        className="mt-5"
        busy={busy}
        error={error}
        submitLabel="Show my results"
        onSubmit={submit}
        steps={[
          {
            key: "email", title: "Your email", valid: emailOk,
            content: <Field id="email" label="Email address"><input id="email" type="email" autoComplete="email" autoFocus className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={email !== "" && !emailOk} /></Field>,
          },
          {
            key: "phone", title: "Phone or WhatsApp (optional)", hint: "Only used if you ask us to contact you. You can skip this.", valid: true,
            content: <Field id="phone" label="Number"><input id="phone" type="tel" autoComplete="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" /></Field>,
          },
          {
            key: "consent", title: "Your privacy", valid: consent,
            content: (
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-[#136F58]" />
                <span className="text-sm leading-5">
                  {CONSENT_TEXT}{" "}
                  <Link href="/privacy" target="_blank" className="underline">Privacy notice</Link>
                </span>
              </label>
            ),
          },
        ]}
      />
      {error && <Button variant="secondary" className="mt-3 w-full" onClick={() => onDone(null)}>Just show my results</Button>}
    </div>
  );
}

/* ------------------------------------------------------------------ The reveal */

function Reveal({ results, saved }: { results: Results; saved: SavedScreening | null }) {
  const reduce = useReducedMotion();
  const [support, setSupport] = useState(results.selfHarmFlag);
  const heart = results.heart;
  const target = heart ? heart.heartAge.value : 0;
  const [n, setN] = useState(reduce || !heart ? target : Math.max(18, target - 20));

  useEffect(() => {
    if (reduce || !heart) return;
    const c = animate(Math.max(18, target - 20), target, { duration: 1.4, delay: 0.5, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [reduce, heart, target]);

  const diff = heart && heart.heartAge.kind === "exact" ? heart.heartAge.value - results.age : 0;
  const testCard = results.cards.find((c) => c.next.kind === "test");
  const cardDelay = (i: number) => (reduce ? 0 : 1.6 + i * 0.15);
  const counts = { good: 0, check: 0, act: 0 };
  results.cards.forEach((c) => counts[c.status]++);

  return (
    <div className="mx-auto w-full max-w-[460px] px-5 pt-5 md:max-w-3xl">
      {support && <SupportScreen onClose={() => setSupport(false)} />}
      <div className="flex h-11 items-center justify-between">
        <Link href="/check" aria-label="Change my answers" className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium hover:bg-surface-2">
          <Icon name="edit" size={16} strokeWidth={2} /> Edit
        </Link>
        <span className="font-display text-xl font-semibold">Your results</span>
        <span className="w-[68px]" />
      </div>

      {/* Headline: wellbeing (WHO-5), valid at every age */}
      {results.wellbeing && <div className="mt-4"><WellbeingHero w={results.wellbeing} /></div>}

      {/* Hero: heart age */}
      <motion.section
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative mt-4 flex flex-col items-center overflow-hidden rounded-[var(--radius-xl)] bg-ink px-5 pt-6 pb-6 text-white shadow-[var(--shadow-lg)]"
        aria-labelledby="heart-title"
      >
        {!reduce && (
          <>
            <span className="drift absolute top-[120px] left-[34px] h-2.5 w-2.5 rounded-[3px] bg-sun" />
            <span className="drift absolute top-[90px] right-[40px] h-2 w-2 rounded-full bg-lavender [animation-delay:.8s]" />
            <span className="drift absolute top-[60px] left-[70px] h-[7px] w-[7px] rounded-full bg-[#2FB67C] [animation-delay:1.5s]" />
            <span className="drift absolute top-[150px] right-[66px] h-[9px] w-[9px] rounded-[3px] bg-coral [animation-delay:.4s]" />
          </>
        )}
        {heart ? (
          <>
            <h1 id="heart-title" className="font-body text-[13px] font-semibold tracking-[0.08em] text-white/65 uppercase">Your heart age</h1>
            <div className="relative mt-2 h-[134px] w-[150px]">
              <div className="absolute top-[18px] left-[25px] h-[100px] w-[100px]">
                <div className="ring" />
                <div className="ring ring2" />
              </div>
              <div className="beat-loop absolute inset-0">
                <svg width="150" height="134" viewBox="0 0 150 134" aria-hidden="true"><path d="M75 128 C26 96 6 70 12 44 C18 18 50 8 75 34 C100 8 132 18 138 44 C144 70 124 96 75 128 Z" fill="#FF7A59" /></svg>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pb-2.5 font-display text-[54px] font-bold text-ink tabular" aria-live="polite">
                {heart.heartAge.kind === "below" ? "<" : heart.heartAge.kind === "above" ? ">" : ""}
                {n}
              </div>
            </div>
            <p className="mt-2.5 text-center text-base leading-snug font-medium">
              {heart.heartAge.kind === "below" ? (
                <>You&apos;re {results.age}, and your heart is working <span className="text-sun">younger than {heart.heartAge.value}</span>. Lovely.</>
              ) : diff > 0 ? (
                <>You&apos;re {results.age}, but your heart is working like it&apos;s <span className="text-sun">{diff} {diff === 1 ? "year" : "years"} older</span>. The good news: this can come down.</>
              ) : diff < 0 ? (
                <>You&apos;re {results.age}, and your heart is working like it&apos;s <span className="text-sun">{-diff} {diff === -1 ? "year" : "years"} younger</span>. Keep it up!</>
              ) : (
                <>You&apos;re {results.age}, and your heart is working <span className="text-sun">right on track</span>.</>
              )}
            </p>
            <p className="mt-3 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">10-year heart attack or stroke risk: {heart.riskPercent}%</p>
            {heart.earlyEstimate ? (
              <p className="mt-2 text-center text-xs font-medium text-white/65">
                <span className="mr-1 rounded-full bg-sun px-2 py-0.5 text-ink">Early estimate</span>
                The WHO risk charts were tested on people aged 40 and over, so treat this as a rough guide. Not a diagnosis.
              </p>
            ) : (
              <p className="mt-2 text-center text-xs font-medium text-white/65">Estimate based on WHO 2019 risk charts. Not a diagnosis.</p>
            )}
          </>
        ) : (
          <>
            <h1 id="heart-title" className="font-body text-[13px] font-semibold tracking-[0.08em] text-white/65 uppercase">Your results are ready</h1>
            <p className="mt-3 text-center font-display text-[40px] leading-[1.05] font-semibold">
              {counts.good} looking good
              {counts.check + counts.act > 0 && <span className="block text-[28px] text-sun">{counts.check + counts.act} to look at</span>}
            </p>
            {results.age < EXTENDED_MIN_AGE && !results.cards.some((c) => c.id === "heart") ? (
              <div className="mt-4 flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-lg)] bg-white/10 p-4 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/90"><Icon name="heart" size={20} strokeWidth={2.2} /></span>
                <div>
                  <p className="font-semibold">Heart age: not calculated</p>
                  <p className="mt-0.5 text-[14px] leading-snug text-white/75">Heart age starts at {EXTENDED_MIN_AGE}. The WHO heart model wasn&apos;t built for people under {EXTENDED_MIN_AGE}, so any number would be a guess. Your other results below still count.</p>
                </div>
              </div>
            ) : (
              results.heartNote && <p className="mt-3 text-center text-[15px] leading-snug font-medium">{results.heartNote}</p>
            )}
            {results.cards.find((c) => c.id === "heart")?.next.kind === "test" && (
              <ButtonLink href="/home-tests?test=bp-check" className="mt-4" icon="home">Book a BP check</ButtonLink>
            )}
          </>
        )}
      </motion.section>

      {/* Compact grid of cards */}
      <section className="mt-3.5" aria-label="Summary">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {results.cards.map((c, i) => (
            <motion.a
              href={`#card-${c.id}`}
              key={c.id}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: cardDelay(i), duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex flex-col items-start gap-1.5 rounded-[var(--radius-lg)] border border-line bg-surface px-3.5 py-3 transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              <StatusLabel status={c.status} />
              <span className="text-[13px] text-muted">{c.topic}</span>
              <span className="font-display text-[18px] leading-[22px] font-semibold">{displayValue(c)}</span>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Body map */}
      <section className="mt-8 rounded-[var(--radius-xl)] border border-line bg-surface p-5 md:p-8" aria-labelledby="bodymap">
        <h2 id="bodymap" className="text-2xl font-semibold">Your body map</h2>
        <p className="mt-1 text-[15px] text-muted">Tap a point to see your result there and how to improve it.</p>
        <div className="mt-6">
          <BodyMap mode="results"
            results={Object.fromEntries(results.cards.map((c) => [c.id, { status: c.status, value: displayValue(c), summary: c.summary }]))} />
        </div>
      </section>

      {/* Main actions */}
      <motion.section initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: cardDelay(results.cards.length) }} className="mt-6 flex flex-col gap-3.5">
        <ButtonLink href="/doctor?type=results-review" icon="stethoscope">Get help from a doctor</ButtonLink>
        {testCard && testCard.next.kind === "test" && (
          <ButtonLink href={`/home-tests?test=${testCard.next.testCode}`} variant="secondary" icon="home">{testCard.next.label}</ButtonLink>
        )}
        {saved ? (
          <Notice tone="good">We&apos;ve emailed a copy to {saved.email}.</Notice>
        ) : (
          <Notice>Your results weren&apos;t saved this time, so no email was sent.</Notice>
        )}
      </motion.section>

      {/* Details */}
      <section className="mt-8" aria-labelledby="details">
        <h2 id="details" className="text-2xl font-semibold">Your results in detail</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {results.cards.map((c) => (
            <div key={c.id} id={`card-${c.id}`} className="scroll-mt-4">
              <ResultCard card={c} />
            </div>
          ))}
        </div>
      </section>

      {/* Prevention checklist */}
      <section className="mt-8" aria-labelledby="due">
        <h2 id="due" className="text-2xl font-semibold">Check-ups you&apos;re due for</h2>
        <p className="mt-1 text-sm font-medium text-subtle">Based on your age and sex. No score, just reminders.</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {results.reminders.map((r) => (
            <li key={r.id} className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4">
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${r.done ? "bg-primary text-white" : "border border-line-strong"}`}>
                {r.done ? <Icon name="check" size={16} strokeWidth={3.2} /> : <span className="sr-only">Not done</span>}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{r.title} {r.done && <span className="text-sm text-good-text">· Done</span>}</p>
                <p className="text-sm leading-5 text-muted">{r.detail}</p>
                <p className="text-xs font-medium text-subtle">Source: {r.source}</p>
                {!r.done && r.testCode && (
                  <Link href={`/home-tests?test=${r.testCode}`} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Arrange it at home <Icon name="arrowRight" size={14} /></Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ShareSection results={results} saved={saved} />

      <section className="mt-8 rounded-[var(--radius-xl)] bg-primary-soft p-5">
        <h2 className="text-2xl font-semibold">Keep track over time</h2>
        <p className="mt-1 text-[15px] text-muted">Create a free account to save your profile, update your answers and see how your scores change.</p>
        <ButtonLink href="/account" variant="secondary" icon="user" className="mt-4 w-full">Save to my account</ButtonLink>
      </section>

      <p className="mt-8 text-center text-xs font-medium text-subtle">
        Every result is an estimate, not a diagnosis. Each card names the tool it&apos;s based on. If you feel unwell, talk to a doctor.
      </p>
    </div>
  );
}
