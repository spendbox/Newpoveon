"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/components/icons";

/**
 * "Built on tools doctors trust": the organisations and screening tools behind each score, shown as
 * text wordmarks (not their official logos, which can't be used without permission and could suggest
 * an endorsement). Scrolls gently on its own; for reduced motion it sits still and can be swiped.
 * Tapping a card opens a short, plain-English explainer (a bottom sheet on phones).
 */
type Tool = {
  mark: string; full: string; use: string; tint: string;
  what: string; how: string[]; source: string;
  links: { href: string; label: string }[];
};

const TOOLS: Tool[] = [
  {
    mark: "WHO", full: "World Health Organization", use: "Heart risk, weight, activity, wellbeing", tint: "text-[#0F6CB6]",
    what: "The United Nations agency for health. Its guidelines are used by health services around the world, including in Nigeria.",
    how: [
      "Heart age and heart risk use the WHO 2019 heart risk charts for West Africa, which need no blood test.",
      "Weight uses the WHO adult BMI groups.",
      "Activity is checked against the WHO advice of 150 to 300 minutes of moderate activity a week.",
      "Wellbeing uses the WHO-5: five questions about the last two weeks, scored out of 100.",
    ],
    source: "WHO CVD Risk Chart Working Group, Lancet Glob Health 2019; WHO physical activity guidelines 2020; WHO-5 (1998).",
    links: [{ href: "/learn/heart", label: "Heart age" }, { href: "/learn/wellbeing", label: "Wellbeing" }, { href: "/learn/activity", label: "Activity" }],
  },
  {
    mark: "ISH", full: "International Society of Hypertension", use: "Blood pressure", tint: "text-[#B4233C]",
    what: "A global society of blood pressure experts. Its 2020 guidelines say what counts as normal, high-normal and high blood pressure.",
    how: [
      "We check your last reading against the ISH and WHO limits: below 130/85 is normal, and 140/90 or more is high.",
      "A reading of 180/110 or more is flagged straight away, and shown for free.",
    ],
    source: "Unger T, et al. ISH 2020 Global Hypertension Practice Guidelines; WHO hypertension guideline 2021.",
    links: [{ href: "/learn/bp", label: "Blood pressure" }],
  },
  {
    mark: "FINDRISC", full: "Finnish Diabetes Risk Score", use: "Diabetes risk", tint: "text-[#1E5AA8]",
    what: "A short questionnaire made in Finland to estimate your chance of getting type 2 diabetes in the next 10 years, without a blood test.",
    how: [
      "Eight questions: age, weight, waist, activity, fruit and vegetables, blood pressure medicine, past high sugar and family history.",
      "Scored from 0 to 26. The higher the score, the higher the risk.",
    ],
    source: "Lindström J, Tuomilehto J. Diabetes Care 2003;26:725–731.",
    links: [{ href: "/learn/diabetes", label: "Diabetes risk" }],
  },
  {
    mark: "PHQ-9", full: "Patient Health Questionnaire", use: "Mood", tint: "text-lavender",
    what: "Nine questions about how often low mood has bothered you in the last two weeks. One of the most widely used mood checks in the world.",
    how: [
      "We start with two questions (the PHQ-2). If either one suggests low mood, we ask the other seven.",
      "Scored from 0 to 27. It's a screen, not a diagnosis.",
    ],
    source: "Kroenke K, et al. J Gen Intern Med 2001;16:606–613; Med Care 2003;41:1284–1292.",
    links: [{ href: "/learn/mood", label: "Mood" }],
  },
  {
    mark: "GAD-7", full: "Generalised Anxiety Disorder scale", use: "Worry", tint: "text-[#6A4FB3]",
    what: "Seven questions about worry and feeling on edge over the last two weeks. Used by doctors worldwide to spot anxiety.",
    how: [
      "We start with two questions (the GAD-2). If either one suggests anxiety, we ask the other five.",
      "Scored from 0 to 21.",
    ],
    source: "Spitzer RL, et al. Arch Intern Med 2006;166:1092–1097.",
    links: [{ href: "/learn/anxiety", label: "Worry and anxiety" }],
  },
  {
    mark: "AUDIT-C", full: "Alcohol Use Disorders Identification Test", use: "Alcohol", tint: "text-[#B5651D]",
    what: "The short, three-question version of the WHO's alcohol test, about how often and how much you drink.",
    how: [
      "Scored from 0 to 12.",
      "A score of 4 or more for men, or 3 or more for women, is above safer limits.",
    ],
    source: "Bush K, et al. Arch Intern Med 1998;158:1789–1795.",
    links: [{ href: "/learn/alcohol", label: "Alcohol" }],
  },
  {
    mark: "STOP-Bang", full: "Sleep apnoea questionnaire", use: "Snoring and sleep apnoea", tint: "text-[#25527A]",
    what: "Eight yes-or-no questions, made in Toronto, that estimate the risk of sleep apnoea: when breathing keeps stopping during sleep.",
    how: [
      "We only ask it if you snore.",
      "It covers snoring, tiredness, stopped breathing, blood pressure, weight, age, neck size and sex, and gives a low, medium or high risk.",
    ],
    source: "Chung F, et al. Anesthesiology 2008;108:812–821; Chest 2016;149:631–638.",
    links: [{ href: "/learn/sleep", label: "Sleep" }],
  },
  {
    mark: "AASM", full: "American Academy of Sleep Medicine", use: "Sleep hours", tint: "text-[#2E3F8F]",
    what: "Sleep doctors who, with the Sleep Research Society, set out how much sleep adults need.",
    how: ["Adults need 7 or more hours a night, most nights. We check your usual sleep against this."],
    source: "Watson NF, et al. Sleep 2015;38:843–844.",
    links: [{ href: "/learn/sleep", label: "Sleep" }],
  },
  {
    mark: "PhenoAge", full: "Yale University study, 2018", use: "Biological age", tint: "text-[#00356B]",
    what: "A way to work out how old your body seems from nine routine blood tests. Scientists at Yale University made it by following the health of nearly 10,000 adults over many years.",
    how: [
      "We use it for the Biological Age Check: your nine blood results and your real age go in, and your biological age comes out.",
      "People whose result was older than their real age were more likely to get long-term illnesses, like heart disease and diabetes. Each extra year meant about a 9% higher risk.",
      "It's a guide, not an exact number: a difference of 1 or 2 years is about the same. It was tested on adults in the USA, not yet on large groups of Nigerians.",
    ],
    source: "Levine ME, et al. Aging 2018;10:573–591.",
    links: [{ href: "/home-tests#biological-age", label: "Biological Age Check" }],
  },
  {
    mark: "NICE", full: "National Institute for Health and Care Excellence", use: "Waist-to-height", tint: "text-[#4A2A6B]",
    what: "The UK body that writes health guidelines for doctors. It recommends checking your waist against your height.",
    how: ["Keep your waist to less than half your height. This spots risky belly fat that BMI alone can miss."],
    source: "NICE CG189; Ashwell M, et al. Obes Rev 2012;13:275–286.",
    links: [{ href: "/learn/body", label: "Weight and waist" }],
  },
];

