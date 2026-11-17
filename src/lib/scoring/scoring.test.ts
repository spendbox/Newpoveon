import { describe, expect, it } from "vitest";
import fixtures from "./__fixtures__.json";
import { heartAge, isExtrapolated, whoCvdRisk, whoCvdRiskRaw, whoRiskBand, type Sex } from "./who-cvd";
import { auditC, bmi, bmiClass, bpClass, findrisc, findriscBand, gad2Positive, gad7, phq2Positive, phq9, stopBang, waistToHeight, whtrClass } from "./tools";
import { computeResults, shareSummary } from "./results";
import { HEART_AGE_REFERENCE } from "@/config/site";
import { sanitizeAnswers, visibleQuestions, type Answers } from "@/lib/questions";

describe("WHO 2019 non-lab model, Western Sub-Saharan Africa", () => {
  it("matches an independent Python re-implementation built from the authors' Stata code and data file", () => {
    for (const c of fixtures.pythonReference2017) {
      const r = whoCvdRisk({ age: c.age, sex: c.sex as Sex, sbp: c.sbp, bmi: c.bmi, smoker: c.smoker });
      expect(r).toBeCloseTo(c.risk, 9);
    }
  });

  it("matches the WHORiskCalculator (CRAN) reference cases for West African countries", () => {
    expect(fixtures.whoRiskCalculatorRegion.length).toBeGreaterThan(5);
    for (const c of fixtures.whoRiskCalculatorRegion) {
      const r = whoCvdRiskRaw({ age: c.age, sex: c.sex as Sex, sbp: c.sbp, bmi: c.bmi, smoker: c.smoker }, c.year);
      // The R package stores parameters at 6 decimal places, hence the looser tolerance.
      expect(Math.abs(r - c.risk)).toBeLessThan(1e-5);
    }
  });

  it("refuses to calculate outside the model's age range (40–80)", () => {
    expect(whoCvdRisk({ age: 39, sex: "male", sbp: 140, bmi: 25, smoker: false })).toBeNull();
    expect(whoCvdRisk({ age: 81, sex: "male", sbp: 140, bmi: 25, smoker: false })).toBeNull();
  });

  it("puts risks in the WHO chart bands", () => {
    expect(whoRiskBand(0.049)).toBe("<5%");
    expect(whoRiskBand(0.05)).toBe("5% to <10%");
    expect(whoRiskBand(0.1)).toBe("10% to <20%");
    expect(whoRiskBand(0.2)).toBe("20% to <30%");
    expect(whoRiskBand(0.3)).toBe("≥30%");
  });

  it("risk rises with blood pressure, smoking and age", () => {
    const base = { age: 55, sex: "female" as const, sbp: 120, bmi: 24, smoker: false };
    const r0 = whoCvdRisk(base)!;
    expect(whoCvdRisk({ ...base, sbp: 160 })!).toBeGreaterThan(r0);
    expect(whoCvdRisk({ ...base, smoker: true })!).toBeGreaterThan(r0);
    expect(whoCvdRisk({ ...base, age: 65 })!).toBeGreaterThan(r0);
  });
});

