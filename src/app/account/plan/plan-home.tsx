"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { ScoreRing } from "@/components/score-widgets";
import { TrendLine } from "@/components/trend-line";
import { ButtonLink, Notice } from "@/components/ui";
import { DAY_NAMES, type WeightSettings } from "@/lib/plan/engine";
import type { GoalView } from "@/lib/plan/server";
import { AREA_INFO } from "@/lib/plan/options";

const short = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });
const long = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const d = (k: string) => new Date(`${k}T12:00:00Z`);

/** Words for last week's review, in plain language. */
function reviewLine(g: GoalView): string | null {
  const last = g.progress.history.at(-1);
  if (!last) return null;
  const did = `Last week: ${last.done} of ${last.needed}.`;
  if (last.change === "up") return `${did} Great work, so this week is a small step up.`;
  if (last.change === "down") return `${did} This week is a little easier, so you can get back on track.`;
  return last.adherence >= 0.8 ? `${did} Well done. Same again this week while the habit settles.` : `${did} Same target this week. You've got this.`;
}

/**
 * The plan, day to day: tick things off, see the week fill up, and see how next week will adjust.
 * Every number here is worked out on the server from what's been ticked off.
 */
export function PlanHome({ goals, today, paidUntil, reminders, startsOn, recheckDue, perkLabel = "" }: {
  goals: GoalView[]; today: string; paidUntil: string; reminders: boolean; startsOn: string; recheckDue: boolean; perkLabel?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kg, setKg] = useState("");
  const [remind, setRemind] = useState(reminders);

  const week = goals[0]?.progress.week ?? 1;
  const totals = goals.reduce((a, g) => ({ done: a.done + Math.min(g.progress.thisWeek.done, g.progress.thisWeek.needed), needed: a.needed + g.progress.thisWeek.needed }), { done: 0, needed: 0 });
  const pct = totals.needed ? Math.round((totals.done / totals.needed) * 100) : 0;

  async function log(goalId: string, day: string, done: boolean, value?: number) {
    setPending(`${goalId}:${day}`);
    setError(null);
    const r = await fetch("/api/plan/log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ goalId, day, done, value }) }).catch(() => null);
    if (!r?.ok) setError((await r?.json().catch(() => null))?.error ?? "That didn't save. Please try again.");
    router.refresh();
    setPending(null);
  }
  async function toggleReminders() {
    const next = !remind;
    setRemind(next);
    await fetch("/api/plan/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reminders: next }) }).catch(() => null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Week header */}
      <section className="flex flex-col items-center gap-5 rounded-[var(--radius-xl)] bg-ink p-6 text-white sm:flex-row" aria-label="This week">
        <ScoreRing score={pct} color="var(--color-primary)" size={120}>
          <span className="font-display text-3xl font-bold tabular">{pct}%</span>
          <span className="text-[11px] font-semibold text-white/60">this week</span>
        </ScoreRing>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-[13px] font-semibold tracking-[0.08em] text-white/60 uppercase">Week {week} · started {short.format(d(startsOn))}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-white">{totals.done} of {totals.needed} done this week</p>
          <p className="mt-1 text-[15px] text-white/75">{pct >= 80 ? "You're on track. Keep going." : pct >= 50 ? "Good progress. A couple more and you've nailed it." : "Every tick counts. Start with today."}</p>
        </div>
      </section>

      {error && <Notice tone="warn">{error}</Notice>}
      {perkLabel && (
        <Link href="/doctor" className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-primary/30 bg-primary-soft p-4">
          <Icon name="stethoscope" size={20} strokeWidth={2} className="shrink-0 text-primary" />
          <span className="flex-1 text-[15px]"><b>Member perk:</b> {perkLabel} every doctor consultation, applied automatically when you book.</span>
          <Icon name="arrowRight" size={16} strokeWidth={2} className="shrink-0 text-primary" />
        </Link>
      )}
      {recheckDue && (
        <Notice tone="good">It&apos;s been 3 months. <Link href="/account/retake" className="font-semibold underline">Retake the check</Link> to see how your scores have moved.</Notice>
      )}

      {goals.map((g) => {
        const p = g.progress;
        const review = reviewLine(g);
        const days = Object.keys(p.thisWeek.days).sort();
        const doneToday = p.thisWeek.days[today];
        return (
          <section key={g.id} className="rounded-[var(--radius-xl)] border border-line bg-surface p-5" aria-labelledby={`g-${g.area}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name={AREA_INFO[g.area].icon as IconName} size={22} strokeWidth={2} /></span>
              <div className="min-w-0 flex-1">
                <h2 id={`g-${g.area}`} className="text-lg font-semibold">{AREA_INFO[g.area].title}</h2>
                <p className="text-[15px] font-medium text-ink/85">{p.target.headline}</p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted tabular">{Math.min(p.thisWeek.done, p.thisWeek.needed)}/{p.thisWeek.needed}</span>
            </div>

            <ul className="mt-3 flex flex-col gap-1.5 text-[15px] text-ink/80">
              {p.target.steps.map((s) => <li key={s} className="flex gap-2"><Icon name="check" size={16} strokeWidth={2.4} className="mt-1 shrink-0 text-primary" />{s}</li>)}
            </ul>
            {review && <p className="mt-3 rounded-[var(--radius-md)] bg-surface-2 px-3 py-2 text-sm text-muted">{review}</p>}

              <>
                <button type="button" disabled={pending !== null} onClick={() => log(g.id, today, !doneToday)} aria-pressed={!!doneToday}
                  className={`mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] text-[16px] font-semibold whitespace-nowrap transition-colors disabled:opacity-60 ${doneToday ? "bg-good-bg text-good-text" : "bg-primary text-white hover:bg-primary-hover"}`}>
                  {pending === `${g.id}:${today}` ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : <Icon name="check" size={18} strokeWidth={2.6} />}
                  {doneToday ? "Done today. Tap to undo" : g.area === "sleep" ? "I kept to it last night" : g.area === "weight" ? "I followed today's plan" : "Done today"}
                </button>
                <div className="mt-3 grid grid-cols-7 gap-1.5" role="group" aria-label="This week">
                  {days.map((day) => {
                    const on = p.thisWeek.days[day], future = day > today;
                    return (
                      <button key={day} type="button" disabled={future || pending !== null} onClick={() => log(g.id, day, !on)} aria-pressed={on} aria-label={`${DAY_NAMES[d(day).getUTCDay()]}${on ? ", done" : ""}`}
                        className={`flex flex-col items-center gap-1 rounded-[var(--radius-md)] py-2 text-[11px] font-semibold transition-colors disabled:opacity-40 ${on ? "bg-primary text-white" : day === today ? "border-2 border-primary text-primary" : "border border-line text-muted hover:bg-surface-2"}`}>
                        {DAY_NAMES[d(day).getUTCDay()].slice(0, 3)}
                        <span className="flex h-4 items-center">{on ? <Icon name="check" size={13} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            {g.area === "weight" && (
              <div className="mt-4">
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = Number(kg); if (v >= 30 && v <= 250) { log(g.id, today, true, v); setKg(""); } }}>
                  <input inputMode="decimal" aria-label="Your weight in kg" placeholder={`Today's weight (kg)`} value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, ""))}
                    className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 text-base focus:border-primary focus:outline-none" />
                  <button className="min-h-[48px] shrink-0 rounded-[var(--radius-md)] bg-primary px-5 font-semibold whitespace-nowrap text-white disabled:opacity-40" disabled={!kg || pending !== null}>Log weight</button>
                </form>
                <p className="mt-1.5 text-xs text-subtle">Best on {DAY_NAMES[(g.settings as WeightSettings).weighDay]} mornings, before eating.</p>
                {p.weight && p.weight.levers > 0 && (
                  <p className="mt-3 rounded-[var(--radius-md)] bg-sun-soft px-3 py-2 text-sm text-check-text">Your weight held steady for 2 weeks while you kept up, so we&apos;ve added {p.weight.levers === 1 ? "one more change" : `${p.weight.levers} extra changes`} to your plan. That&apos;s normal: bodies adjust, and a small extra step gets things moving again.</p>
                )}
                {p.weight && (
                  <div className="mt-3">
                    <p className="text-sm">
                      {p.weight.latest != null ? <>Latest: <b>{p.weight.latest} kg</b>{p.weight.lost != null && p.weight.lost > 0 ? <> · <b className="text-good-text">down {p.weight.lost} kg</b></> : null} · on-track line {p.weight.expected} kg · goal {(g.settings as WeightSettings).targetKg} kg. {p.weight.onTrack ? <span className="font-semibold text-good-text">On track.</span> : <span className="font-semibold text-check-text">A little behind. Keep going.</span>}</> : "Log your first weigh-in to see your progress."}
                    </p>
                    {p.weight.points.length >= 2 && (
                      <div className="mt-2"><TrendLine label="Weight over time" unit=" kg" points={p.weight.points.map((x) => ({ date: short.format(d(x.day)), value: x.kg }))}
                        min={Math.floor(Math.min(...p.weight.points.map((x) => x.kg), (g.settings as WeightSettings).targetKg) - 1)} max={Math.ceil(Math.max(...p.weight.points.map((x) => x.kg)) + 1)} /></div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      <section className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-[15px]">
          <input type="checkbox" className="h-5 w-5 accent-[#136F58]" checked={remind} onChange={toggleReminders} />
          Email me a Sunday summary and a midweek nudge
        </label>
        <ButtonLink href="/account/plan?edit=1" variant="secondary" icon="edit">Change my plan</ButtonLink>
      </section>
      <p className="text-center text-xs text-subtle">Your plan runs until {long.format(d(paidUntil))}. It doesn&apos;t renew automatically.</p>
    </div>
  );
}
