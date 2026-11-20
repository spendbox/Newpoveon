"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { isComplete } from "@/lib/questions";
import { computeResults, STATUS_LABEL, type ResultCard } from "@/lib/scoring/results";
import { loadProgress } from "@/lib/storage";

const TONE = { good: "bg-good-bg text-good-text", check: "bg-check-bg text-check-text", act: "bg-act-bg text-act-text" } as const;

/** Shows this person's own result for the topic, read from their phone only (never from the URL). */
export function YourResult({ slug }: { slug: ResultCard["id"] }) {
  const [card, setCard] = useState<ResultCard | null | undefined>(undefined);
  useEffect(() => {
    const p = loadProgress();
    const c = p && isComplete(p.answers) ? computeResults(p.answers).cards.find((x) => x.id === slug) ?? null : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read local storage once on the phone
    setCard(c);
  }, [slug]);
  if (card === undefined) return <div className="h-[118px] animate-pulse rounded-[var(--radius-xl)] bg-surface-2" />;
  if (!card) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-dashed border-line-strong bg-surface p-5">
        <p className="font-semibold">See your own result</p>
        <p className="mt-1 text-[15px] text-muted">Take the free 10-minute check and your result for this will show here.</p>
        <Link href="/check" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Start my check →</Link>
      </div>
    );
  }
  return (
    <div className={`rounded-[var(--radius-xl)] p-5 ${TONE[card.status]}`}>
      <p className="text-[13px] font-semibold tracking-[0.06em] uppercase opacity-80">Your latest result</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-3 font-display text-3xl font-bold">{card.value} <span className="font-body text-base font-semibold">{STATUS_LABEL[card.status]}</span></p>
      <p className="mt-1.5 text-[15px] text-ink/80">{card.summary}</p>
      <p className="mt-2 text-xs opacity-75">{card.basis} An estimate, not a diagnosis.</p>
    </div>
  );
}
