/**
 * Personal plan engine. Pure functions: the same plan and logs always give the same targets.
 *
 * Methods used (all widely used and evidence-based, not invented here):
 *  - Small, gradual steps that grow only when the current step is mastered (graded activity / progressive overload).
 *  - "If-then" plans tied to a daily cue: "After work, I will walk for 20 minutes" (implementation intentions;
 *    Gollwitzer & Sheeran, Adv Exp Soc Psychol 2006).
 *  - Daily self-monitoring with a weekly review (Michie et al., Health Psychol 2009: self-monitoring is the
 *    most effective behaviour-change technique for activity and diet).
 *  - One habit change at a time (Lally et al., Eur J Soc Psychol 2010: habits form over weeks of repetition).
 *  - Activity: WHO 2020 guidelines, 150 minutes a week plus muscle strengthening on 2 days.
 *  - Sleep: fixed wake time and the core habits of CBT for insomnia (AASM guidance), aiming for 7+ hours.
 *  - Weight: about 0.5 kg a week towards a 5% loss (Diabetes Prevention Program, NEJM 2002; NICE CG189).
 * Weekly rule: hit 80%+ of the week's target → step up; 50–79% → stay; under 50% → step back one level.
 */

export type Area = "move" | "sleep" | "weight" | "eat" | "calm";
export const AREAS: Area[] = ["move", "sleep", "weight", "eat", "calm"];

export interface MoveSettings { cue: string; activity: string; startLevel: number }
export interface SleepSettings { wake: string; startLevel: number } // wake "06:30"
export interface WeightSettings { startKg: number; targetKg: number; weighDay: number } // 0 = Sunday
export interface EatSettings { swaps: string[] } // in the order they'll be added
export interface CalmSettings { practice: string; cue: string }
export type Settings = MoveSettings | SleepSettings | WeightSettings | EatSettings | CalmSettings;

export interface Goal { area: Area; settings: Settings }
export interface Log { day: string; done: boolean; value?: number | null } // day "YYYY-MM-DD"

/* ------------------------------------------------------------------ Ladders */

/** Move: minutes per session × days per week. The last rung adds strength work on 2 days (WHO 2020). */
export const MOVE_LADDER = [
  { minutes: 10, days: 3 }, { minutes: 15, days: 3 }, { minutes: 15, days: 4 }, { minutes: 20, days: 4 },
  { minutes: 20, days: 5 }, { minutes: 25, days: 5 }, { minutes: 30, days: 5 }, { minutes: 30, days: 5, strength: true },
] as const;

/** Sleep: habits are added one at a time (CBT-I principles). Nights per week to aim for grows too. */
export const SLEEP_HABITS = [
  "Get up at the same time every day, weekends too",
  "Lights out by your bedtime",
  "Screens away an hour before bed",
  "No coffee, kola or energy drinks after 2pm",
  "If you can't sleep after 20 minutes, get up and do something calm until you feel sleepy",
] as const;
export const SLEEP_NIGHTS = [4, 5, 5, 6, 6] as const;

/** Eat: a library of swaps that suit Nigerian meals. One is added at a time. */
export const EAT_SWAPS: Record<string, { title: string; why: string }> = {
  "sugary-drinks": { title: "Water or unsweetened zobo instead of soft drinks and malt", why: "The quickest way to cut sugar and calories." },
  salt: { title: "Half the seasoning cubes, and no extra salt at the table", why: "Less salt lowers blood pressure within weeks." },
  veg: { title: "Vegetables with lunch and dinner", why: "Fills you up and protects your heart." },
  portion: { title: "A smaller portion of swallow or rice, with more soup and vegetables", why: "Steadier blood sugar and easier weight loss." },
  fried: { title: "Boiled, grilled or steamed instead of fried", why: "Much less oil without losing the taste you love." },
  snack: { title: "Fruit or groundnuts instead of biscuits or chin chin", why: "Less sugar and refined flour between meals." },
  "late-meal": { title: "Last big meal at least 3 hours before bed", why: "Better sleep and steadier sugar overnight." },
};
export const EAT_DAYS = 5;

