/** Recommendations and sensible starting points from a check (pure: used on the phone and the server). */
import { ageOf, num, str, type Answers } from "@/lib/questions";
import { bmi as calcBmi, waistToHeight } from "@/lib/scoring/tools";
import type { Results } from "@/lib/scoring/results";
import { moveStartLevel, recommend, sleepStartLevel, suggestedSwaps, type Recommendation } from "./engine";

export function planHints(answers: Answers | null, results: Results | null) {
  const a = answers ?? {};
  const height = num(a, "height"), weight = num(a, "weight"), waist = num(a, "waist");
  const bmi = height && weight ? calcBmi(weight, height) : null;
  const bp = a.bp && typeof a.bp === "object" && !Array.isArray(a.bp) ? (a.bp as { sbp: number; dbp: number }) : null;
  const card = (id: string) => results?.cards.find((c) => c.id === id);
  const d = card("diabetes")?.status;
  const input = {
    activeDays: str(a, "active_days"), sleepHours: str(a, "sleep_hours"), bmi,
    waistHigh: !!(waist && height && waistToHeight(waist, height) >= 0.5),
    bpHigh: !!(bp && (bp.sbp >= 140 || bp.dbp >= 90)) || a.told_high_bp === "yes",
    diabetesRisk: d === "good" ? "low" as const : d === "check" ? "raised" as const : d === "act" ? "high" as const : null,
    wellbeing: results?.wellbeing?.score ?? null,
    vegDaily: a.veg_daily === "yes" ? true : a.veg_daily === "no" ? false : null,
  };
  const recs: Recommendation[] = recommend(input);
  return {
    recs, weightKg: weight, age: ageOf(a),
    moveStart: moveStartLevel(input.activeDays), sleepStart: sleepStartLevel(input.sleepHours),
    swaps: suggestedSwaps(input), canLoseWeight: bmi === null || bmi >= 23,
  };
}

