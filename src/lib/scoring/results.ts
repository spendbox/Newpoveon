/**
 * Turns questionnaire answers into results. Pure functions: the same answers always give the same
 * results, on the phone and on the server (the server always recomputes; it never trusts the browser).
 */
import { EXTENDED_MIN_AGE, HEART_AGE_REFERENCE } from "@/config/site";
import { type Answers, type BpValue, ageOf, num, str } from "@/lib/questions";
import { heartAge, isExtrapolated, whoCvdRisk, whoRiskBand, WHO_MAX_AGE, type HeartAge, type Sex } from "./who-cvd";
import {
  auditC, bmi as calcBmi, bmiClass, bpClass, FINDRISC_BAND_RISK, findrisc, gad2Positive, gad7, meetsSleepGuideline,
  meetsWhoActivity, phq2Positive, phq9, scored, stopBang, waistToHeight, whtrClass, who5, type Who5Band,
} from "./tools";

export const RESULTS_VERSION = 1;

export type Status = "good" | "check" | "act";
export const STATUS_LABEL: Record<Status, string> = { good: "Looking good", check: "Worth checking", act: "Act on this" };

export type NextStep =
  | { kind: "doctor"; label: string }
  | { kind: "test"; label: string; testCode: string }
  | { kind: "retest"; label: string; months: number };

export interface ResultCard {
  id: "wellbeing" | "heart" | "bp" | "diabetes" | "kidney" | "body" | "sleep" | "mood" | "anxiety" | "alcohol" | "smoking" | "activity";
  topic: string;
  status: Status;
  /** Short headline value, e.g. "Low" or "BMI 27.1". */
  value: string;
  /** One or two plain sentences. */
  summary: string;
  /** Names the tool, e.g. "Estimate based on FINDRISC." */
  basis: string;
  next: NextStep;
  /** Sensitive cards are never shown on share cards or share pages. */
  sensitive: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  source: string;
  testCode?: string;
}

export interface HeartResult {
  riskPercent: number; // one decimal
  band: string;
  heartAge: HeartAge;
  /** Uses the WHO formula below age 40, outside the range it was tested on. */
  earlyEstimate: boolean;
}

export interface WellbeingResult {
  /** 0–100 (WHO-5 raw score × 4). */
  score: number;
  band: Who5Band;
}

export interface Results {
  version: number;
  /** WHO-5. Missing on results saved before wellbeing was added. */
  wellbeing?: WellbeingResult | null;
  age: number;
  sex: Sex;
  heart: HeartResult | null;
  /** Why heart age could not be calculated, if it couldn't. */
  heartNote: string | null;
  cards: ResultCard[];
  reminders: Reminder[];
  /** PHQ-9 item 9 answered above "Not at all". */
  selfHarmFlag: boolean;
}

const retest = (months: number): NextStep => ({ kind: "retest", label: `Check again in ${months} months`, months });
const doctor = (label = "Talk to a doctor"): NextStep => ({ kind: "doctor", label });
const test = (testCode: string, label: string): NextStep => ({ kind: "test", testCode, label });
const pct = (p: number) => Math.round(p * 1000) / 10;

