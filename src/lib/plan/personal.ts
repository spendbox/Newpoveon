/**
 * Makes a plan about the person, not just the topic: why each goal is in THEIR plan (from their own
 * answers and results), where it's heading, what it's built around, and what else needs their attention.
 * Pure functions: used on the plan page, in the builder and in emails.
 */
import { num, str, type Answers } from "@/lib/questions";
import { helpLabel } from "@/lib/help";
import type { ResultCard, Results } from "@/lib/scoring/results";
import { bmi as calcBmi, waistToHeight } from "@/lib/scoring/tools";
import {
  bedtimeFor, EAT_SWAPS, MOVE_LADDER, wakeLabel, weightTarget,
  type Area, type EatSettings, type Goal, type MoveSettings, type SleepSettings, type WeightSettings,
} from "./engine";

const ACTIVE_WORDS: Record<string, string> = { "0-1": "0 or 1 days", "2-4": "2 to 4 days", "5+": "5 or more days" };
const SLEEP_WORDS: Record<string, string> = { lt6: "under 6 hours", "6-7": "6 to 7 hours", "7-9": "7 to 9 hours", gt9: "over 9 hours" };
const kg1 = (n: number) => Math.round(n * 10) / 10;

function facts(a: Answers, r: Results | null) {
  const height = num(a, "height"), weight = num(a, "weight"), waist = num(a, "waist");
  const bmi = height && weight ? kg1(calcBmi(weight, height)) : null;
  const bp = a.bp && typeof a.bp === "object" && !Array.isArray(a.bp) ? (a.bp as { sbp: number; dbp: number }) : null;
  const card = (id: ResultCard["id"]) => r?.cards.find((c) => c.id === id);
  const heart = r?.heart && r.heart.heartAge.kind === "exact" ? { age: r.heart.heartAge.value, diff: r.heart.heartAge.value - r.age } : null;
  const diabetes = card("diabetes");
  return {
    weight, bmi, bp,
    waistHigh: !!(waist && height && waistToHeight(waist, height) >= 0.5),
    bpHigh: !!(bp && (bp.sbp >= 140 || bp.dbp >= 90)) || a.told_high_bp === "yes",
    active: str(a, "active_days"), sleep: str(a, "sleep_hours"), vegDaily: a.veg_daily,
    wellbeing: r?.wellbeing?.score ?? null,
    lowMood: Number(a.phq1 ?? 0) + Number(a.phq2 ?? 0) >= 3,
    worry: Number(a.gad1 ?? 0) + Number(a.gad2 ?? 0) >= 3,
    heart, diabetes: diabetes && diabetes.status !== "good" && diabetes.value !== "Diagnosed" ? diabetes.value.toLowerCase() : null,
  };
}

/** One or two sentences: why this goal is in this person's plan, using their own numbers. */
export function personalWhy(area: Area, a: Answers, r: Results | null): string {
  const f = facts(a, r);
  switch (area) {
    case "move": {
      const now = f.active ? `You move briskly on ${ACTIVE_WORDS[f.active] ?? f.active} a week, and the goal is 150 minutes.` : "The goal is 150 minutes of brisk movement a week.";
      const link = f.heart && f.heart.diff >= 1 ? ` It's one of the best ways to bring your heart age (${f.heart.age}, ${f.heart.diff} ${f.heart.diff === 1 ? "year" : "years"} above your age) back down.`
        : f.diabetes ? ` It also lowers your diabetes risk, which is ${f.diabetes} right now.`
        : f.wellbeing != null && f.wellbeing <= 50 ? ` It's also one of the quickest ways to lift your wellbeing score (${f.wellbeing}/100).`
        : " It keeps your heart, blood sugar and mood in good shape.";
      return now + link;
    }
    case "sleep": {
      const now = f.sleep ? `You usually sleep ${SLEEP_WORDS[f.sleep] ?? f.sleep} a night. Adults need at least 7.` : "Adults need at least 7 hours a night.";
      const link = f.wellbeing != null && f.wellbeing <= 60 ? ` Better sleep is often the fastest way to lift your wellbeing score (${f.wellbeing}/100).` : " Steady sleep helps your mood, weight and blood pressure.";
      return now + link;
    }
    case "weight": {
      if (!f.weight) return "Losing 5% of your weight lowers your blood pressure and diabetes risk.";
      const target = weightTarget(f.weight);
      const now = `You're ${f.weight} kg${f.bmi ? ` (BMI ${f.bmi})` : ""}${f.waistHigh ? ", with extra weight around your waist" : ""}.`;
      const gain = f.bpHigh && f.diabetes ? "lowers your blood pressure and your diabetes risk" : f.bpHigh ? "can lower your blood pressure by several points" : f.diabetes ? `cuts your diabetes risk, which is ${f.diabetes} now` : "takes strain off your heart and joints";
      return `${now} Losing ${kg1(f.weight - target)} kg, to ${target} kg, ${gain}.`;
    }
    case "eat": {
      const reasons = [
        f.bpHigh && (f.bp ? `your blood pressure was ${f.bp.sbp}/${f.bp.dbp}` : "you have high blood pressure"),
        f.diabetes && `your diabetes risk is ${f.diabetes}`,
        f.vegDaily === "no" && "you don't eat vegetables every day",
      ].filter(Boolean) as string[];
      if (!reasons.length) return "Small food swaps protect your heart and blood sugar for the long run.";
      const list = reasons.length > 1 ? `${reasons.slice(0, -1).join(", ")} and ${reasons.at(-1)}` : reasons[0];
      return `Because ${list}, your swaps start with the ones that help you most.`;
    }
    case "calm": {
      const score = f.wellbeing != null ? `Your wellbeing score is ${f.wellbeing}/100` : "Your wellbeing matters";
      const extra = f.lowMood && f.worry ? ", and you've had some low and worried days lately" : f.lowMood ? ", and you've had some low days lately" : f.worry ? ", and worry has been getting to you lately" : "";
      return `${score}${extra}. A few minutes a day, at the same time, is one of the simplest ways to feel better.`;
    }
  }
}

