import Link from "next/link";
import type { ReactNode } from "react";
import { EXTENDED_MIN_AGE, site } from "@/config/site";
import { Icon, type IconName } from "@/components/icons";
import { BodyMap } from "@/components/body-map";
import { Mannequin } from "@/components/mannequin";
import { ScoreTile, WellbeingHero } from "@/components/score-widgets";
import { TrendLine } from "@/components/trend-line";
import { ButtonLink, Notice, ResultCard } from "@/components/ui";
import { formatWhen } from "@/lib/email";
import type { ResultCard as ResultCardData, Results, Status } from "@/lib/scoring/results";
import { UseLatestAnswers } from "./account-actions";

export type Row = { id: string; created_at: string; heart_age: number | null; risk_percent: number | null; results: Results; answers: Record<string, unknown> };
export type Booking = { id: string; slot_starts_at: string | null; status: string; consult_type_name?: string | null };

const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: site.timeZone });
const short = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: site.timeZone });
const card = (r: Results, id: ResultCardData["id"]) => r.cards.find((c) => c.id === id);

/** Page heading used on every dashboard page. */
export function PageHead({ eyebrow, title, sub, action }: { eyebrow?: string; title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">{eyebrow}</p>}
        <h1 className="mt-1 text-[30px] leading-[1.05] font-bold md:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-[15px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function NoChecksYet() {
  return (
    <section className="grid items-center gap-6 rounded-[var(--radius-xl)] border border-line bg-surface p-6 md:grid-cols-[1fr_200px] md:p-10">
      <div>
        <h2 className="text-3xl font-semibold">Let&apos;s get your first scores</h2>
        <p className="mt-2 text-[17px] text-muted">Take the free 10-minute check. Your wellbeing score, heart age, diabetes risk and more will live here, so you can watch them improve.</p>
        <ButtonLink href="/check" className="mt-6" iconRight="arrowRight">Start my check</ButtonLink>
      </div>
      <div className="mx-auto w-[180px]"><Mannequin crop="upper" className="h-auto w-full" /></div>
    </section>
  );
}

/* ------------------------------------------------------------------ Overview */

export function OverviewPanel({ history }: { history: Row[] }) {
  const latest = history[0];
  if (!latest) return <NoChecksYet />;
  const r = latest.results;
  const chrono = [...history].reverse();
  const wb = chrono.filter((h) => h.results.wellbeing).map((h) => h.results.wellbeing!.score);
  const focus = r.cards.filter((c) => c.status !== "good").sort((a, b) => (b.status === "act" ? 1 : 0) - (a.status === "act" ? 1 : 0)).slice(0, 3);
  const due = r.reminders.filter((x) => !x.done).length;

  const tiles: { id: ResultCardData["id"]; icon: IconName; label: string; value: string; note?: string; tone: Status | "neutral" }[] = [];
  const h = card(r, "heart");
  tiles.push(r.heart
    ? { id: "heart", icon: "heart", label: "Heart age", value: `${r.heart.heartAge.kind === "below" ? "Under " : r.heart.heartAge.kind === "above" ? "Over " : ""}${r.heart.heartAge.value}`, note: `${r.heart.riskPercent}% 10-year risk`, tone: h?.status ?? "neutral" }
    : { id: "heart", icon: "heart", label: "Heart age", value: r.age < EXTENDED_MIN_AGE ? `From ${EXTENDED_MIN_AGE}` : h?.value ?? "Not yet", note: r.age < EXTENDED_MIN_AGE ? "Not calculated under 30" : undefined, tone: h?.status ?? "neutral" });
  for (const [id, icon, label] of [["diabetes", "drop", "Diabetes risk"], ["bp", "gauge", "Blood pressure"]] as const) {
    const c = card(r, id);
    if (c) tiles.push({ id, icon, label, value: c.value, tone: c.status });
  }

  return (
    <div className="flex flex-col gap-8">
      {r.wellbeing ? (
        <WellbeingHero w={r.wellbeing} date={short.format(new Date(latest.created_at))}>
          {wb.length >= 2 && <p className="mt-3 text-sm text-white/70">{wb.at(-1)! - wb.at(-2)! >= 0 ? "Up" : "Down"} {Math.abs(wb.at(-1)! - wb.at(-2)!)} points since your last check.</p>}
        </WellbeingHero>
      ) : (
        <section className="flex flex-col gap-4 rounded-[var(--radius-xl)] bg-ink p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-[13px] font-semibold tracking-[0.08em] text-white/65 uppercase">New: your wellbeing score</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">Add it in 1 minute</p>
            <p className="mt-1 text-[15px] text-white/75">Five quick questions about the last two weeks.</p>
          </div>
          <UseLatestAnswers answers={latest.answers} />
        </section>
      )}

      <section aria-labelledby="scores">
        <div className="flex items-center justify-between">
          <h2 id="scores" className="text-xl font-semibold">Key scores</h2>
          <Link href="/account/results" className="text-sm font-semibold text-primary hover:underline">All results</Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {tiles.map((t) => <ScoreTile key={t.id} href={`/learn/${t.id}`} icon={t.icon} label={t.label} value={t.value} note={t.note} tone={t.tone} />)}
        </div>
      </section>

      <section aria-labelledby="focus">
        <h2 id="focus" className="text-xl font-semibold">Where to focus</h2>
        {focus.length === 0 ? (
          <div className="mt-3"><Notice tone="good">Everything is looking good. Check again in a few months to keep it that way.</Notice></div>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-3">{focus.map((c) => <ResultCard key={c.id} card={c} />)}</div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Shortcuts">
        <Shortcut href="/account/progress" icon="gauge" title="My progress" text={`${history.length} check${history.length === 1 ? "" : "s"} so far`} />
        <Shortcut href="/account/checkups" icon="shield" title="Check-ups" text={due ? `${due} due` : "All up to date"} />
        <Shortcut href="/doctor" icon="stethoscope" title="Talk to a doctor" text="Private, from your phone" />
      </section>
    </div>
  );
}

function Shortcut({ href, icon, title, text }: { href: string; icon: IconName; title: string; text: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-md)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name={icon} size={20} strokeWidth={2} /></span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="block text-sm text-muted">{text}</span></span>
      <Icon name="arrowRight" size={16} strokeWidth={2} className="text-subtle transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ------------------------------------------------------------------ Results */

export function ResultsPanel({ history }: { history: Row[] }) {
  const latest = history[0];
  if (!latest) return <NoChecksYet />;
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[var(--radius-xl)] border border-line bg-surface p-5 md:p-8" aria-labelledby="map">
        <h2 id="map" className="text-xl font-semibold">Body map</h2>
        <p className="mt-1 text-[15px] text-muted">Tap a point to see your result there and how to improve it.</p>
        <div className="mt-6"><BodyMap mode="results" results={Object.fromEntries(latest.results.cards.map((c) => [c.id, { status: c.status, value: c.value, summary: c.summary }]))} /></div>
      </section>
      <section aria-labelledby="all">
        <h2 id="all" className="text-xl font-semibold">Every result</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">{latest.results.cards.map((c) => <ResultCard key={c.id} card={c} />)}</div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ Progress */

export function ProgressPanel({ history }: { history: Row[] }) {
  if (!history.length) return <NoChecksYet />;
  const chrono = [...history].reverse();
  const wb = chrono.filter((h) => h.results.wellbeing).map((h) => ({ date: short.format(new Date(h.created_at)), value: h.results.wellbeing!.score }));
  const ha = chrono.filter((h) => h.heart_age).map((h) => ({ date: short.format(new Date(h.created_at)), value: h.heart_age! }));
  return (
    <div className="flex flex-col gap-8">
      {wb.length >= 2 || ha.length >= 2 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {wb.length >= 2 && (
            <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
              <p className="font-semibold">Wellbeing score</p>
              <p className="text-[13px] text-muted">Out of 100. Higher is better.</p>
              <div className="mt-3"><TrendLine points={wb} label="Wellbeing score over time" /></div>
            </div>
          )}
          {ha.length >= 2 && (
            <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
              <p className="font-semibold">Heart age</p>
              <p className="text-[13px] text-muted">In years. Lower is better.</p>
              <div className="mt-3"><TrendLine points={ha} label="Heart age over time" max={100} /></div>
            </div>
          )}
        </div>
      ) : (
        <Notice>Your charts appear after your second check. We suggest checking again every 3 months.</Notice>
      )}
      <section aria-labelledby="history">
        <h2 id="history" className="text-xl font-semibold">Your checks</h2>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface">
          {history.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4">
              <span className="font-semibold">{dateFmt.format(new Date(h.created_at))}</span>
              <span className="flex flex-wrap gap-1.5 text-[13px]">
                {h.results.wellbeing && <span className="rounded-full bg-primary-soft px-2.5 py-1 font-semibold text-primary">Wellbeing {h.results.wellbeing.score}</span>}
                {h.heart_age && <span className="rounded-full bg-coral-soft px-2.5 py-1 font-semibold text-act-text">Heart age {h.heart_age}</span>}
                {card(h.results, "diabetes") && <span className="rounded-full bg-lavender-soft px-2.5 py-1 font-semibold text-lavender">Diabetes {card(h.results, "diabetes")!.value.toLowerCase()}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ Check-ups */

export function CheckupsPanel({ history }: { history: Row[] }) {
  const latest = history[0];
  if (!latest) return <NoChecksYet />;
  const due = latest.results.reminders.filter((r) => !r.done);
  const done = latest.results.reminders.filter((r) => r.done);
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="due">
        <h2 id="due" className="text-xl font-semibold">Due now</h2>
        {due.length === 0 ? <div className="mt-3"><Notice tone="good">You&apos;re up to date with every check-up we track.</Notice></div> : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {due.map((r) => (
              <li key={r.id} className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
                <p className="font-semibold">{r.title}</p>
                <p className="mt-0.5 text-sm text-muted">{r.detail}</p>
                <p className="mt-1 text-xs text-subtle">Source: {r.source}</p>
                {r.testCode && <Link href={`/home-tests?test=${r.testCode}`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Arrange it <Icon name="arrowRight" size={14} /></Link>}
              </li>
            ))}
          </ul>
        )}
      </section>
      {done.length > 0 && (
        <section aria-labelledby="done">
          <h2 id="done" className="text-xl font-semibold">Done</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {done.map((r) => <li key={r.id} className="flex items-center gap-2 text-[15px]"><Icon name="check" size={18} strokeWidth={2.4} className="text-primary" />{r.title}</li>)}
          </ul>
        </section>
      )}
      <p className="text-sm text-muted">Had one of these since your last check? <Link href="/account/edit" className="font-semibold text-primary hover:underline">Update your answers</Link> and we&apos;ll tick it off.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ Bookings */

export function BookingsPanel({ bookings }: { bookings: Booking[] }) {
  if (!bookings.length) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-6">
        <p className="text-lg font-semibold">No doctor bookings yet</p>
        <p className="mt-1 text-muted">When you book a consult, it will show here.</p>
        <ButtonLink href="/doctor" className="mt-4" icon="stethoscope">Talk to a doctor</ButtonLink>
      </div>
    );
  }
  const label: Record<string, string> = { pending_payment: "Not paid", paid: "Booked", completed: "Done", cancelled: "Cancelled" };
  return (
    <ul className="flex flex-col gap-2">
      {bookings.map((b) => (
        <li key={b.id} className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name="stethoscope" size={20} strokeWidth={2} /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{b.consult_type_name ?? "Doctor consult"}</span>
            <span className="block text-sm text-muted">{b.slot_starts_at ? formatWhen(b.slot_starts_at) : "Time to be agreed"}</span>
          </span>
          <span className="shrink-0 rounded-full bg-ground px-2.5 py-1 text-xs font-semibold text-muted">{label[b.status] ?? b.status}</span>
        </li>
      ))}
    </ul>
  );
}