export function computeResults(a: Answers): Results {
  const age = ageOf(a) ?? 0;
  const sex = (str(a, "sex") ?? "female") as Sex;
  const height = num(a, "height");
  const weight = num(a, "weight");
  const waist = num(a, "waist"); // null when "unknown"
  const bmi = height && weight ? calcBmi(weight, height) : null;
  const smoker = a.smoking === "current";
  const bp = a.bp_known === "yes" && typeof a.bp === "object" && !Array.isArray(a.bp) ? (a.bp as BpValue) : null;
  const hasCvd = a.cvd_history === "yes";
  const hasDiabetes = a.diabetes_dx === "yes";

  const cards: ResultCard[] = [];

  /* ---------- Wellbeing (WHO-5) ---------- */
  let wellbeing: WellbeingResult | null = null;
  {
    const items = [1, 2, 3, 4, 5].map((i) => a[`who${i}`]);
    if (items.every((v) => v !== undefined)) {
      const w = who5(items.map(Number));
      wellbeing = { score: w.score, band: w.band };
      const status: Status = w.band === "good" ? "good" : w.band === "low" ? "check" : "act";
      cards.push({
        id: "wellbeing", topic: "Wellbeing", status, sensitive: true,
        value: `${w.score} / 100`,
        summary:
          w.band === "good" ? "You've been feeling well most of the time over the last two weeks. Keep doing what works for you."
          : w.band === "low" ? "Your wellbeing has been lower than usual. Small changes help, and talking to someone can too."
          : "You've been feeling low for much of the last two weeks. Please talk to a doctor. Feeling better is very possible.",
        basis: "Based on the WHO-5 Well-Being Index.",
        next: w.band === "good" ? retest(3) : doctor("Talk to a doctor"),
      });
    }
  }

  /* ---------- Heart (WHO 2019 non-lab) ---------- */
  let heart: HeartResult | null = null;
  let heartNote: string | null = null;
  if (hasCvd) {
    heartNote = "Because you've had a heart attack or stroke, risk charts don't apply. Regular reviews with a doctor matter most.";
    cards.push({
      id: "heart", topic: "Heart health", status: "act", value: "Keep up reviews", sensitive: false,
      summary: "After a heart attack or stroke, the best protection is regular check-ups and taking your medicines.",
      basis: "WHO risk charts are not used for people who already have heart disease.", next: doctor("Book a review"),
    });
  } else if (age < EXTENDED_MIN_AGE || age > WHO_MAX_AGE) {
    heartNote = age < EXTENDED_MIN_AGE
      ? `No heart age yet: it starts at ${EXTENDED_MIN_AGE}. The WHO heart model wasn't built for people under ${EXTENDED_MIN_AGE}, so any number would be a guess. Your other results below still count.`
      : `The WHO heart risk model covers ages up to ${WHO_MAX_AGE}, so we can't give a heart age. A doctor can review your heart health.`;
  } else if (!bp || !bmi) {
    heartNote = "We need a real blood pressure reading to work out your heart age.";
    cards.push({
      id: "heart", topic: "Heart age", status: "check", value: "Needs a BP reading", sensitive: false,
      summary: "We need a real blood pressure reading for your heart age. Book a home check and we'll work it out.",
      basis: "Estimate based on WHO 2019 risk charts (needs blood pressure).", next: test("bp-check", "Book a BP check"),
    });
  } else {
    const inputs = { age, sex, sbp: bp.sbp, bmi, smoker };
    const risk = whoCvdRisk(inputs, undefined, EXTENDED_MIN_AGE)!;
    const ha = heartAge(inputs, HEART_AGE_REFERENCE, undefined, EXTENDED_MIN_AGE)!;
    const early = isExtrapolated(age, ha);
    heart = { riskPercent: pct(risk), band: whoRiskBand(risk), heartAge: ha, earlyEstimate: early };
    const status: Status = risk < 0.1 ? "good" : risk < 0.2 ? "check" : "act";
    const haText = ha.kind === "below" ? `under ${ha.value}` : ha.kind === "above" ? `over ${ha.value}` : String(ha.value);
    cards.push({
      id: "heart", topic: "Heart age", status, value: `${haText} years`, sensitive: false,
      summary: `Your chance of a heart attack or stroke in the next 10 years is about ${pct(risk)}%: roughly ${Math.max(1, Math.round(risk * 100))} in 100 people with your numbers. ${status === "good" ? "That's a low risk." : status === "check" ? "That's a raised risk, and it can come down." : "That's a high risk. Treatment lowers it."}`,
      basis: early
        ? "Early estimate: uses the WHO 2019 risk charts (non-lab, West Africa) below age 40, younger than the ages they were tested on."
        : "Estimate based on WHO 2019 risk charts (non-lab, West Africa).",
      next: status === "good" ? retest(12) : doctor(),
    });
  }

  /* ---------- Blood pressure ---------- */
  if (bp) {
    const c = bpClass(bp.sbp, bp.dbp);
    cards.push({
      id: "bp", topic: "Blood pressure", sensitive: false,
      status: c === "normal" ? "good" : "act",
      value: `${bp.sbp}/${bp.dbp}`,
      summary:
        c === "normal" ? "Your reading is below 140/90, so blood pressure isn't adding to your risk of stroke or heart attack." :
        c === "hypertension" ? "Your reading is 140/90 or higher. High blood pressure raises your risk of stroke, heart attack and kidney disease. One reading isn't a diagnosis, so get it rechecked." :
        "Your reading is very high (180/110 or more). Please see a doctor soon. If you have chest pain, a bad headache or weakness, call 112 now.",
      basis: "Based on WHO 2021 blood pressure thresholds.",
      next: c === "normal" ? retest(12) : doctor(),
    });
  } else {
    cards.push({
      id: "bp", topic: "Blood pressure", status: "check", value: "Unknown", sensitive: false,
      summary: "High blood pressure usually has no symptoms. A quick check tells you where you stand.",
      basis: "Based on WHO 2021 blood pressure thresholds.", next: test("bp-check", "Book a BP check"),
    });
  }

  /* ---------- Diabetes (FINDRISC) ---------- */
  if (hasDiabetes) {
    cards.push({
      id: "diabetes", topic: "Diabetes", status: "check", value: "Diagnosed", sensitive: false,
      summary: "You already know you have diabetes. Regular sugar checks and reviews keep you on track.",
      basis: "FINDRISC is for people without diabetes, so we didn't score it.", next: test("blood-sugar", "Order a sugar test"),
    });
  } else if (bmi) {
    const f = findrisc({
      age, bmi, sex, waistCm: waist, dailyActivity30: a.active_daily === "yes", vegFruitDaily: a.veg_daily === "yes",
      everBpMeds: a.bp_meds === "yes", everHighGlucose: a.high_sugar === "yes",
      familyDiabetes: (str(a, "family_diabetes") ?? "none") as "none" | "second" | "first",
    });
    const status: Status = f.score < 7 ? "good" : f.score < 12 ? "check" : "act";
    const prefix = f.waistMissing ? "at least " : "";
    cards.push({
      id: "diabetes", topic: "Diabetes risk", status, sensitive: false,
      value: `${f.band[0].toUpperCase()}${f.band.slice(1)}`,
      summary:
        `Your score is ${prefix}${f.score} out of 26. About ${FINDRISC_BAND_RISK[f.band].replace("about ", "")} people with this score develop type 2 diabetes within 10 years.` +
        (f.waistMissing ? " Add your waist size for a full score." : "") +
        (status === "act" ? " A high score means you should get a sugar test. It doesn't mean you have diabetes." : ""),
      basis: "Estimate based on FINDRISC.",
      next: status === "good" ? retest(12) : test("blood-sugar", "Order a sugar test"),
    });
  }

  /* ---------- Kidneys (SCORED) ---------- */
  // Only for checks that asked the kidney questions (older saved checks simply have no kidney card).
  if (Array.isArray(a.kidney_conditions)) {
    const told = new Set(a.kidney_conditions as string[]);
    const hypertension = a.told_high_bp === "yes" || a.bp_meds === "yes";
    const familyKidney = a.family_kidney === "yes";
    const sickle = told.has("sickle");
    // SCORED gives no points before 50, so it can miss younger people (see the kidney guide).
    const youngNote = age < 40 ? " This score is most accurate from age 50. At your age, a low score is reassuring but not a guarantee: if you have swollen feet, foamy urine, or often take painkillers or herbal mixtures, get a kidney test." : "";
    const s = scored({
      age, sex, anaemia: told.has("anaemia"), hypertension, diabetes: hasDiabetes, cvd: hasCvd,
      heartFailure: told.has("heart_failure"), pvd: told.has("pvd"), proteinuria: told.has("protein"),
    });
    const checkTest = test("kidney-check", "Get a kidney check");
    if (told.has("ckd")) {
      cards.push({
        id: "kidney", topic: "Kidneys", status: "check", value: "Kidney disease", sensitive: true,
        summary: "You already know you have kidney disease. Regular blood and urine tests, and keeping blood pressure and sugar in range, protect your kidneys.",
        basis: "SCORED is for people who don't know they have kidney disease, so we didn't score it.", next: doctor("Talk to a doctor"),
      });
    } else if (s.high) {
      cards.push({
        id: "kidney", topic: "Kidney risk", status: "check", value: "Higher risk", sensitive: true,
        summary: `Your score is ${s.score} out of 12. About 1 in 5 people with a score of 4 or more have kidney disease without knowing it. A simple blood and urine test will tell you.${familyKidney ? " Kidney failure in your family is another reason to check." : ""}${sickle ? " Sickle cell disease is another reason to check." : ""}`,
        basis: "Estimate based on SCORED.", next: checkTest,
      });
    } else if (hasDiabetes || hypertension || familyKidney || sickle) {
      const why = [hasDiabetes && "diabetes", hypertension && "high blood pressure", sickle && "sickle cell disease", familyKidney && "kidney failure in your family"].filter(Boolean) as string[];
      cards.push({
        id: "kidney", topic: "Kidney risk", status: "check", value: "Worth a yearly test", sensitive: true,
        summary: `Your score is ${s.score} out of 12, but ${why.length > 1 ? `${why.slice(0, -1).join(", ")} and ${why.at(-1)}` : why[0]} can quietly damage the kidneys. Doctors advise a kidney blood and urine test every year.${youngNote}`,
        basis: "Estimate based on SCORED, with KDIGO testing advice.", next: checkTest,
      });
    } else {
      cards.push({
        id: "kidney", topic: "Kidney risk", status: "good", value: "Low", sensitive: true,
        summary: `Your score is ${s.score} out of 12. Hidden kidney disease is unlikely. Keeping blood pressure and sugar healthy keeps it that way.${youngNote}`,
        basis: "Estimate based on SCORED.", next: retest(12),
      });
    }
  }

  /* ---------- Body (BMI + waist-to-height) ---------- */
  if (bmi && height) {
    const bc = bmiClass(bmi);
    const whtr = waist ? waistToHeight(waist, height) : null;
    const wc = whtr !== null ? whtrClass(whtr) : null;
    const rank = (s: Status) => ({ good: 0, check: 1, act: 2 })[s];
    const bmiStatus: Status = bc === "healthy" ? "good" : bc === "obesity" ? "act" : "check";
    const whtrStatus: Status = wc === null || wc === "healthy" ? "good" : wc === "high" ? "act" : "check";
    const status = rank(bmiStatus) >= rank(whtrStatus) ? bmiStatus : whtrStatus;
    const bmiWords = { underweight: "below the healthy range", healthy: "in the healthy range", overweight: "above the healthy range", obesity: "well above the healthy range" }[bc];
    cards.push({
      id: "body", topic: "Body", status, sensitive: false,
      value: `BMI ${bmi.toFixed(1)}`,
      summary:
        `Your BMI is ${bmiWords}.` +
        (whtr !== null
          ? ` Your waist is ${Math.round(whtr * 100)}% of your height${whtr >= 0.5 ? " (0.5 or more is a warning sign: keep your waist under half your height)." : ", nicely under half."}`
          : " Measure your waist to check belly fat too.") +
        (status !== "good" && bc !== "underweight" ? " Extra weight raises your risk of type 2 diabetes, high blood pressure and heart disease." : ""),
      basis: "Based on WHO BMI ranges and waist-to-height ratio.",
      next: status === "good" ? retest(12) : doctor("Talk to a doctor"),
    });
  }

  /* ---------- Sleep (STOP-Bang gated by snoring, plus sleep duration) ---------- */
  {
    const enoughSleep = meetsSleepGuideline((str(a, "sleep_hours") ?? "7-9") as "lt6" | "6-7" | "7-9" | "gt9");
    const gateOpen = a.snore === "yes" || a.snore === "unsure";
    let status: Status = enoughSleep ? "good" : "check";
    let value = enoughSleep ? "Getting enough" : "Too little sleep";
    let summary = enoughSleep ? "Adults need 7 or more hours of sleep a night, and you're getting that." : "Adults need 7 or more hours of sleep a night. Short sleep affects mood, weight and blood pressure.";
    let basis = "Based on the AASM/SRS sleep duration recommendation.";
    let next: NextStep = enoughSleep ? retest(12) : retest(3);
    if (gateOpen && bmi) {
      const sb = stopBang({
        snoring: a.snore === "yes", tired: a.tired === "yes", observed: a.observed === "yes",
        pressure: a.told_high_bp === "yes" || a.bp_meds === "yes", bmi, age, neckOver40: a.neck === "yes", sex,
      });
      basis = "Estimate based on STOP-Bang.";
      if (sb.risk === "high") {
        status = "act"; value = "Sleep apnoea risk: high";
        summary = `Your STOP-Bang score is ${sb.score} out of 8. Loud snoring with these signs can mean sleep apnoea, which strains the heart. It's treatable.`;
        next = doctor();
      } else if (sb.risk === "intermediate") {
        status = "check"; value = "Sleep apnoea risk: medium";
        summary = `Your STOP-Bang score is ${sb.score} out of 8. It's worth mentioning your snoring to a doctor.`;
        next = doctor();
      } else {
        value = enoughSleep ? "Low apnoea risk" : value;
        summary = `Your STOP-Bang score is ${sb.score} out of 8, which is low risk. ` + summary;
      }
    }
    cards.push({ id: "sleep", topic: "Sleep", status, value, summary, basis, next, sensitive: false });
  }

  /* ---------- Mood (PHQ-2 → PHQ-9) ---------- */
  let selfHarmFlag = false;
  {
    const p1 = Number(a.phq1 ?? 0), p2 = Number(a.phq2 ?? 0);
    if (!phq2Positive(p1, p2)) {
      cards.push({
        id: "mood", topic: "Mood", status: "good", value: "Doing well", sensitive: true,
        summary: "Your answers don't suggest low mood right now.", basis: "Estimate based on PHQ-2.", next: retest(12),
      });
    } else {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => Number(a[`phq${i}`] ?? 0));
      const r = phq9(items);
      selfHarmFlag = r.selfHarmFlag;
      const status: Status = r.selfHarmFlag || r.score >= 10 ? "act" : r.score >= 5 ? "check" : "good";
      cards.push({
        id: "mood", topic: "Mood", status, sensitive: true,
        value: { minimal: "Doing OK", mild: "A little low", moderate: "Low mood", "moderately severe": "Low mood", severe: "Very low mood" }[r.severity],
        summary: `Your PHQ-9 score is ${r.score} out of 27 (${r.severity}). ` + (status === "good" ? "Keep an eye on how you feel." : "Talking to a doctor helps, and low mood is very treatable."),
        basis: "Estimate based on PHQ-9.", next: status === "good" ? retest(3) : doctor(),
      });
    }
  }

  /* ---------- Anxiety (GAD-2 → GAD-7) ---------- */
  {
    const g1 = Number(a.gad1 ?? 0), g2 = Number(a.gad2 ?? 0);
    if (!gad2Positive(g1, g2)) {
      cards.push({
        id: "anxiety", topic: "Worry", status: "good", value: "Calm", sensitive: true,
        summary: "Your answers don't suggest an anxiety problem right now.", basis: "Estimate based on GAD-2.", next: retest(12),
      });
    } else {
      const r = gad7([1, 2, 3, 4, 5, 6, 7].map((i) => Number(a[`gad${i}`] ?? 0)));
      const status: Status = r.score >= 10 ? "act" : r.score >= 5 ? "check" : "good";
      cards.push({
        id: "anxiety", topic: "Worry", status, sensitive: true,
        value: { minimal: "Mostly calm", mild: "Some worry", moderate: "A lot of worry", severe: "Heavy worry" }[r.severity],
        summary: `Your GAD-7 score is ${r.score} out of 21 (${r.severity}). ` + (status === "good" ? "Keep looking after yourself." : "Worry like this is common and treatable. A doctor can help."),
        basis: "Estimate based on GAD-7.", next: status === "good" ? retest(3) : doctor(),
      });
    }
  }

  /* ---------- Alcohol (AUDIT-C) ---------- */
  {
    const r = a.drinks === "yes" ? auditC(Number(a.audit1 ?? 0), Number(a.audit2 ?? 0), Number(a.audit3 ?? 0), sex) : auditC(0, 0, 0, sex);
    cards.push({
      id: "alcohol", topic: "Alcohol", status: r.positive ? "check" : "good", sensitive: true,
      value: a.drinks === "yes" ? (r.positive ? "Above safer limits" : "Within safer limits") : "No alcohol",
      summary: r.positive
        ? `Your AUDIT-C score is ${r.score} out of 12. Cutting down protects your liver, heart and blood pressure.`
        : a.drinks === "yes" ? `Your AUDIT-C score is ${r.score} out of 12.` : "Not drinking is great for your heart and liver.",
      basis: "Estimate based on AUDIT-C.", next: r.positive ? doctor("Get support") : retest(12),
    });
  }

  /* ---------- Smoking ---------- */
  cards.push({
    id: "smoking", topic: "Smoking", sensitive: false,
    status: smoker ? "act" : "good",
    value: smoker ? "Smoking" : a.smoking === "former" ? "Quit. Well done!" : "Smoke-free",
    summary: smoker ? "Stopping smoking is the single biggest thing you can do for your heart. A doctor can help you quit." : a.smoking === "former" ? "Your lungs say thank you. Your heart risk keeps falling the longer you stay smoke-free." : "Your lungs say thank you.",
    basis: "Based on your smoking status.", next: smoker ? doctor("Get help to quit") : retest(12),
  });

  /* ---------- Activity (WHO 2020) ---------- */
  {
    const ok = meetsWhoActivity((str(a, "active_days") ?? "0-1") as "0-1" | "2-4" | "5+");
    cards.push({
      id: "activity", topic: "Moving", status: ok ? "good" : "check", sensitive: false,
      value: ok ? "Active" : "Room to move more",
      summary: ok ? "You're meeting the WHO goal of 150 minutes of activity a week." : "Being inactive raises your risk of heart disease and type 2 diabetes. WHO suggests at least 150 minutes of brisk activity a week, such as 30 minutes on 5 days.",
      basis: "Based on WHO 2020 physical activity guidelines.", next: ok ? retest(12) : retest(3),
    });
  }

  return { version: RESULTS_VERSION, wellbeing, age, sex, heart, heartNote, cards, reminders: prevention(a, age, sex, bmi), selfHarmFlag };
}

