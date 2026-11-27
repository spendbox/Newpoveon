/**
 * Visitors and drop-off: pure counting for Admin → Visitors and drop-off. Everything here is
 * anonymous: page views, and how far each health check attempt got. No answers.
 */
import { QUESTIONS } from "./questions";
import { SOURCE_LABELS } from "./track-shared";

export type ViewRow = { path: string; visitor: string; source: string; device: string; created_at: string };
export type SessionRow = {
  id: string; visitor: string | null; source: string | null; device: string | null;
  started_at: string; updated_at: string;
  furthest_question: string | null; furthest_index: number; total: number | null;
  completed_at: string | null; emailed_at: string | null; paywall_at: string | null; unlocked_at: string | null;
};

/** An attempt with no activity for this long, and not finished, counts as stopped. */
export const IDLE_MS = 30 * 60 * 1000;

export const PAGE_LABELS: Record<string, string> = {
  "/": "Home page", "/check": "Health check questions", "/results": "Results and payment", "/home-tests": "Lab tests",
  "/medication": "Medication delivery", "/doctor": "Chat with our team", "/login": "Log in", "/account": "Dashboard (logged in)",
  "/privacy": "Privacy notice", "/terms": "Terms", "/s/[shared result]": "Shared results (from a link)", "/family": "Family care",
};
export const pageLabel = (p: string) => PAGE_LABELS[p] ?? (p.startsWith("/learn/") ? `Guide: ${p.slice(7).replace(/-/g, " ")}` : p);
export const sourceLabel = (s: string) => SOURCE_LABELS[s] ?? s;

export function traffic(views: ViewRow[]) {
  const visitors = new Set(views.map((v) => v.visitor));
  const group = (key: (v: ViewRow) => string) => {
    const m = new Map<string, { views: number; visitors: Set<string> }>();
    for (const v of views) {
      const k = key(v);
      if (!m.has(k)) m.set(k, { views: 0, visitors: new Set() });
      const g = m.get(k)!;
      g.views++;
      g.visitors.add(v.visitor);
    }
    return [...m.entries()].map(([k, g]) => ({ key: k, views: g.views, visitors: g.visitors.size })).sort((a, b) => b.visitors - a.visitors || b.views - a.views);
  };
  // A visitor's source and device: from their first view in the period.
  const first = new Map<string, ViewRow>();
  for (const v of [...views].sort((a, b) => a.created_at.localeCompare(b.created_at))) if (!first.has(v.visitor)) first.set(v.visitor, v);
  const firsts = [...first.values()];
  return {
    views: views.length,
    visitors: visitors.size,
    pages: group((v) => v.path),
    sources: group((v) => first.get(v.visitor)?.source ?? v.source).map((s) => ({ ...s, views: s.views })),
    devices: { phone: firsts.filter((v) => v.device === "phone").length, tablet: firsts.filter((v) => v.device === "tablet").length, desktop: firsts.filter((v) => v.device === "desktop").length },
  };
}

export type Step = { key: string; label: string; help: string; count: number };

const started = (s: SessionRow) => s.furthest_index >= 2 || !!s.completed_at;
const halfway = (s: SessionRow) => !!s.completed_at || (s.total ? s.furthest_index * 2 >= s.total : false);

/** The path from visiting to paying, step by step. */
export function funnel(visitors: number, sessions: SessionRow[], paid: number): Step[] {
  return [
    { key: "visit", label: "Visited the website", help: "Different people who opened any page", count: visitors },
    { key: "open", label: "Opened the health check", help: "Saw the first question", count: sessions.length },
    { key: "start", label: "Answered the first question", help: "And moved on to the next one", count: sessions.filter(started).length },
    { key: "half", label: "Got halfway", help: "Answered at least half the questions", count: sessions.filter(halfway).length },
    { key: "done", label: "Answered every question", help: "Finished the questions", count: sessions.filter((s) => s.completed_at).length },
    { key: "email", label: "Gave their email", help: "To get their results", count: sessions.filter((s) => s.emailed_at).length },
    { key: "paywall", label: "Saw the payment page", help: "The page to unlock their results", count: sessions.filter((s) => s.paywall_at).length },
    { key: "paid", label: "Paid for their results", help: "Health check payments in this period", count: paid },
  ];
}

const ORDER = new Map(QUESTIONS.map((q, i) => [q.id, i]));

export type DropRow = { id: string; number: number; topic: string; title: string; sometimes: boolean; reached: number; stopped: number; rate: number };

/**
 * For each question: how many people got to it, and how many stopped there (left without answering
 * it, and didn't come back within 30 minutes). Questions only some people see are marked.
 */
export function dropOffs(sessions: SessionRow[], now: number): { rows: DropRow[]; stopped: number; inProgress: number; finished: number } {
  const pos = (s: SessionRow) => (s.completed_at ? Infinity : s.furthest_question ? ORDER.get(s.furthest_question) ?? -1 : -1);
  const idle = (s: SessionRow) => now - new Date(s.updated_at).getTime() > IDLE_MS;
  const stoppedList = sessions.filter((s) => !s.completed_at && idle(s));
  const stoppedAt = new Map<string, number>();
  for (const s of stoppedList) if (s.furthest_question) stoppedAt.set(s.furthest_question, (stoppedAt.get(s.furthest_question) ?? 0) + 1);
  // The number most people see on screen ("5 of 31"): questions only some people get share the
  // number of the question before them.
  let seen = 0;
  const rows = QUESTIONS.map((q, i): DropRow => {
    if (!q.showIf) seen++;
    const reached = sessions.filter((s) => pos(s) >= i).length;
    const stopped = stoppedAt.get(q.id) ?? 0;
    return { id: q.id, number: Math.max(1, seen), topic: q.topic, title: q.title, sometimes: !!q.showIf, reached, stopped, rate: reached ? Math.round((stopped / reached) * 1000) / 10 : 0 };
  }).filter((r) => r.reached > 0 || r.stopped > 0);
  return {
    rows,
    stopped: stoppedList.length,
    inProgress: sessions.filter((s) => !s.completed_at && !idle(s)).length,
    finished: sessions.filter((s) => s.completed_at).length,
  };
}

/** Per source: visitors, checks opened and finished. */
export function bySource(views: ViewRow[], sessions: SessionRow[]) {
  const t = traffic(views).sources;
  const keys = new Set([...t.map((s) => s.key), ...sessions.map((s) => s.source ?? "direct")]);
  return [...keys].map((k) => ({
    key: k,
    visitors: t.find((s) => s.key === k)?.visitors ?? 0,
    opened: sessions.filter((s) => (s.source ?? "direct") === k).length,
    finished: sessions.filter((s) => (s.source ?? "direct") === k && s.completed_at).length,
  })).sort((a, b) => b.visitors - a.visitors || b.opened - a.opened);
}

export const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);