describe("Heart age", () => {
  it("can be extended below 40 on purpose, and flags it", () => {
    const ha = heartAge({ age: 35, sex: "male", sbp: 140, bmi: 28, smoker: true }, HEART_AGE_REFERENCE, undefined, 30)!;
    expect(ha.value).toBeGreaterThan(35);
    expect(isExtrapolated(35, ha)).toBe(true);
    expect(isExtrapolated(50, { kind: "exact", value: 52 })).toBe(false);
    expect(isExtrapolated(50, { kind: "exact", value: 38 })).toBe(true);
  });
  it("equals real age for someone with exactly the reference (healthy) risk factors", () => {
    for (const age of [45, 55, 65]) {
      for (const sex of ["male", "female"] as const) {
        const ha = heartAge({ age, sex, sbp: HEART_AGE_REFERENCE.sbp, bmi: HEART_AGE_REFERENCE.bmi, smoker: false }, HEART_AGE_REFERENCE);
        expect(ha).toEqual({ kind: "exact", value: age });
      }
    }
  });
  it("is older than real age for a smoker with high blood pressure", () => {
    const ha = heartAge({ age: 50, sex: "male", sbp: 160, bmi: 30, smoker: true }, HEART_AGE_REFERENCE)!;
    expect(ha.value).toBeGreaterThan(50);
  });
  it("by default reports 'below 40' rather than extrapolating outside the model", () => {
    const ha = heartAge({ age: 41, sex: "female", sbp: 100, bmi: 20, smoker: false }, HEART_AGE_REFERENCE)!;
    expect(ha.kind).toBe("below");
  });
});

describe("BMI and waist-to-height (WHO; Ashwell 2012)", () => {
  it("calculates and classifies BMI", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.857, 3);
    expect(bmiClass(18.4)).toBe("underweight");
    expect(bmiClass(18.5)).toBe("healthy");
    expect(bmiClass(25)).toBe("overweight");
    expect(bmiClass(30)).toBe("obesity");
  });
  it("flags waist-to-height of 0.5 or more", () => {
    expect(whtrClass(waistToHeight(84, 170))).toBe("healthy");
    expect(whtrClass(0.5)).toBe("increased");
    expect(whtrClass(0.6)).toBe("high");
  });
});

describe("FINDRISC (Lindström & Tuomilehto 2003)", () => {
  const lowest = { age: 30, bmi: 22, sex: "male" as const, waistCm: 80, dailyActivity30: true, vegFruitDaily: true, everBpMeds: false, everHighGlucose: false, familyDiabetes: "none" as const };
  it("scores 0 for the lowest-risk answers", () => expect(findrisc(lowest).score).toBe(0));
  it("scores 26 (the maximum) for the highest-risk answers", () => {
    expect(findrisc({ age: 70, bmi: 35, sex: "female", waistCm: 100, dailyActivity30: false, vegFruitDaily: false, everBpMeds: true, everHighGlucose: true, familyDiabetes: "first" }).score).toBe(26);
  });
  it("uses the published points for each item", () => {
    expect(findrisc({ ...lowest, age: 45 }).score).toBe(2);
    expect(findrisc({ ...lowest, age: 55 }).score).toBe(3);
    expect(findrisc({ ...lowest, age: 65 }).score).toBe(4);
    expect(findrisc({ ...lowest, bmi: 27 }).score).toBe(1);
    expect(findrisc({ ...lowest, bmi: 31 }).score).toBe(3);
    expect(findrisc({ ...lowest, waistCm: 94 }).score).toBe(3);
    expect(findrisc({ ...lowest, waistCm: 103 }).score).toBe(4);
    expect(findrisc({ ...lowest, sex: "female", waistCm: 80 }).score).toBe(3);
    expect(findrisc({ ...lowest, sex: "female", waistCm: 89 }).score).toBe(4);
    expect(findrisc({ ...lowest, dailyActivity30: false }).score).toBe(2);
    expect(findrisc({ ...lowest, vegFruitDaily: false }).score).toBe(1);
    expect(findrisc({ ...lowest, everBpMeds: true }).score).toBe(2);
    expect(findrisc({ ...lowest, everHighGlucose: true }).score).toBe(5);
    expect(findrisc({ ...lowest, familyDiabetes: "second" }).score).toBe(3);
    expect(findrisc({ ...lowest, familyDiabetes: "first" }).score).toBe(5);
  });
  it("uses the official risk bands", () => {
    expect([6, 7, 11, 12, 14, 15, 20, 21].map(findriscBand)).toEqual(["low", "slightly elevated", "slightly elevated", "moderate", "moderate", "high", "high", "very high"]);
  });
  it("marks the score as a minimum when waist is missing", () => {
    const r = findrisc({ ...lowest, waistCm: null });
    expect(r.waistMissing).toBe(true);
    expect(r.score).toBe(0);
  });
});

