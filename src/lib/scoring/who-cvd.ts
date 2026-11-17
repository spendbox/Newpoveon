/**
 * WHO 2019 cardiovascular disease (CVD) risk — NON-LABORATORY model,
 * recalibrated for the Western Sub-Saharan Africa GBD region (which includes Nigeria).
 *
 * SOURCES (do not change any number in this file without updating these):
 *  - Paper: WHO CVD Risk Chart Working Group (Kaptoge S, Pennells L, De Bacquer D, et al.).
 *    "World Health Organization cardiovascular disease risk charts: revised models to estimate
 *    risk in 21 global regions." Lancet Glob Health 2019;7(10):e1332–e1345.
 *    doi:10.1016/S2214-109X(19)30318-3
 *  - Model coefficients and baseline survival: the authors' own Stata code,
 *    `whocvdrisk_erfc_score_v03.ado` ("Non-laboratory/BMI model", lp_m2_chd and lp_m2_crbv),
 *    by Dr Stephen Kaptoge, Cardiovascular Epidemiology Unit, University of Cambridge.
 *    https://github.com/skkceu/stata
 *  - Recalibration parameters: the authors' file `whocvdrisk_t10_calparms_gbd_sens0.dta`
 *    (same repository), region "A01GBDR_005_WSSA" (Western Sub-Saharan Africa), columns
 *    cal2_m2_{cons,slope}_ep_{chdmi,crbv}. Nigeria (ccode NGA) uses identical region values.
 *  - Cross-checked against the CRAN package WHORiskCalculator 1.1.0 (WHO CVD Risk Chart Working
 *    Group / A. Pedot), whose non-lab WSSA parameters match these exactly.
 *
 * METHOD (as in whocvdrisk.ado):
 *  1. Uncalibrated 10-year risk for CHD and for stroke: 1 - S0 ^ exp(LP)
 *  2. Recalibrate each on the complementary log-log scale:
 *     risk_cal = 1 - exp(-exp(cons + slope * ln(-ln(1 - risk))))
 *  3. Combine assuming independence: CVD = 1 - (1 - CHD)(1 - stroke)
 *
 * Inputs: age (years, model range 40–80), sex, systolic BP (mmHg), BMI (kg/m²), current smoker.
 * Not for people who already have CVD (heart attack, stroke) — they are high risk by definition.
 */

export type Sex = "male" | "female";

export interface WhoInputs {
  age: number;
  sex: Sex;
  sbp: number;
  bmi: number;
  smoker: boolean;
}

export const WHO_MIN_AGE = 40;
export const WHO_MAX_AGE = 80;

interface Coef { age: number; bmi: number; sbp: number; smk: number; ageBmi: number; ageSbp: number; ageSmk: number; s0: number }

/** Non-laboratory model coefficients (Kaptoge, whocvdrisk_erfc_score_v03.ado). */
const COEF: Record<Sex, { chd: Coef; stroke: Coef }> = {
  male: {
    chd: { age: 0.073593, bmi: 0.0337219, sbp: 0.0133937, smk: 0.5954767, ageBmi: -0.0010432, ageSbp: -0.0001837, ageSmk: -0.0200831, s0: 0.9544258 },
    stroke: { age: 0.097674, bmi: 0.0159518, sbp: 0.0227294, smk: 0.4999862, ageBmi: -0.0003516, ageSbp: -0.0004374, ageSmk: -0.0153895, s0: 0.984826 },
  },
  female: {
    chd: { age: 0.1049418, bmi: 0.0257616, sbp: 0.016726, smk: 1.093132, ageBmi: -0.0006537, ageSbp: -0.0001966, ageSmk: -0.0343739, s0: 0.9887124 },
    stroke: { age: 0.1046105, bmi: 0.0036406, sbp: 0.0216741, smk: 0.7399405, ageBmi: -0.0000129, ageSbp: -0.0005311, ageSmk: -0.0203997, s0: 0.9885706 },
  },
};

