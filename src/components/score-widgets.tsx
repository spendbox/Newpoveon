import Link from "next/link";
import type { ReactNode } from "react";
import type { WellbeingResult } from "@/lib/scoring/results";
import { Icon, type IconName } from "./icons";

const BAND_TEXT = { good: "Feeling good", low: "Lower than it should be", "very low": "Very low" } as const;
const BAND_NOTE = {
  good: "You've felt well most of the time over the last two weeks.",
  low: "Small changes help, and talking to someone can too.",
  "very low": "Please talk to a doctor. Feeling better is very possible.",
} as const;
const RING = { good: "var(--color-primary)", low: "var(--color-sun)", "very low": "var(--color-coral)" } as const;

/** A 0–100 ring that draws itself in (reduced motion: shown complete). */
export function ScoreRing({ score, color, size = 148, track = "rgb(255 255 255 / .12)", children }: { score: number; color: string; size?: number; track?: string; children?: ReactNode }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" stroke={track} strokeWidth="10" />
        <circle className="hc-ring" pathLength={100} cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" style={{ ["--off" as string]: 100 - Math.max(1, Math.min(100, score)), ["--d" as string]: ".3s" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** The headline wellbeing card used on results and the dashboard. */
export function WellbeingHero({ w, date, children }: { w: WellbeingResult; date?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-xl)] bg-ink p-6 text-white shadow-[var(--shadow-lg)] md:p-8" aria-labelledby="wb-title">
      <span className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/30 blur-2xl" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <ScoreRing score={w.score} color={RING[w.band]}>
          <span className="font-display text-[44px] leading-none font-bold tabular">{w.score}</span>
          <span className="mt-1 text-xs font-semibold text-white/60">out of 100</span>
        </ScoreRing>
        <div className="flex-1">
          <h2 id="wb-title" className="font-body text-[13px] font-semibold tracking-[0.08em] text-white/65 uppercase">Your wellbeing score{date ? ` · ${date}` : ""}</h2>
          <p className="mt-1 font-display text-[30px] leading-tight font-semibold text-white">{BAND_TEXT[w.band]}</p>
          <p className="mt-1 text-[15px] text-white/75">{BAND_NOTE[w.band]}</p>
          <p className="mt-2 text-xs text-white/55">WHO-5 Well-Being Index, last two weeks. Not a diagnosis.</p>
          <Link href="/learn/wellbeing" className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15">
            How to raise it <Icon name="arrowRight" size={16} strokeWidth={2} />
          </Link>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Small linked tile for a key score. */
export function ScoreTile({ href, icon, label, value, note, tone = "neutral" }: { href: string; icon: IconName; label: string; value: string; note?: string; tone?: "good" | "check" | "act" | "neutral" }) {
  const dot = { good: "bg-primary", check: "bg-sun", act: "bg-coral", neutral: "bg-line-strong" }[tone];
  return (
    <Link href={href} className="group flex flex-col rounded-[var(--radius-xl)] border border-line bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-md)]">
      <span className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name={icon} size={18} strokeWidth={2} /></span>
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
      </span>
      <span className="mt-3 text-[13px] font-medium text-muted">{label}</span>
      <span className="font-display text-[22px] leading-tight font-bold">{value}</span>
      {note && <span className="mt-0.5 text-[13px] text-muted">{note}</span>}
      <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[13px] font-semibold text-primary">Learn more <Icon name="arrowRight" size={13} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" /></span>
    </Link>
  );
}
