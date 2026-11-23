import { EGFR_WORDS, egfrCkdEpi2021, egfrStage, type EgfrStage } from "@/lib/scoring/tools";

/**
 * Biological age from routine blood tests: Levine's "PhenoAge".
 * Levine ME, et al. An epigenetic biomarker of aging for lifespan and healthspan. Aging 2018;10:573–591.
 *
 * Pure functions only, so the admin page can preview as results are typed and the server can
 * recalculate before saving (the server never trusts the preview).
 */

export type MarkerKey = "albumin" | "creatinine" | "glucose" | "crp" | "lymph" | "mcv" | "rdw" | "alp" | "wbc";

export type Unit = { label: string; toBase: number };

export type Marker = {
  key: MarkerKey;
  name: string;
  /** Which lab test on the request form gives this number. */
  from: string;
  /** Units a Nigerian lab report may use. The first is the unit the formula uses. */
  units: Unit[];
  /** Values outside this range (in the first unit) are almost certainly a typing or unit mistake. */
  range: [number, number];
  /** A typical healthy value (first unit), used to explain which results add or take away years. */
  typical: number;
  /** Plain-English note on what the result means. */
  about: string;
};

export const MARKERS: Marker[] = [
  { key: "albumin", name: "Albumin", from: "Liver function test (LFT)", units: [{ label: "g/L", toBase: 1 }, { label: "g/dL", toBase: 10 }], range: [15, 60], typical: 45, about: "A protein made by the liver. Higher is better." },
  { key: "creatinine", name: "Creatinine", from: "Kidney function (E/U/Cr)", units: [{ label: "µmol/L", toBase: 1 }, { label: "mg/dL", toBase: 88.4 }], range: [20, 1200], typical: 75, about: "Shows how well the kidneys clear waste." },
  { key: "glucose", name: "Fasting glucose", from: "Fasting blood sugar", units: [{ label: "mmol/L", toBase: 1 }, { label: "mg/dL", toBase: 1 / 18 }], range: [2, 35], typical: 5, about: "Blood sugar after fasting. Lower (within normal) is better." },
  { key: "crp", name: "hs-CRP", from: "hs-CRP", units: [{ label: "mg/L", toBase: 1 }, { label: "mg/dL", toBase: 10 }], range: [0, 300], typical: 1, about: "A sign of inflammation in the body. Lower is better." },
  { key: "lymph", name: "Lymphocytes", from: "Full blood count (FBC)", units: [{ label: "%", toBase: 1 }], range: [3, 85], typical: 32, about: "A type of white blood cell, as a share of all white cells." },
  { key: "mcv", name: "MCV", from: "Full blood count (FBC)", units: [{ label: "fL", toBase: 1 }], range: [50, 130], typical: 88, about: "The average size of red blood cells." },
  { key: "rdw", name: "RDW", from: "Full blood count (FBC)", units: [{ label: "%", toBase: 1 }], range: [9, 30], typical: 12.8, about: "How much red blood cells vary in size. Lower is better." },
  { key: "alp", name: "Alkaline phosphatase", from: "Liver function test (LFT)", units: [{ label: "U/L", toBase: 1 }], range: [10, 1500], typical: 70, about: "An enzyme from the liver and bones." },
  { key: "wbc", name: "White cell count", from: "Full blood count (FBC)", units: [{ label: "×10⁹/L", toBase: 1 }], range: [1, 50], typical: 6, about: "All white blood cells. Same number as ×10³/µL." },
];

export const MARKER_BY_KEY = Object.fromEntries(MARKERS.map((m) => [m.key, m])) as Record<MarkerKey, Marker>;

/** The tests to ask the lab for. */
export const BIO_AGE_TESTS = [
  "Full blood count (FBC) with differential, including RDW",
  "Liver function test (LFT), for albumin and alkaline phosphatase",
  "Kidney function: electrolytes, urea and creatinine (E/U/Cr)",
  "Fasting blood sugar",
  "hs-CRP (high-sensitivity CRP, not ordinary CRP)",
];

export const BIO_AGE_PREP = [
  "Fast for 8 to 10 hours before. Water is fine.",
  "Wait until you've been well for 2 weeks after any cold, fever or infection.",
  "Avoid very hard exercise the day before.",
];

/** Weights from Levine 2018 (units: albumin g/L, creatinine µmol/L, glucose mmol/L, CRP ln(mg/dL), WBC 10³/µL). */
const W = { albumin: -0.0336, creatinine: 0.0095, glucose: 0.1953, crp: 0.0954, lymph: -0.012, mcv: 0.0268, rdw: 0.3306, alp: 0.00188, wbc: 0.0554, age: 0.0804 } as const;
const INTERCEPT = -19.9067;
const GAMMA = 0.0076927;
/** CRP below this (mg/L) is treated as this, because the formula takes a logarithm. */
export const CRP_FLOOR = 0.1;

