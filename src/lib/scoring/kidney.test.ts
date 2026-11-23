import { describe, expect, it } from "vitest";
import { egfrCkdEpi2021, egfrStage, scored } from "./tools";

const none = { anaemia: false, hypertension: false, diabetes: false, cvd: false, heartFailure: false, pvd: false, proteinuria: false };

describe("SCORED (Bang 2007)", () => {
  it("scores age bands and sex", () => {
    expect(scored({ ...none, age: 45, sex: "male" }).score).toBe(0);
    expect(scored({ ...none, age: 55, sex: "male" }).score).toBe(2);
    expect(scored({ ...none, age: 65, sex: "female" }).score).toBe(4);
    expect(scored({ ...none, age: 75, sex: "male" }).score).toBe(4);
  });
  it("adds one point per condition and flags 4 or more", () => {
    const r = scored({ age: 52, sex: "male", anaemia: false, hypertension: true, diabetes: true, cvd: false, heartFailure: false, pvd: false, proteinuria: false });
    expect(r).toEqual({ score: 4, high: true });
    expect(scored({ ...none, age: 40, sex: "female", hypertension: true }).high).toBe(false);
  });
});

describe("eGFR (CKD-EPI 2021)", () => {
  it("matches published calculator values", () => {
    expect(egfrCkdEpi2021(1.0, 50, "male")).toBeCloseTo(91.7, 0);
    expect(egfrCkdEpi2021(0.8, 60, "female")).toBeCloseTo(84.3, 0);
    expect(egfrCkdEpi2021(2.0, 60, "male")).toBeCloseTo(37.6, 0);
  });
  it("falls as creatinine rises", () => {
    expect(egfrCkdEpi2021(1.5, 40, "female")).toBeLessThan(egfrCkdEpi2021(0.9, 40, "female"));
  });
  it("stages the result", () => {
    expect([95, 75, 50, 35, 20, 10].map(egfrStage)).toEqual(["G1", "G2", "G3a", "G3b", "G4", "G5"]);
  });
});

import { computeResults } from "./results";
import { kidneyForResult, kidneyFunction } from "@/lib/bioage/phenoage";
import type { Answers } from "@/lib/questions";

const base: Answers = { dob: "1990-01-01", sex: "male", height: 175, weight: 70, cvd_history: "no", told_high_bp: "no", bp_meds: "no", diabetes_dx: "no" };
const kidney = (a: Answers) => computeResults(a).cards.find((c) => c.id === "kidney");

describe("kidney card", () => {
  it("is missing for checks saved before the kidney questions", () => {
    expect(kidney(base)).toBeUndefined();
  });
  it("is low risk for a young person with nothing to report", () => {
    expect(kidney({ ...base, kidney_conditions: ["none"], family_kidney: "no" })).toMatchObject({ status: "good", value: "Low", sensitive: true });
  });
  it("suggests a yearly test with high blood pressure or family history, even on a low score", () => {
    expect(kidney({ ...base, told_high_bp: "yes", kidney_conditions: ["none"], family_kidney: "no" })).toMatchObject({ status: "check", value: "Worth a yearly test" });
    expect(kidney({ ...base, kidney_conditions: ["none"], family_kidney: "yes" })?.next).toMatchObject({ kind: "test", testCode: "kidney-check" });
  });
  it("flags higher risk at a score of 4 or more", () => {
    const c = kidney({ ...base, dob: "1960-01-01", sex: "female", kidney_conditions: ["anaemia"], family_kidney: "no" });
    expect(c).toMatchObject({ status: "check", value: "Higher risk" });
  });
  it("doesn't score people who already know they have kidney disease", () => {
    expect(kidney({ ...base, kidney_conditions: ["ckd"], family_kidney: "no" })).toMatchObject({ value: "Kidney disease" });
  });
});

describe("kidney function from lab results", () => {
  it("converts µmol/L and labels the stage", () => {
    expect(kidneyFunction(88.4, 50, "male")).toMatchObject({ egfr: 92, stage: "G1", label: "Normal" });
    expect(kidneyFunction(176.8, 60, "male")).toMatchObject({ stage: "G3b", status: "act" });
  });
  it("needs the sex recorded", () => {
    const markers = { albumin: 45, creatinine: 80, glucose: 5, crp: 1, lymph: 30, mcv: 88, rdw: 13, alp: 70, wbc: 6 };
    expect(kidneyForResult({ markers, age_years: 40, entered: null })).toBeNull();
    expect(kidneyForResult({ markers: { ...markers, creatinine: 60 }, age_years: 40, entered: { sex: "female" } })?.stage).toBe("G1");
  });
});