/** Calm: a short daily practice (associated with better wellbeing in WHO guidance on mental health and stress). */
export const CALM_PRACTICES: Record<string, string> = {
  breathe: "5 minutes of slow breathing (in for 4, out for 6)",
  walk: "A 10-minute walk outside",
  connect: "Call or visit someone you care about",
  write: "Write down 3 things that went well today",
};
export const CALM_DAYS = 5;

/* ------------------------------------------------------------------ Dates (Lagos) */

const DAY = 86_400_000;
/** Today's date in Lagos as "YYYY-MM-DD". */
export function lagosDay(now = new Date()): string {
  return new Date(now.getTime() + 3_600_000).toISOString().slice(0, 10);
}
const toDate = (d: string) => new Date(`${d}T00:00:00Z`);
export const addDays = (d: string, n: number) => new Date(toDate(d).getTime() + n * DAY).toISOString().slice(0, 10);
/** Monday of the week containing `d`. */
export function mondayOf(d: string): string {
  const wd = toDate(d).getUTCDay(); // 0 Sun … 6 Sat
  return addDays(d, wd === 0 ? -6 : 1 - wd);
}
export const weekdayOf = (d: string) => toDate(d).getUTCDay();

/* ------------------------------------------------------------------ Targets */

export interface WeekTarget {
  /** Days in the week this goal should be ticked off. Weight: 1 weigh-in. */
  days: number;
  /** One-line plan for the week, in plain words. */
  headline: string;
  /** Bullet points: what exactly to do. */
  steps: string[];
}

const clampLevel = (area: Area, level: number) => {
  const max = area === "move" ? MOVE_LADDER.length - 1 : area === "sleep" ? SLEEP_HABITS.length - 1 : area === "eat" ? Object.keys(EAT_SWAPS).length - 1 : 0;
  return Math.max(0, Math.min(max, level));
};

export function startLevel(goal: Goal): number {
  if (goal.area === "move") return clampLevel("move", (goal.settings as MoveSettings).startLevel ?? 0);
  if (goal.area === "sleep") return clampLevel("sleep", (goal.settings as SleepSettings).startLevel ?? 0);
  return 0;
}