describe("STOP-Bang (Chung 2008, 2016)", () => {
  const none = { snoring: false, tired: false, observed: false, pressure: false, bmi: 24, age: 40, neckOver40: false, sex: "female" as const };
  it("scores 0–2 as low risk", () => expect(stopBang({ ...none, snoring: true, tired: true }).risk).toBe("low"));
  it("scores 3–4 as intermediate", () => expect(stopBang({ ...none, snoring: true, age: 55, bmi: 36 }).risk).toBe("intermediate"));
  it("scores 5–8 as high", () => expect(stopBang({ snoring: true, tired: true, observed: true, pressure: true, bmi: 30, age: 60, neckOver40: false, sex: "female" }).risk).toBe("high"));
  it("applies the STOP ≥2 + male rule", () => {
    const r = stopBang({ ...none, snoring: true, tired: true, sex: "male" });
    expect(r.score).toBe(3);
    expect(r.risk).toBe("high");
  });
});

describe("PHQ-2 / PHQ-9 (Kroenke 2001, 2003)", () => {
  it("PHQ-2 is positive at 3 or more", () => {
    expect(phq2Positive(1, 1)).toBe(false);
    expect(phq2Positive(2, 1)).toBe(true);
  });
  it("uses the published severity bands", () => {
    const at = (n: number) => phq9([...Array(9)].map((_, i) => (i < n ? 1 : 0))).severity;
    expect(at(4)).toBe("minimal");
    expect(at(5)).toBe("mild");
    expect(phq9([3, 3, 3, 1, 0, 0, 0, 0, 0]).severity).toBe("moderate");
    expect(phq9([3, 3, 3, 3, 3, 0, 0, 0, 0]).severity).toBe("moderately severe");
    expect(phq9([3, 3, 3, 3, 3, 3, 2, 0, 0]).severity).toBe("severe");
  });
  it("flags item 9 for anything other than 'Not at all'", () => {
    expect(phq9([0, 0, 0, 0, 0, 0, 0, 0, 1]).selfHarmFlag).toBe(true);
    expect(phq9([3, 3, 3, 3, 3, 3, 3, 3, 0]).selfHarmFlag).toBe(false);
  });
});

describe("GAD-2 / GAD-7 (Spitzer 2006; Kroenke 2007)", () => {
  it("GAD-2 is positive at 3 or more", () => expect([gad2Positive(1, 1), gad2Positive(3, 0)]).toEqual([false, true]));
  it("uses the published severity bands", () => {
    expect(gad7([1, 1, 1, 1, 0, 0, 0]).severity).toBe("minimal");
    expect(gad7([1, 1, 1, 1, 1, 0, 0]).severity).toBe("mild");
    expect(gad7([2, 2, 2, 2, 2, 0, 0]).severity).toBe("moderate");
    expect(gad7([3, 3, 3, 3, 3, 0, 0]).severity).toBe("severe");
  });
});

describe("AUDIT-C (Bush 1998; Bradley 2007)", () => {
  it("is positive at 4+ for men and 3+ for women", () => {
    expect(auditC(1, 1, 1, "male").positive).toBe(false);
    expect(auditC(2, 1, 1, "male").positive).toBe(true);
    expect(auditC(1, 1, 1, "female").positive).toBe(true);
    expect(auditC(1, 1, 0, "female").positive).toBe(false);
  });
});

describe("Blood pressure thresholds (WHO 2021, ISH 2020)", () => {
  it("classifies readings", () => {
    expect(bpClass(139, 89)).toBe("normal");
    expect(bpClass(140, 80)).toBe("hypertension");
    expect(bpClass(120, 90)).toBe("hypertension");
    expect(bpClass(180, 100)).toBe("severe");
  });
});