export type Values = Record<MarkerKey, number>;

/** Convert a typed value into the unit the formula uses. */
export function toBase(key: MarkerKey, value: number, unit: string): number {
  const u = MARKER_BY_KEY[key].units.find((x) => x.label === unit) ?? MARKER_BY_KEY[key].units[0];
  return value * u.toBase;
}

/** Problems that should stop the result being saved: a missing value or one far outside a possible range. */
export function checkValues(v: Partial<Values>): { key: MarkerKey; problem: string }[] {
  const out: { key: MarkerKey; problem: string }[] = [];
  for (const m of MARKERS) {
    const x = v[m.key];
    if (x === undefined || !Number.isFinite(x)) out.push({ key: m.key, problem: "Missing" });
    else if (x < m.range[0] || x > m.range[1]) out.push({ key: m.key, problem: `Outside ${m.range[0]}–${m.range[1]} ${m.units[0].label}. Check the number and unit.` });
  }
  return out;
}

const term = (k: MarkerKey, x: number) => (k === "crp" ? W.crp * Math.log(Math.max(x, CRP_FLOOR) / 10) : W[k] * x);

export type PhenoAgeResult = {
  phenoAge: number;
  /** Biological age minus real age. Negative means younger. */
  difference: number;
  /** 10-year mortality score from the model (only used to get the age; never shown). */
  mortality: number;
  /** Roughly how many years each result adds (+) or takes away (−) compared with a typical healthy value. */
  drivers: { key: MarkerKey; years: number }[];
};

/** Levine's PhenoAge. `age` is the person's real age, in years, on the day of the test. */
export function phenoAge(age: number, v: Values): PhenoAgeResult {
  let xb = INTERCEPT + W.age * age;
  for (const m of MARKERS) xb += term(m.key, v[m.key]);
  const mortality = 1 - Math.exp((-Math.exp(xb) * (Math.exp(120 * GAMMA) - 1)) / GAMMA);
  const pa = 141.50225 + Math.log(-0.00553 * Math.log(1 - mortality)) / 0.090165;
  // Near the usual range, PhenoAge moves by about 1/0.090165 years for each unit of xb.
  const drivers = MARKERS.map((m) => ({ key: m.key, years: (term(m.key, v[m.key]) - term(m.key, m.typical)) / 0.090165 }))
    .sort((a, b) => Math.abs(b.years) - Math.abs(a.years));
  return { phenoAge: pa, difference: pa - age, mortality, drivers };
}

/** Age in years (with decimals) on a given day, from a date of birth "YYYY-MM-DD". */
export function exactAge(dob: string, on: string): number | null {
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob), b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(on);
  if (!a || !b) return null;
  const d1 = Date.UTC(+a[1], +a[2] - 1, +a[3]), d2 = Date.UTC(+b[1], +b[2] - 1, +b[3]);
  if (Number.isNaN(d1) || Number.isNaN(d2) || d2 < d1) return null;
  return (d2 - d1) / (365.2425 * 864e5);
}

/** "3 years younger", "2 years older", "about the same as your age". */
export function differenceText(diff: number): string {
  const y = Math.round(Math.abs(diff));
  if (y === 0) return "about the same as your age";
  return `${y} year${y === 1 ? "" : "s"} ${diff < 0 ? "younger" : "older"} than your age`;
}

/** The request to send to the partner lab, ready to paste into WhatsApp or email. */
export function labRequestText(memberCode?: string | null): string {
  return [
    "Biological Age Check: tests needed",
    ...(memberCode ? [`Poveon ID: ${memberCode}`] : []),
    "",
    ...BIO_AGE_TESTS.map((t, i) => `${i + 1}. ${t}`),
    "",
    "Please make sure the report shows: albumin, alkaline phosphatase, creatinine, fasting glucose, hs-CRP, white cell count, lymphocytes (%), MCV and RDW (RDW-CV, %).",
    "",
    "Patient preparation:",
    ...BIO_AGE_PREP.map((t) => `- ${t}`),
  ].join("\n");
}

/** Kidney function (eGFR, CKD-EPI 2021) from the creatinine in the same blood test. Creatinine in µmol/L. */
export function kidneyFunction(creatinineUmol: number, age: number, sex: "female" | "male") {
  const egfr = Math.round(egfrCkdEpi2021(creatinineUmol / 88.4, age, sex));
  const stage: EgfrStage = egfrStage(egfr);
  return { egfr, stage, ...EGFR_WORDS[stage] };
}

/** Kidney function for a saved result, when its sex was recorded (results saved before eGFR have none). */
export function kidneyForResult(r: { markers: Values; age_years: number; entered: { sex?: "female" | "male" } | null }) {
  const sex = r.entered?.sex;
  return sex && Number.isFinite(r.markers.creatinine) ? kidneyFunction(r.markers.creatinine, r.age_years, sex) : null;
}