/** Western Sub-Saharan Africa recalibration (cal2 = GBD region level), by calendar year. */
export const WSSA_CALIBRATION = [
  { year: 1990, sex: "male", chdCons: -0.18411143124103546, chdSlope: 1.0539997816085815, strokeCons: -0.853760838508606, strokeSlope: 0.6556707620620728 },
  { year: 1990, sex: "female", chdCons: 0.0004382734186947346, chdSlope: 0.8343873023986816, strokeCons: -0.6321090459823608, strokeSlope: 0.6387560367584229 },
  { year: 1995, sex: "male", chdCons: -0.061517734080553055, chdSlope: 1.0948243141174316, strokeCons: -0.8938395380973816, strokeSlope: 0.6405266523361206 },
  { year: 1995, sex: "female", chdCons: 0.13651889562606812, chdSlope: 0.8626863360404968, strokeCons: -0.6502524614334106, strokeSlope: 0.6288045048713684 },
  { year: 2000, sex: "male", chdCons: -0.0884164348244667, chdSlope: 1.0906356573104858, strokeCons: -0.9639678597450256, strokeSlope: 0.6241751313209534 },
  { year: 2000, sex: "female", chdCons: 0.09723742306232452, chdSlope: 0.8584244847297668, strokeCons: -0.6792927980422974, strokeSlope: 0.6274518966674805 },
  { year: 2005, sex: "male", chdCons: -0.114840567111969, chdSlope: 1.090455174446106, strokeCons: -1.0234242677688599, strokeSlope: 0.6110687255859375 },
  { year: 2005, sex: "female", chdCons: 0.02549416944384575, chdSlope: 0.8495661020278931, strokeCons: -0.7025144696235657, strokeSlope: 0.6280272603034973 },
  { year: 2010, sex: "male", chdCons: -0.23127013444900513, chdSlope: 1.0622096061706543, strokeCons: -1.0228006839752197, strokeSlope: 0.6173129081726074 },
  { year: 2010, sex: "female", chdCons: -0.1864868551492691, chdSlope: 0.8168664574623108, strokeCons: -0.699499785900116, strokeSlope: 0.6416852474212646 },
  { year: 2015, sex: "male", chdCons: -0.3366033434867859, chdSlope: 1.0399974584579468, strokeCons: -0.9966400265693665, strokeSlope: 0.6364582180976868 },
  { year: 2015, sex: "female", chdCons: -0.4116963744163513, chdSlope: 0.7746351361274719, strokeCons: -0.7102575302124023, strokeSlope: 0.655157744884491 },
  { year: 2016, sex: "male", chdCons: -0.3504081666469574, chdSlope: 1.0384222269058228, strokeCons: -0.9835264682769775, strokeSlope: 0.6436071991920471 },
  { year: 2016, sex: "female", chdCons: -0.4573037326335907, chdSlope: 0.7670497298240662, strokeCons: -0.7141013741493225, strokeSlope: 0.6593096256256104 },
  { year: 2017, sex: "male", chdCons: -0.36387184262275696, chdSlope: 1.0364793539047241, strokeCons: -0.9692327976226807, strokeSlope: 0.6512733697891235 },
  { year: 2017, sex: "female", chdCons: -0.50197434425354, chdSlope: 0.7591237425804138, strokeCons: -0.7182005047798157, strokeSlope: 0.663612961769104 },
] as const;

/** The published WHO charts use the most recent GBD year in the authors' files (2017). */
export const DEFAULT_CALIBRATION_YEAR = 2017;

/** As in whocvdrisk.ado: years up to 2015 are rounded down to 5-year periods. */
function calibrationFor(sex: Sex, year: number) {
  const y = year <= 2015 ? 5 * Math.floor(year / 5) : year;
  const row = WSSA_CALIBRATION.find((r) => r.sex === sex && r.year === y);
  if (!row) throw new Error(`No WHO WSSA calibration for ${sex} ${year}`);
  return row;
}