/* ---------------------------------------------------------------- Whole questionnaire */

const healthy: Answers = {
  age: 45, sex: "male", height: 175, weight: 68, waist: 80, cvd_history: "no", smoking: "never", bp_known: "yes", bp: { sbp: 118, dbp: 76 },
  told_high_bp: "no", bp_meds: "no", diabetes_dx: "no", high_sugar: "no", family_diabetes: "none", veg_daily: "yes",
  active_daily: "yes", active_days: "5+", sleep_hours: "7-9", snore: "no", drinks: "no", phq1: "0", phq2: "0", gad1: "0", gad2: "0", checks: ["none"],
};

describe("computeResults", () => {
  it("gives a heart age and good cards for a healthy person", () => {
    const r = computeResults(healthy);
    expect(r.heart).not.toBeNull();
    expect(r.cards.find((c) => c.id === "heart")!.status).toBe("good");
    expect(r.selfHarmFlag).toBe(false);
    for (const c of r.cards) {
      expect(["good", "check", "act"]).toContain(c.status);
      expect(c.basis.length).toBeGreaterThan(5);
      expect(c.next.label.length).toBeGreaterThan(3);
    }
  });
  it("does not calculate heart age without a blood pressure reading, and offers a home check", () => {
    const r = computeResults({ ...healthy, bp_known: "no", bp: undefined as never });
    expect(r.heart).toBeNull();
    const card = r.cards.find((c) => c.id === "heart")!;
    expect(card.next).toMatchObject({ kind: "test", testCode: "bp-check" });
  });
  it("gives 30–39 year olds a heart age marked as an early estimate", () => {
    const r = computeResults({ ...healthy, age: 35 });
    expect(r.heart).not.toBeNull();
    expect(r.heart!.earlyEstimate).toBe(true);
    expect(r.cards.find((c) => c.id === "heart")!.basis).toMatch(/Early estimate/);
  });
  it("does not mark 40+ results as early estimates when heart age is 40+", () => {
    const r = computeResults({ ...healthy, age: 55, smoking: "current" });
    expect(r.heart!.heartAge.value).toBeGreaterThanOrEqual(40);
    expect(r.heart!.earlyEstimate).toBe(false);
  });
  it("does not calculate heart age under 30", () => {
    const r = computeResults({ ...healthy, age: 29 });
    expect(r.heart).toBeNull();
    expect(r.heartNote).toMatch(/starts at 30/);
  });
  it("raises the safety flag when PHQ-9 item 9 is above 'Not at all'", () => {
    const r = computeResults({ ...healthy, phq1: "2", phq2: "2", phq3: "0", phq4: "0", phq5: "0", phq6: "0", phq7: "0", phq8: "0", phq9: "1" });
    expect(r.selfHarmFlag).toBe(true);
    expect(r.cards.find((c) => c.id === "mood")!.status).toBe("act");
  });
  it("keeps mood, worry and alcohol out of share summaries", () => {
    const s = shareSummary(computeResults(healthy));
    expect(JSON.stringify(s)).not.toMatch(/Mood|Worry|Alcohol|PHQ|GAD|AUDIT/);
  });
  it("opens gated sections only when needed (25–35 questions for most people)", () => {
    expect(visibleQuestions(healthy).length).toBe(25);
    const busy = { ...healthy, snore: "yes", drinks: "yes", phq1: "2", phq2: "2", gad1: "2", gad2: "2", sex: "female" };
    expect(visibleQuestions(busy).length).toBe(26 + 3 + 3 + 7 + 5);
  });
  it("server sanitiser drops invalid and hidden answers", () => {
    const s = sanitizeAnswers({ ...healthy, age: 500, tired: "yes", evil: "<script>" });
    expect(s.age).toBeUndefined();
    expect(s.tired).toBeUndefined(); // hidden because snore = no
    expect((s as Record<string, unknown>).evil).toBeUndefined();
  });
});