/* ---------------------------------------------------------------- Prevention checklist */

/** Age- and sex-based reminders. No score: just "what you're due for". Sources in SCREENING_TOOLS.md. */
export function prevention(a: Answers, age: number, sex: Sex, bmi: number | null): Reminder[] {
  const had = new Set([...(Array.isArray(a.checks) ? a.checks : []), ...(Array.isArray(a.checks_women) ? a.checks_women : [])]);
  const r: Reminder[] = [];
  r.push({
    id: "bp", title: "Blood pressure check", done: had.has("bp_year"), testCode: "bp-check",
    detail: age >= 40 ? "Every year from age 40." : "At least every 3 to 5 years, and every year if it has been high.",
    source: "USPSTF 2021",
  });
  const sugarDue = age >= 35 || (bmi !== null && bmi >= 25 && (a.family_diabetes === "first" || a.told_high_bp === "yes"));
  if (sugarDue && a.diabetes_dx !== "yes") {
    r.push({ id: "sugar", title: "Blood sugar test", done: had.has("sugar_3y"), testCode: "blood-sugar", detail: "Every 3 years from age 35, or sooner if you're overweight with other risk factors.", source: "ADA Standards of Care 2024" });
  }
  if (sex === "female" && age >= 30 && age <= 65) {
    r.push({ id: "cervical", title: "Cervical screening", done: had.has("cervical"), testCode: "cervical-screening", detail: "From age 30: an HPV test every 5 to 10 years (or VIA every 3 years where HPV testing isn't available).", source: "WHO 2021 cervical screening guideline" });
  }
  if (sex === "female" && age >= 50 && age <= 69) {
    r.push({ id: "mammogram", title: "Mammogram", done: had.has("mammogram"), detail: "Every 2 years from age 50 to 69.", source: "WHO 2014 breast cancer screening position paper" });
  }
  if (sex === "female") {
    r.push({ id: "breast", title: "Know your breasts", done: false, detail: "Get to know how your breasts normally look and feel, and see a doctor about any lump or change.", source: "WHO breast cancer early diagnosis guidance" });
  }
  r.push({ id: "hepb", title: "Hepatitis B test", done: had.has("hepb"), testCode: "hepatitis-b", detail: "At least once as an adult. Hepatitis B is common in Nigeria and often has no symptoms.", source: "WHO 2024 hepatitis B guidelines" });
  r.push({ id: "genotype", title: "Know your genotype", done: had.has("genotype"), testCode: "genotype", detail: "Know if you're AA, AS or SS, especially before starting a family.", source: "Nigeria FMoH National Guideline for Sickle Cell Disease" });
  return r;
}

/** The only details allowed on share cards and share pages (no mood, worry or alcohol). */
/**
 * A result's headline in plain words. Older saved heart results read "36 · 0.9% risk";
 * show those as "36 years" too, so every screen says the same thing.
 */
export function displayValue(c: Pick<ResultCard, "id" | "value">): string {
  if (c.id === "heart") {
    const m = /^((?:under |over )?\d+) · [\d.]+% risk$/.exec(c.value);
    if (m) return `${m[1]} years`;
  }
  return c.value;
}

export function shareSummary(r: Results) {
  return {
    age: r.age,
    heartAge: r.heart ? r.heart.heartAge : null,
    riskPercent: r.heart ? r.heart.riskPercent : null,
    cards: r.cards.filter((c) => !c.sensitive && ["heart", "diabetes", "activity"].includes(c.id)).map((c) => ({ topic: c.topic, status: c.status, value: c.value })),
  };
}
export type ShareSummary = ReturnType<typeof shareSummary>;
