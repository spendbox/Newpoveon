"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { LEARN, LEARN_ORDER, type BodyArea, type LearnSlug } from "@/content/learn";
import { STATUS_LABEL, type Status } from "@/lib/scoring/results";
import { Icon } from "./icons";
import { AREA_POINTS } from "@/content/body-points";
import { Mannequin } from "./mannequin";

const DOT: Record<Status, string> = { good: "bg-primary", check: "bg-sun", act: "bg-coral" };
const RANK: Record<Status, number> = { good: 0, check: 1, act: 2 };
const TEXT: Record<Status, string> = { good: "text-good-text", check: "text-check-text", act: "text-act-text" };

export type AreaResults = Partial<Record<LearnSlug, { status: Status; value: string; summary?: string }>>;

const topicsFor = (area: BodyArea) => LEARN_ORDER.filter((s) => LEARN[s].area === area);
const AREAS = Object.keys(AREA_POINTS) as BodyArea[];

/**
 * Interactive body map. "explore": tap a point to see what we check there.
 * "results": points are coloured by your results (with the status word in the panel, never colour alone).
 */
export function BodyMap({ mode, results, initial }: { mode: "explore" | "results"; results?: AreaResults; initial?: BodyArea }) {
  const shown = mode === "results" ? AREAS.filter((a) => topicsFor(a).some((s) => results?.[s])) : AREAS;
  const worst = (a: BodyArea): Status | null => {
    const st = topicsFor(a).map((s) => results?.[s]?.status).filter(Boolean) as Status[];
    return st.length ? st.reduce((m, s) => (RANK[s] > RANK[m] ? s : m), "good" as Status) : null;
  };
  // Results: open on the area that most needs attention.
  const start = initial ?? (mode === "results" ? [...shown].sort((x, y) => RANK[worst(y) ?? "good"] - RANK[worst(x) ?? "good"])[0] : "heart");
  const [sel, setSel] = useState<BodyArea>(start && shown.includes(start) ? start : shown[0] ?? "heart");
  const panel = useRef<HTMLDivElement>(null);
  /** Tapping the body on a phone brings the explanation into view. */
  const pick = (a: BodyArea, fromBody: boolean) => {
    setSel(a);
    if (fromBody && typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  return (
    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,340px)_1fr] md:gap-10">
      <div className="relative mx-auto w-full max-w-[300px]">
        <Mannequin highlight={sel} className="h-auto w-full" />
        {shown.map((a) => {
          const p = AREA_POINTS[a];
          const st = mode === "results" ? worst(a) : null;
          const active = a === sel;
          return (
            <button
              key={a} type="button" onClick={() => pick(a, true)} aria-pressed={active}
              aria-label={`${p.label}${st ? `: ${STATUS_LABEL[st]}` : ""}`}
              className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
              style={{ left: `${(p.x / 300) * 100}%`, top: `${(p.y / 560) * 100}%` }}
            >
              <span className={`absolute h-7 w-7 rounded-full ${st ? DOT[st] : "bg-primary"} opacity-25 ${active ? "animate-ping" : ""}`} />
              <span className={`relative h-4 w-4 rounded-full border-[3px] border-surface shadow-[var(--shadow-md)] transition-transform ${st ? DOT[st] : "bg-primary"} ${active ? "scale-125" : ""}`} />
            </button>
          );
        })}
      </div>

      <div ref={panel} aria-live="polite" className="scroll-mt-4">
        <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">{AREA_POINTS[sel].label}</p>
        <ul className="mt-3 flex flex-col gap-3">
          {topicsFor(sel).map((s) => {
            const t = LEARN[s];
            const r = results?.[s];
            if (mode === "results" && !r) return null;
            return (
              <li key={s}>
                <Link href={`/learn/${s}`} className="group flex items-start gap-4 rounded-[var(--radius-lg)] border border-line bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-md)]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name={t.icon} size={22} strokeWidth={2} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold">{t.title}</span>
                    {r ? (
                      <>
                        <span className="mt-1 flex flex-wrap items-baseline gap-x-2">
                          <span className="font-display text-2xl font-bold">{r.value}</span>
                          <span className={`text-sm font-semibold ${TEXT[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                        </span>
                        {r.summary && <span className="mt-1 block text-[15px] leading-snug text-ink/80">{r.summary}</span>}
                      </>
                    ) : (
                      <span className="mt-0.5 block text-[15px] text-muted">{t.tagline}</span>
                    )}
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">How to improve it <Icon name="arrowRight" size={14} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" /></span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Body areas">
          {shown.map((a) => (
            <button key={a} type="button" onClick={() => pick(a, false)} aria-pressed={a === sel}
              className={`min-h-[36px] rounded-full border px-3 text-[13px] font-medium transition-colors ${a === sel ? "border-ink bg-ink text-white" : "border-line bg-surface text-muted hover:text-ink"}`}>
              {AREA_POINTS[a].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