/** Bedtime for a wake time, aiming for 7.5 hours in bed. "06:30" → "11pm". */
export function bedtimeFor(wake: string): string {
  const [h, m] = wake.split(":").map(Number);
  const mins = ((h * 60 + m - 450) % 1440 + 1440) % 1440;
  return clock(mins);
}
export function clock(mins: number): string {
  const h = Math.floor(mins / 60), m = mins % 60;
  const ap = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${ap}` : `${h12}${ap}`;
}
export const wakeLabel = (wake: string) => { const [h, m] = wake.split(":").map(Number); return clock(h * 60 + m); };

export function targetFor(goal: Goal, level: number, week: number): WeekTarget {
  const s = goal.settings;
  switch (goal.area) {
    case "move": {
      const r = MOVE_LADDER[clampLevel("move", level)];
      const m = s as MoveSettings;
      const steps = [`${m.cue}, ${m.activity.toLowerCase()} for ${r.minutes} minutes at a pace where you breathe faster but can still talk.`];
      if ("strength" in r && r.strength) steps.push("On 2 of those days, add 10 minutes of strength work: squats, wall push-ups or carrying shopping.");
      return { days: r.days, headline: `${r.minutes} minutes, ${r.days} days this week`, steps };
    }
    case "sleep": {
      const sl = s as SleepSettings;
      const l = clampLevel("sleep", level);
      const habits = SLEEP_HABITS.slice(0, l + 1).map((x, i) => (i === 0 ? `${x}: ${wakeLabel(sl.wake)}.` : i === 1 ? `${x}: ${bedtimeFor(sl.wake)}.` : `${x}.`));
      return { days: SLEEP_NIGHTS[l], headline: `Up at ${wakeLabel(sl.wake)}, lights out by ${bedtimeFor(sl.wake)}, ${SLEEP_NIGHTS[l]} nights`, steps: habits };
    }
    case "weight": {
      const w = s as WeightSettings;
      const expected = expectedWeight(w, week);
      return { days: 1, headline: `Weigh in on ${DAY_NAMES[w.weighDay]}. On track: about ${expected} kg`, steps: [
        `Weigh yourself once a week on ${DAY_NAMES[w.weighDay]} morning, before eating, and log it here.`,
        `Aim to lose about 0.5 kg a week, towards ${w.targetKg} kg. Slow and steady keeps it off.`,
      ] };
    }
    case "eat": {
      const e = s as EatSettings;
      const active = e.swaps.slice(0, Math.min(e.swaps.length, level + 1));
      return { days: EAT_DAYS, headline: `${active.length} ${active.length === 1 ? "swap" : "swaps"}, ${EAT_DAYS} days this week`, steps: active.map((k) => EAT_SWAPS[k]?.title ?? k) };
    }
    case "calm": {
      const c = s as CalmSettings;
      return { days: CALM_DAYS, headline: `${CALM_DAYS} days this week`, steps: [`${c.cue}: ${CALM_PRACTICES[c.practice] ?? c.practice}.`] };
    }
  }
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Weight expected after `week` full weeks at 0.5 kg/week, never below the target. */
export function expectedWeight(w: WeightSettings, week: number): number {
  return Math.round(Math.max(w.targetKg, w.startKg - 0.5 * week) * 10) / 10;
}
/** A safe 5% weight-loss target (rounded to 0.5 kg). */
export const weightTarget = (startKg: number) => Math.round(startKg * 0.95 * 2) / 2;

/* ------------------------------------------------------------------ Progress */

export interface WeekReview { week: number; start: string; done: number; needed: number; adherence: number; level: number; change: "up" | "same" | "down" | "start" }
export interface Progress {
  /** 1-based week number of the plan (week 1 starts on the plan's Monday). */
  week: number;
  weekStart: string;
  level: number;
  target: WeekTarget;
  thisWeek: { done: number; needed: number; days: Record<string, boolean> };
  history: WeekReview[];
  /** Weeks in a row (before this one) at 80% or better. */
  streak: number;
  /** Weight only: latest logged weight and whether it's on track. */
  weight?: { latest: number | null; expected: number; onTrack: boolean | null; points: { day: string; kg: number }[] };
}

const UP = 0.8, HOLD = 0.5;

export function progress(goal: Goal, logs: Log[], planStart: string, today: string): Progress {
  const start = mondayOf(planStart);
  const thisMonday = mondayOf(today);
  const weeks = Math.max(1, Math.floor((toDate(thisMonday).getTime() - toDate(start).getTime()) / (7 * DAY)) + 1);
  const doneDays = new Set(logs.filter((l) => l.done).map((l) => l.day));
  let level = startLevel(goal);
  const history: WeekReview[] = [];
  const maxLevel = clampLevel(goal.area, 99);

  for (let w = 1; w < weeks; w++) {
    const ws = addDays(start, (w - 1) * 7);
    const needed = targetFor(goal, level, w - 1).days;
    let done = 0;
    for (let d = 0; d < 7; d++) if (doneDays.has(addDays(ws, d))) done++;
    const adherence = Math.min(1, done / needed);
    const before = level;
    if (goal.area !== "weight" && goal.area !== "calm") {
      if (adherence >= UP) level = Math.min(maxLevel, level + (goal.area === "eat" ? (w % 2 === 0 ? 1 : 0) : 1));
      else if (adherence < HOLD) level = Math.max(0, level - 1);
    }
    history.push({ week: w, start: ws, done, needed, adherence, level: before, change: level > before ? "up" : level < before ? "down" : "same" });
  }

  const target = targetFor(goal, level, weeks - 1);
  const days: Record<string, boolean> = {};
  let done = 0;
  for (let d = 0; d < 7; d++) {
    const day = addDays(thisMonday, d);
    days[day] = doneDays.has(day);
    if (days[day]) done++;
  }
  let streak = 0;
  for (let i = history.length - 1; i >= 0 && history[i].adherence >= UP; i--) streak++;

  const out: Progress = { week: weeks, weekStart: thisMonday, level, target, thisWeek: { done, needed: target.days, days }, history, streak };
  if (goal.area === "weight") {
    const w = goal.settings as WeightSettings;
    const points = logs.filter((l) => l.value != null && l.value > 0).sort((a, b) => a.day.localeCompare(b.day)).map((l) => ({ day: l.day, kg: Number(l.value) }));
    const latest = points.at(-1)?.kg ?? null;
    const expected = expectedWeight(w, weeks - 1);
    out.weight = { latest, expected, onTrack: latest == null ? null : latest <= expected + 0.5, points };
  }
  return out;
}

/** Adherence across all goals for a week (for the weekly email and the plan header). */
export function weekScore(ps: Progress[]): { done: number; needed: number } {
  return ps.reduce((a, p) => ({ done: a.done + Math.min(p.thisWeek.done, p.thisWeek.needed), needed: a.needed + p.thisWeek.needed }), { done: 0, needed: 0 });
}

/* ------------------------------------------------------------------ Recommendations from results */

export interface Recommendation { area: Area; why: string }

/** Which areas would help most, from the person's latest check. */
export function recommend(input: { activeDays?: string | null; sleepHours?: string | null; bmi?: number | null; waistHigh?: boolean; bpHigh?: boolean; diabetesRisk?: "low" | "raised" | "high" | null; wellbeing?: number | null; vegDaily?: boolean | null }): Recommendation[] {
  const r: Recommendation[] = [];
  if (input.activeDays && input.activeDays !== "5+") r.push({ area: "move", why: "You're moving less than the 150 minutes a week WHO recommends." });
  if (input.sleepHours === "lt6" || input.sleepHours === "6-7") r.push({ area: "sleep", why: "You're sleeping less than the 7 hours adults need." });
  if ((input.bmi ?? 0) >= 25 || input.waistHigh) r.push({ area: "weight", why: "Losing 5% of your weight lowers your blood pressure and diabetes risk." });
  if (input.bpHigh || input.diabetesRisk === "raised" || input.diabetesRisk === "high" || input.vegDaily === false) r.push({ area: "eat", why: "Small food swaps help your blood pressure and blood sugar." });
  if (input.wellbeing != null && input.wellbeing <= 50) r.push({ area: "calm", why: "A short daily practice can lift your wellbeing score." });
  return r;
}

/** Order the eating swaps so the most useful ones come first. */
export function suggestedSwaps(input: { bpHigh?: boolean; diabetesRisk?: "low" | "raised" | "high" | null; vegDaily?: boolean | null; bmi?: number | null }): string[] {
  const order: string[] = [];
  if (input.diabetesRisk === "raised" || input.diabetesRisk === "high" || (input.bmi ?? 0) >= 25) order.push("sugary-drinks");
  if (input.bpHigh) order.push("salt");
  if (input.vegDaily === false) order.push("veg");
  for (const k of ["sugary-drinks", "salt", "veg", "portion", "fried", "snack", "late-meal"]) if (!order.includes(k)) order.push(k);
  return order;
}

/** Move start level from "days a week of brisk activity". */
export const moveStartLevel = (activeDays?: string | null) => (activeDays === "5+" ? 6 : activeDays === "2-4" ? 3 : 0);
/** Sleep start level from usual hours (already sleeping well → start with more habits). */
export const sleepStartLevel = (hours?: string | null) => (hours === "7-9" || hours === "gt9" ? 2 : 0);