function linearPredictor(c: Coef, x: WhoInputs) {
  const a = x.age - 60;
  const b = x.bmi - 25;
  const s = x.sbp - 120;
  const k = x.smoker ? 1 : 0;
  return c.age * a + c.bmi * b + c.sbp * s + c.smk * k + c.ageBmi * a * b + c.ageSbp * a * s + c.ageSmk * a * k;
}

const recalibrate = (risk: number, cons: number, slope: number) =>
  1 - Math.exp(-Math.exp(cons + slope * Math.log(-Math.log(1 - risk))));

/** 10-year CVD risk (0–1). Does NOT enforce the age range — see whoCvdRisk for the safe wrapper. */
export function whoCvdRiskRaw(x: WhoInputs, year = DEFAULT_CALIBRATION_YEAR): number {
  const co = COEF[x.sex];
  const cal = calibrationFor(x.sex, year);
  const chdUncal = 1 - Math.pow(co.chd.s0, Math.exp(linearPredictor(co.chd, x)));
  const strUncal = 1 - Math.pow(co.stroke.s0, Math.exp(linearPredictor(co.stroke, x)));
  const chd = recalibrate(chdUncal, cal.chdCons, cal.chdSlope);
  const str = recalibrate(strUncal, cal.strokeCons, cal.strokeSlope);
  return 1 - (1 - chd) * (1 - str);
}

/** Returns null when the person is outside the model's age range (40–80). */
export function whoCvdRisk(x: WhoInputs, year = DEFAULT_CALIBRATION_YEAR): number | null {
  if (x.age < WHO_MIN_AGE || x.age > WHO_MAX_AGE) return null;
  return whoCvdRiskRaw(x, year);
}

/** WHO chart risk bands (Kaptoge 2019 charts). */
export function whoRiskBand(risk: number): "<5%" | "5% to <10%" | "10% to <20%" | "20% to <30%" | "≥30%" {
  const p = risk * 100;
  if (p < 5) return "<5%";
  if (p < 10) return "5% to <10%";
  if (p < 20) return "10% to <20%";
  if (p < 30) return "20% to <30%";
  return "≥30%";
}

/**
 * HEART AGE — definition supplied by Poveon: "the age at which a person of the same sex with
 * healthy risk factors has the same 10-year risk". It is solved numerically on the WHO model above.
 *
 * ⚠️ The "healthy risk factor" values are a CLINICAL DECISION, not part of the WHO publication.
 * They live in src/config/site.ts (HEART_AGE_REFERENCE) and must be signed off by a clinician.
 */
export interface HeartAgeReference {
  sbp: number;
  bmi: number;
  smoker: false;
}

export type HeartAge =
  | { kind: "exact"; value: number }
  | { kind: "below"; value: number } // younger than the model's minimum age
  | { kind: "above"; value: number }; // older than the model's maximum age

export function heartAge(x: WhoInputs, ref: HeartAgeReference, year = DEFAULT_CALIBRATION_YEAR): HeartAge | null {
  const risk = whoCvdRisk(x, year);
  if (risk === null) return null;
  const refRisk = (age: number) => whoCvdRiskRaw({ age, sex: x.sex, sbp: ref.sbp, bmi: ref.bmi, smoker: false }, year);
  if (risk <= refRisk(WHO_MIN_AGE)) return { kind: "below", value: WHO_MIN_AGE };
  if (risk >= refRisk(WHO_MAX_AGE)) return { kind: "above", value: WHO_MAX_AGE };
  // Reference risk rises with age, so bisection finds the unique crossing point.
  let lo = WHO_MIN_AGE;
  let hi = WHO_MAX_AGE;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (refRisk(mid) < risk) lo = mid;
    else hi = mid;
  }
  return { kind: "exact", value: Math.round((lo + hi) / 2) };
}
