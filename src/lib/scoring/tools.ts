/**
 * Validated screening tools. Each function scores exactly as the published tool does.
 * Full citations and licences: SCREENING_TOOLS.md at the project root.
 */
import type { Sex } from "./who-cvd";

/* ------------------------------------------------------------------ BMI & waist-to-height */

/** BMI = weight (kg) / height (m)². WHO adult BMI classification (WHO Technical Report Series 894, 2000). */
export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export type BmiClass = "underweight" | "healthy" | "overweight" | "obesity";
export function bmiClass(value: number): BmiClass {
  if (value < 18.5) return "underweight";
  if (value < 25) return "healthy";
  if (value < 30) return "overweight";
  return "obesity";
}

/**
 * Waist-to-height ratio. Boundary values: ≥0.5 "increased" (consider action), ≥0.6 "high" (take action).
 * Ashwell M, Gunn P, Gibson S. Obes Rev 2012;13:275–286; NICE guideline CG189 (2022 update) on waist-to-height ratio.
 */
export function waistToHeight(waistCm: number, heightCm: number): number {
  return waistCm / heightCm;
}
export type WhtrClass = "healthy" | "increased" | "high";
export function whtrClass(r: number): WhtrClass {
  if (r >= 0.6) return "high";
  if (r >= 0.5) return "increased";
  return "healthy";
}

/* ------------------------------------------------------------------ FINDRISC */

/**
 * FINDRISC — Finnish Diabetes Risk Score.
 * Lindström J, Tuomilehto J. The diabetes risk score: a practical tool to predict type 2 diabetes risk.
 * Diabetes Care 2003;26(3):725–731. Scoring as on the official Finnish Diabetes Association form.
 * Total 0–26. Bands (official form): <7 low, 7–11 slightly elevated, 12–14 moderate, 15–20 high, >20 very high.
 */
export interface FindriscInputs {
  age: number;
  bmi: number;
  sex: Sex;
  /** null when the person could not measure their waist. */
  waistCm: number | null;
  dailyActivity30: boolean;
  vegFruitDaily: boolean;
  everBpMeds: boolean;
  everHighGlucose: boolean;
  familyDiabetes: "none" | "second" | "first";
}

export function findrisc(x: FindriscInputs) {
  let score = 0;
  score += x.age < 45 ? 0 : x.age <= 54 ? 2 : x.age <= 64 ? 3 : 4;
  score += x.bmi < 25 ? 0 : x.bmi <= 30 ? 1 : 3;
  let waistMissing = false;
  if (x.waistCm === null) {
    waistMissing = true; // waist contributes 0–4: the true score is at least `score`.
  } else if (x.sex === "male") {
    score += x.waistCm < 94 ? 0 : x.waistCm <= 102 ? 3 : 4;
  } else {
    score += x.waistCm < 80 ? 0 : x.waistCm <= 88 ? 3 : 4;
  }
  score += x.dailyActivity30 ? 0 : 2;
  score += x.vegFruitDaily ? 0 : 1;
  score += x.everBpMeds ? 2 : 0;
  score += x.everHighGlucose ? 5 : 0;
  score += x.familyDiabetes === "first" ? 5 : x.familyDiabetes === "second" ? 3 : 0;
  return { score, waistMissing, band: findriscBand(score) };
}

export type FindriscBand = "low" | "slightly elevated" | "moderate" | "high" | "very high";
export function findriscBand(score: number): FindriscBand {
  if (score < 7) return "low";
  if (score <= 11) return "slightly elevated";
  if (score <= 14) return "moderate";
  if (score <= 20) return "high";
  return "very high";
}
/** Ten-year risk wording printed on the official FINDRISC form for each band. */
export const FINDRISC_BAND_RISK: Record<FindriscBand, string> = {
  low: "about 1 in 100",
  "slightly elevated": "about 1 in 25",
  moderate: "about 1 in 6",
  high: "about 1 in 3",
  "very high": "about 1 in 2",
};

/* ------------------------------------------------------------------ STOP-BANG */

/**
 * STOP-Bang questionnaire for obstructive sleep apnoea.
 * Chung F, et al. Anesthesiology 2008;108:812–821 (derivation);
 * Chung F, Abdullah HR, Liao P. Chest 2016;149:631–638 (scoring update, incl. the "STOP ≥2 +" rule).
 * Items: Snoring, Tired, Observed apnoea, high blood Pressure, BMI >35, Age >50, Neck >40 cm, male Gender.
 * Risk: 0–2 low, 3–4 intermediate, 5–8 high. Also high if STOP ≥2 and (male, BMI >35 or neck >40 cm).
 */
export interface StopBangInputs {
  snoring: boolean;
  tired: boolean;
  observed: boolean;
  pressure: boolean;
  bmi: number;
  age: number;
  neckOver40: boolean;
  sex: Sex;
}
export function stopBang(x: StopBangInputs) {
  const stop = [x.snoring, x.tired, x.observed, x.pressure].filter(Boolean).length;
  const b = x.bmi > 35;
  const a = x.age > 50;
  const n = x.neckOver40;
  const g = x.sex === "male";
  const score = stop + [b, a, n, g].filter(Boolean).length;
  let risk: "low" | "intermediate" | "high" = score <= 2 ? "low" : score <= 4 ? "intermediate" : "high";
  if (risk !== "high" && stop >= 2 && (g || b || n)) risk = "high";
  return { score, stop, risk };
}