function Card({ t, copy, onOpen }: { t: Tool; copy?: boolean; onOpen: () => void }) {
  return (
    <li aria-hidden={copy || undefined} className={copy ? "tt-copy" : undefined}>
      <button type="button" onClick={onOpen} tabIndex={copy ? -1 : undefined} aria-label={`About ${t.mark}: ${t.full}`}
        className="flex h-full w-[200px] flex-col rounded-[var(--radius-lg)] border border-line bg-surface px-4 py-3.5 text-left shadow-[var(--shadow-sm)] transition-transform hover:border-primary/40 active:scale-[0.97]">
        <span className={`block font-display text-[24px] leading-none font-extrabold tracking-tight whitespace-nowrap ${t.tint}`}>{t.mark}</span>
        <span className="mt-1.5 block line-clamp-2 min-h-[2.5em] text-[12px] leading-tight text-subtle">{t.full}</span>
        <span className="mt-2 block text-[13px] leading-snug font-medium text-ink">{t.use}</span>
        <span className="mt-auto flex items-center gap-1 pt-2 text-[12px] font-semibold text-primary">How we use it <Icon name="arrowRight" size={12} strokeWidth={2.6} /></span>
      </button>
    </li>
  );
}

function Explainer({ t, onClose }: { t: Tool; onClose: () => void }) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 sm:items-center sm:p-4" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="tt-title" onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-[28px] bg-surface shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-xl)]"
        initial={reduce ? { opacity: 0 } : { y: "100%" }} animate={reduce ? { opacity: 1 } : { y: 0 }} exit={reduce ? { opacity: 0 } : { y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}>
        <span className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3 px-6 pt-4 sm:pt-6">
          <div>
            <p className={`font-display text-[32px] leading-none font-extrabold tracking-tight ${t.tint}`}>{t.mark}</p>
            <h2 id="tt-title" className="mt-1.5 text-[15px] font-semibold text-muted">{t.full}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface hover:bg-surface-2">
            <Icon name="close" size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          <p className="text-[16px] leading-relaxed">{t.what}</p>
          <h3 className="mt-5 text-[13px] font-semibold tracking-[0.08em] text-primary uppercase">How Poveon uses it</h3>
          <div className="mt-2 space-y-2">
            {t.how.map((h) => (
              <p key={h} className="flex gap-3 rounded-[var(--radius-md)] bg-surface-2 px-3.5 py-3 text-[15px] leading-snug">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"><Icon name="check" size={12} strokeWidth={3} /></span>
                {h}
              </p>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {t.links.map((l) => (
              <Link key={l.href} href={l.href} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[14px] font-semibold whitespace-nowrap text-primary hover:bg-primary-soft">
                {l.label}{l.label.endsWith("Check") ? "" : " guide"} <Icon name="arrowRight" size={14} strokeWidth={2.4} />
              </Link>
            ))}
          </div>
          <p className="mt-5 text-[12px] leading-snug text-subtle">Source: {t.source}</p>
          <p className="mt-1 text-[12px] leading-snug text-subtle">Every result is an estimate, not a diagnosis.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function TrustedTools() {
  const [open, setOpen] = useState<Tool | null>(null);
  return (
    <section className="py-10" aria-labelledby="trusted">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-primary uppercase">The science behind it</p>
      <h2 id="trusted" className="mt-2 text-3xl font-bold md:text-[40px]">Built on tools doctors trust</h2>
      <p className="mt-2 max-w-xl text-[16px] text-muted">Every score comes from a published, validated screening tool or guideline. Tap one to learn more.</p>

      <div className="tt-viewport relative mt-6 -mx-5 overflow-hidden px-5 py-1 md:mx-0 md:px-0">
        <ul className={`tt-track flex w-max gap-3 ${open ? "tt-paused" : ""}`} aria-label="Screening tools and guidelines we use">
          {TOOLS.map((t) => <Card key={t.mark} t={t} onOpen={() => setOpen(t)} />)}
          {/* A second copy makes the scroll loop seamless; hidden from screen readers and the keyboard. */}
          {TOOLS.map((t) => <Card key={`${t.mark}-2`} t={t} copy onOpen={() => setOpen(t)} />)}
        </ul>
        <span className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-ground to-transparent" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-ground to-transparent" aria-hidden="true" />
      </div>

      <p className="mt-4 text-[12px] text-subtle">Names belong to their owners. Poveon is not affiliated with or endorsed by these organisations.</p>

      <AnimatePresence>{open && <Explainer key={open.mark} t={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  );
}