/** Where the goal is heading, in plain words. */
export function personalAim(goal: Goal): string {
  switch (goal.area) {
    case "move": {
      const s = goal.settings as MoveSettings;
      const steps = Math.max(0, MOVE_LADDER.length - 2 - (s.startLevel ?? 0));
      return steps > 0 ? `Aim: 30 minutes, 5 days a week (150 minutes), in about ${steps + 1} weeks if you keep up.` : "Aim: keep up 150 minutes a week, and add strength work on 2 days.";
    }
    case "sleep": {
      const s = goal.settings as SleepSettings;
      return `Aim: up at ${wakeLabel(s.wake)} and in bed by ${bedtimeFor(s.wake)}, with all 5 sleep habits in place.`;
    }
    case "weight": {
      const s = goal.settings as WeightSettings;
      const weeks = Math.max(1, Math.ceil((s.startKg - s.targetKg) / 0.5));
      return `Aim: ${s.targetKg} kg, about half a kilo a week, by around week ${weeks}.`;
    }
    case "eat": {
      const s = goal.settings as EatSettings;
      const first = EAT_SWAPS[s.swaps[0]]?.title;
      return `Aim: ${s.swaps.length} swaps that stick, one new one every 2 weeks${first ? `, starting with: ${first.charAt(0).toLowerCase()}${first.slice(1)}` : ""}.`;
    }
    case "calm":
      return "Aim: a few calm minutes on 5 days a week, and a higher wellbeing score at your next check.";
  }
}

/** "Moderate" → "moderate", but leave "BMI 29.7" and "148/94" alone. */
const soften = (v: string) => (/^[A-Z][a-z]/.test(v) ? v.charAt(0).toLowerCase() + v.slice(1) : v);

/** The results the plan is built around, as short chips. */
export function planFocus(r: Results | null): string[] {
  if (!r) return [];
  const chips: string[] = [];
  if (r.heart && r.heart.heartAge.kind === "exact") chips.push(`Heart age ${r.heart.heartAge.value}`);
  if (r.wellbeing) chips.push(`Wellbeing ${r.wellbeing.score}/100`);
  for (const id of ["diabetes", "bp", "body", "sleep", "kidney"] as const) {
    const c = r.cards.find((x) => x.id === id);
    if (c && c.status !== "good") chips.push(`${c.topic}: ${soften(c.value)}`);
  }
  return chips.slice(0, 5);
}

export type Extra = { id: string; title: string; text: string; href: string; label: string };

/** Other results that need attention but aren't plan goals (smoking, alcohol, BP, kidneys...). Up to 3, most urgent first. */
export function personalExtras(r: Results | null): Extra[] {
  if (!r) return [];
  const order: ResultCard["id"][] = ["smoking", "bp", "kidney", "alcohol", "diabetes", "sleep"];
  const rank = { act: 0, check: 1, good: 2 } as const;
  return r.cards
    .filter((c) => order.includes(c.id) && c.status !== "good" && !(c.id === "diabetes" && c.status !== "act"))
    .sort((x, y) => rank[x.status] - rank[y.status] || order.indexOf(x.id) - order.indexOf(y.id))
    .slice(0, 3)
    .map((c) => ({
      id: c.id, title: c.value.toLowerCase() === c.topic.toLowerCase() ? c.topic : `${c.topic}: ${soften(c.value)}`, text: c.summary,
      href: c.next.kind === "test" ? `/home-tests?test=${encodeURIComponent(c.next.testCode)}` : c.next.kind === "doctor" ? "/doctor" : `/learn/${c.id}`,
      label: c.next.kind === "retest" ? "Learn more" : helpLabel(c.next.label),
    }));
}

/** A calm practice that fits: walking for low mood, breathing for worry, connecting when wellbeing is low. */
export function calmFor(a: Answers, r: Results | null): { practice: string; cue: string } {
  const f = facts(a, r);
  if (f.lowMood) return { practice: "walk", cue: "At lunchtime" };
  if (f.worry) return { practice: "breathe", cue: "Before bed" };
  return { practice: "connect", cue: "At lunchtime" };
}
