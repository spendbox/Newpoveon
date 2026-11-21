"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { AnswerTile } from "@/components/client";
import { Field, inputCls, Notice } from "@/components/ui";
import { Steps, type Step } from "@/components/steps";
import { bedtimeFor, CALM_PRACTICES, DAY_NAMES, EAT_SWAPS, MOVE_LADDER, targetFor, wakeLabel, weightTarget, type Area, type Goal, type Recommendation } from "@/lib/plan/engine";
import { AREA_INFO, CALM_CUES, MAX_AREAS, MOVE_ACTIVITIES, MOVE_CUES, WAKE_TIMES } from "@/lib/plan/options";

export type Hints = { recs: Recommendation[]; weightKg: number | null; moveStart: number; sleepStart: number; swaps: string[]; canLoseWeight: boolean };

const ngn = (n: number) => `₦${n.toLocaleString("en-NG")}`;
const ORDER: Area[] = ["move", "sleep", "weight", "eat", "calm"];

/**
 * Build (or edit) a personal plan in a few short steps: pick up to 3 areas, set each one up
 * around the person's day, see week 1, then pay once for the year.
 */
export function PlanBuilder({ hints, existing, active, price, expired }: { hints: Hints; existing: Goal[]; active: boolean; price: number; expired: boolean }) {
  const router = useRouter();
  const find = <T,>(a: Area) => existing.find((g) => g.area === a)?.settings as T | undefined;
  const [areas, setAreas] = useState<Area[]>(existing.length ? existing.map((g) => g.area) : hints.recs.slice(0, 2).map((r) => r.area));
  const [move, setMove] = useState({ cue: find<{ cue: string }>("move")?.cue ?? "", activity: find<{ activity: string }>("move")?.activity ?? "Brisk walking", startLevel: find<{ startLevel: number }>("move")?.startLevel ?? hints.moveStart });
  const [sleep, setSleep] = useState({ wake: find<{ wake: string }>("sleep")?.wake ?? "06:30", startLevel: find<{ startLevel: number }>("sleep")?.startLevel ?? hints.sleepStart });
  const [weight, setWeight] = useState({ startKg: String(find<{ startKg: number }>("weight")?.startKg ?? hints.weightKg ?? ""), weighDay: find<{ weighDay: number }>("weight")?.weighDay ?? 6 });
  const [swaps, setSwaps] = useState<string[]>(find<{ swaps: string[] }>("eat")?.swaps ?? hints.swaps.slice(0, 3));
  const [calm, setCalm] = useState({ practice: find<{ practice: string }>("calm")?.practice ?? "breathe", cue: find<{ cue: string }>("calm")?.cue ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recFor = (a: Area) => hints.recs.find((r) => r.area === a);
  const chosen = ORDER.filter((a) => areas.includes(a));
  const kg = Number(weight.startKg);

  const goals: Goal[] = useMemo(() => chosen.map((area): Goal => {
    switch (area) {
      case "move": return { area, settings: move };
      case "sleep": return { area, settings: sleep };
      case "weight": return { area, settings: { startKg: kg, targetKg: weightTarget(kg || 0), weighDay: weight.weighDay } };
      case "eat": return { area, settings: { swaps: hints.swaps.filter((s) => swaps.includes(s)) } };
      case "calm": return { area, settings: calm };
    }
  }), [chosen, move, sleep, kg, weight.weighDay, swaps, calm, hints.swaps]);

  function toggleArea(a: Area) {
    setAreas((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : cur.length >= MAX_AREAS ? cur : [...cur, a]));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const save = await fetch("/api/plan/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ goals }) }).catch(() => null);
    const sd = save ? await save.json().catch(() => ({})) : {};
    if (!save?.ok) { setBusy(false); setError(sd.error ?? "We couldn't save your plan. Please try again."); return; }
    if (active) { router.push("/account/plan"); router.refresh(); return; }
    const pay = await fetch("/api/plan/checkout", { method: "POST" }).catch(() => null);
    const pd = pay ? await pay.json().catch(() => ({})) : {};
    if (pay?.ok && pd.authorizationUrl) { window.location.assign(pd.authorizationUrl); return; }
    setBusy(false);
    setError(pd.error ?? "We couldn't start the payment. Please try again.");
  }

  const steps: Step[] = [
    {
      key: "areas", title: active ? "What are you working on?" : "What would you like to work on?",
      hint: `Pick up to ${MAX_AREAS}. Fewer changes at once means they're more likely to stick.`, valid: chosen.length > 0,
      content: (
        <div className="flex flex-col gap-2.5" role="group" aria-label="Areas">
          {ORDER.filter((a) => a !== "weight" || hints.canLoseWeight || areas.includes("weight")).map((a) => {
            const on = areas.includes(a), rec = recFor(a), full = !on && areas.length >= MAX_AREAS;
            return (
              <button key={a} type="button" onClick={() => toggleArea(a)} aria-pressed={on} disabled={full}
                className={`flex items-start gap-3 rounded-[var(--radius-lg)] border p-4 text-left transition-colors disabled:opacity-45 ${on ? "border-primary bg-primary-soft" : "border-line bg-surface hover:border-line-strong"}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${on ? "bg-primary text-white" : "bg-surface-2 text-primary"}`}><Icon name={AREA_INFO[a].icon as IconName} size={20} strokeWidth={2} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2"><span className="font-semibold">{AREA_INFO[a].title}</span>{rec && <span className="rounded-full bg-coral-soft px-2 py-0.5 text-[11px] font-semibold text-act-text">Recommended</span>}</span>
                  <span className="mt-0.5 block text-sm text-muted">{rec?.why ?? AREA_INFO[a].blurb}</span>
                </span>
                <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-primary bg-primary text-white" : "border-line-strong"}`}>{on && <Icon name="check" size={14} strokeWidth={3} />}</span>
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  if (chosen.includes("move")) steps.push({
    key: "move", title: "Moving more", hint: "Tie it to something you already do every day. That's what makes it stick.", valid: !!move.cue && !!move.activity,
    content: (
      <>
        <p className="text-sm font-semibold">When will you do it?</p>
        <div className="grid gap-2 sm:grid-cols-2">{MOVE_CUES.map((c) => <AnswerTile key={c} layout="rows" label={c} selected={move.cue === c} onClick={() => setMove({ ...move, cue: c })} />)}</div>
        <p className="text-sm font-semibold">What will you do?</p>
        <div className="grid gap-2 sm:grid-cols-2">{MOVE_ACTIVITIES.map((a) => <AnswerTile key={a} layout="rows" label={a} selected={move.activity === a} onClick={() => setMove({ ...move, activity: a })} />)}</div>
        <Notice>We&apos;ll start you at <b>{MOVE_LADDER[move.startLevel].minutes} minutes, {MOVE_LADDER[move.startLevel].days} days a week</b>, based on your check, and build up to 150 minutes a week.</Notice>
      </>
    ),
  });

  if (chosen.includes("sleep")) steps.push({
    key: "sleep", title: "Sleeping better", hint: "The most important habit is getting up at the same time every day, even at weekends.", valid: !!sleep.wake,
    content: (
      <>
        <Field id="p-wake" label="What time do you need to get up?">
          <select id="p-wake" className={inputCls} value={sleep.wake} onChange={(e) => setSleep({ ...sleep, wake: e.target.value })}>
            {WAKE_TIMES.map((w) => <option key={w} value={w}>{wakeLabel(w)}</option>)}
          </select>
        </Field>
        <Notice tone="good">That means lights out by <b>{bedtimeFor(sleep.wake)}</b> for about 7.5 hours in bed.</Notice>
      </>
    ),
  });

  if (chosen.includes("weight")) steps.push({
    key: "weight", title: "Losing weight", hint: "Weighing once a week, on the same day, is enough. Daily weights go up and down.", valid: kg >= 30 && kg <= 250,
    content: (
      <>
        <Field id="p-kg" label="Your weight today (kg)">
          <input id="p-kg" inputMode="decimal" className={inputCls} value={weight.startKg} onChange={(e) => setWeight({ ...weight, startKg: e.target.value.replace(/[^\d.]/g, "") })} placeholder="e.g. 82" />
        </Field>
        <p className="text-sm font-semibold">Which day will you weigh in?</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{[1, 2, 3, 4, 5, 6, 0].map((d) => <AnswerTile key={d} layout="rows" label={DAY_NAMES[d].slice(0, 3)} selected={weight.weighDay === d} onClick={() => setWeight({ ...weight, weighDay: d })} />)}</div>
        {kg >= 30 && kg <= 250 && <Notice tone="good">Your goal: <b>{weightTarget(kg)} kg</b>, a 5% loss. At about half a kilo a week, that&apos;s around {Math.ceil((kg - weightTarget(kg)) / 0.5)} weeks.</Notice>}
      </>
    ),
  });

  if (chosen.includes("eat")) steps.push({
    key: "eat", title: "Eating better", hint: "Pick the swaps you're willing to try. We'll start with one and add the next every two weeks when you're keeping up.", valid: swaps.length > 0,
    content: (
      <div className="flex flex-col gap-2">
        {hints.swaps.map((k, i) => (
          <AnswerTile key={k} multi layout="rows" label={`${EAT_SWAPS[k].title}${i === 0 ? " (good first step for you)" : ""}`} selected={swaps.includes(k)} onClick={() => setSwaps(swaps.includes(k) ? swaps.filter((x) => x !== k) : [...swaps, k])} />
        ))}
      </div>
    ),
  });

  if (chosen.includes("calm")) steps.push({
    key: "calm", title: "Feeling calmer", hint: "A few minutes a day, at the same time, makes a real difference to how you feel.", valid: !!calm.cue && !!calm.practice,
    content: (
      <>
        <p className="text-sm font-semibold">What will you do?</p>
        <div className="flex flex-col gap-2">{Object.entries(CALM_PRACTICES).map(([k, v]) => <AnswerTile key={k} layout="rows" label={v} selected={calm.practice === k} onClick={() => setCalm({ ...calm, practice: k })} />)}</div>
        <p className="text-sm font-semibold">When?</p>
        <div className="grid gap-2 sm:grid-cols-3">{CALM_CUES.map((c) => <AnswerTile key={c} layout="rows" label={c} selected={calm.cue === c} onClick={() => setCalm({ ...calm, cue: c })} />)}</div>
      </>
    ),
  });

  steps.push({
    key: "review", title: active ? "Your updated plan" : "Your first week", hint: active ? "Changes start straight away." : "Here's how you'll start. It adjusts every week to how it's going.", valid: goals.length > 0,
    content: (
      <>
        <ul className="flex flex-col gap-3">
          {goals.map((g) => {
            const t = targetFor(g, g.area === "move" ? move.startLevel : g.area === "sleep" ? sleep.startLevel : 0, 0);
            return (
              <li key={g.area} className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
                <p className="flex items-center gap-2 font-semibold"><Icon name={AREA_INFO[g.area].icon as IconName} size={18} strokeWidth={2} className="text-primary" />{AREA_INFO[g.area].title}</p>
                <p className="mt-1 text-[15px] font-medium">{t.headline}</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-muted">{t.steps.map((s) => <li key={s}>{s}</li>)}</ul>
              </li>
            );
          })}
        </ul>
        {!active && (
          <div className="rounded-[var(--radius-lg)] bg-primary-soft p-4">
            <p className="font-semibold">What you get for {ngn(price)} a year</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm">
              {["A daily check-off for each goal, in seconds", "A weekly review that steps up, holds or eases back your targets", "Sunday summaries and a midweek nudge by email, if you need one", "A re-check every 3 months to see your scores move"].map((x) => <li key={x} className="flex gap-2"><Icon name="check" size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-primary" />{x}</li>)}
            </ul>
            <p className="mt-2 text-xs text-muted">One payment for 12 months. It doesn&apos;t renew automatically. Secure payment by Paystack.</p>
          </div>
        )}
        {expired && <Notice tone="warn">Your last plan year has ended. Renew to carry on where you left off. Your history is kept.</Notice>}
      </>
    ),
  });

  return <Steps steps={steps} onSubmit={submit} busy={busy} error={error} submitLabel={active ? "Save my plan" : `Start my plan · ${ngn(price)}`} />;
}