/* ------------------------------------------------------------------ PHQ-2 / PHQ-9 */

/**
 * PHQ-9 and PHQ-2. Kroenke K, Spitzer RL, Williams JBW. J Gen Intern Med 2001;16:606–613 (PHQ-9);
 * Kroenke K, et al. Med Care 2003;41:1284–1292 (PHQ-2, cut-off ≥3). Items scored 0–3.
 * PHQ-9 severity: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–19 moderately severe, 20–27 severe.
 */
export const phq2Positive = (item1: number, item2: number) => item1 + item2 >= 3;
export function phq9(items: number[]) {
  if (items.length !== 9) throw new Error("PHQ-9 needs 9 items");
  const score = items.reduce((s, v) => s + v, 0);
  const severity =
    score <= 4 ? "minimal" : score <= 9 ? "mild" : score <= 14 ? "moderate" : score <= 19 ? "moderately severe" : "severe";
  return { score, severity, selfHarmFlag: items[8] > 0 } as const;
}

/* ------------------------------------------------------------------ GAD-2 / GAD-7 */

/**
 * GAD-7: Spitzer RL, Kroenke K, Williams JBW, Löwe B. Arch Intern Med 2006;166:1092–1097.
 * GAD-2: Kroenke K, et al. Ann Intern Med 2007;146:317–325 (cut-off ≥3).
 * GAD-7 severity: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–21 severe.
 */
export const gad2Positive = (item1: number, item2: number) => item1 + item2 >= 3;
export function gad7(items: number[]) {
  if (items.length !== 7) throw new Error("GAD-7 needs 7 items");
  const score = items.reduce((s, v) => s + v, 0);
  const severity = score <= 4 ? "minimal" : score <= 9 ? "mild" : score <= 14 ? "moderate" : "severe";
  return { score, severity } as const;
}

/* ------------------------------------------------------------------ AUDIT-C */

/**
 * AUDIT-C (first three AUDIT questions, each 0–4; total 0–12).
 * Bush K, et al. Arch Intern Med 1998;158:1789–1795. Positive screen: men ≥4, women ≥3
 * (Bradley KA, et al. Alcohol Clin Exp Res 2007;31:1208–1217).
 */
export function auditC(q1: number, q2: number, q3: number, sex: Sex) {
  const score = q1 + q2 + q3;
  return { score, positive: score >= (sex === "male" ? 4 : 3) };
}

/* ------------------------------------------------------------------ Blood pressure */

/**
 * Office blood pressure categories.
 * Hypertension ≥140 systolic and/or ≥90 diastolic: WHO Guideline for the pharmacological treatment of
 * hypertension in adults (2021). Grade 3 (≥180 and/or ≥110): ISH 2020 Global Hypertension Practice
 * Guidelines (Unger T, et al. Hypertension 2020;75:1334–1357).
 */
export type BpClass = "normal" | "hypertension" | "severe";
export function bpClass(sbp: number, dbp: number): BpClass {
  if (sbp >= 180 || dbp >= 110) return "severe";
  if (sbp >= 140 || dbp >= 90) return "hypertension";
  return "normal";
}

/* ------------------------------------------------------------------ Activity & sleep */

/**
 * WHO 2020 guidelines on physical activity and sedentary behaviour: adults should do at least
 * 150–300 minutes of moderate-intensity activity a week. "5 or more days of 30+ minutes" meets this.
 */
export const meetsWhoActivity = (days: "0-1" | "2-4" | "5+") => days === "5+";

/**
 * Sleep duration: adults should regularly sleep 7 or more hours a night.
 * Watson NF, et al. (AASM/SRS consensus). Sleep 2015;38(6):843–844.
 */
export const meetsSleepGuideline = (h: "lt6" | "6-7" | "7-9" | "gt9") => h === "7-9" || h === "gt9";

/* ------------------------------------------------------------------ WHO-5 Well-Being Index */

/**
 * WHO-5 Well-Being Index (WHO Regional Office for Europe, 1998; Psychiatric Research Unit, Mental Health Centre
 * North Zealand). Five items, each 0–5 ("At no time" … "All of the time"); raw 0–25, multiplied by 4 to give 0–100.
 * Cut-offs from the systematic review by Topp CW, Østergaard SD, Søndergaard S, Bech P. Psychother Psychosom
 * 2015;84:167–176: ≤50 suggests poor wellbeing (screen for depression); ≤28 suggests likely depression.
 */
export type Who5Band = "good" | "low" | "very low";
export function who5(items: number[]) {
  if (items.length !== 5 || items.some((v) => !Number.isInteger(v) || v < 0 || v > 5)) throw new Error("WHO-5 needs 5 items scored 0–5");
  const raw = items.reduce((s, v) => s + v, 0);
  const score = raw * 4;
  const band: Who5Band = score <= 28 ? "very low" : score <= 50 ? "low" : "good";
  return { raw, score, band } as const;
}
