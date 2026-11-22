import { describe, expect, it } from "vitest";
import { checkValues, differenceText, exactAge, phenoAge, toBase, type Values } from "./phenoage";

const healthy: Values = { albumin: 45, creatinine: 80, glucose: 5.0, crp: 1.0, lymph: 35, mcv: 88, rdw: 12.8, alp: 70, wbc: 6.0 };
const lessHealthy: Values = { albumin: 40, creatinine: 80, glucose: 6.5, crp: 6.0, lymph: 25, mcv: 92, rdw: 14.5, alp: 90, wbc: 8.0 };

describe("PhenoAge (Levine 2018)", () => {
  it("matches hand-worked examples", () => {
    expect(phenoAge(34, healthy).phenoAge).toBeCloseTo(25.63, 1);
    expect(phenoAge(34, lessHealthy).phenoAge).toBeCloseTo(43.04, 1);
  });

  it("is close to real age for typical middle-aged values", () => {
    const r = phenoAge(50, { albumin: 42, creatinine: 85, glucose: 5.4, crp: 2, lymph: 30, mcv: 90, rdw: 13.2, alp: 75, wbc: 6.5 });
    expect(Math.abs(r.difference)).toBeLessThan(6);
  });

  it("gets older with worse markers and with real age", () => {
    expect(phenoAge(40, { ...healthy, glucose: 9 }).phenoAge).toBeGreaterThan(phenoAge(40, healthy).phenoAge);
    expect(phenoAge(40, { ...healthy, albumin: 35 }).phenoAge).toBeGreaterThan(phenoAge(40, healthy).phenoAge);
    expect(phenoAge(60, healthy).phenoAge).toBeGreaterThan(phenoAge(40, healthy).phenoAge);
  });

  it("handles a CRP of zero by using the floor", () => {
    expect(Number.isFinite(phenoAge(30, { ...healthy, crp: 0 }).phenoAge)).toBe(true);
    expect(phenoAge(30, { ...healthy, crp: 0 }).phenoAge).toBeCloseTo(phenoAge(30, { ...healthy, crp: 0.1 }).phenoAge, 6);
  });

  it("ranks the drivers, with high sugar and CRP adding years", () => {
    const d = phenoAge(34, lessHealthy).drivers;
    const glucose = d.find((x) => x.key === "glucose")!;
    expect(glucose.years).toBeGreaterThan(0);
    expect(Math.abs(d[0].years)).toBeGreaterThanOrEqual(Math.abs(d[d.length - 1].years));
  });
});

describe("units and checks", () => {
  it("converts common Nigerian lab units", () => {
    expect(toBase("albumin", 4.5, "g/dL")).toBeCloseTo(45);
    expect(toBase("creatinine", 1, "mg/dL")).toBeCloseTo(88.4);
    expect(toBase("glucose", 90, "mg/dL")).toBeCloseTo(5);
    expect(toBase("crp", 0.3, "mg/dL")).toBeCloseTo(3);
    expect(toBase("mcv", 88, "fL")).toBe(88);
  });

  it("flags missing and impossible values", () => {
    expect(checkValues(healthy)).toEqual([]);
    expect(checkValues({ ...healthy, albumin: 4.5 }).map((p) => p.key)).toEqual(["albumin"]);
    const { glucose: _g, ...noGlucose } = healthy;
    void _g;
    expect(checkValues(noGlucose).map((p) => p.key)).toEqual(["glucose"]);
  });

  it("works out exact age on the test day", () => {
    expect(exactAge("1990-06-15", "2026-06-15")).toBeCloseTo(36, 1);
    expect(exactAge("2030-01-01", "2026-01-01")).toBeNull();
    expect(exactAge("bad", "2026-01-01")).toBeNull();
  });

  it("describes the difference in plain words", () => {
    expect(differenceText(-3.2)).toBe("3 years younger than your age");
    expect(differenceText(1.4)).toBe("1 year older than your age");
    expect(differenceText(0.3)).toBe("about the same as your age");
  });
});
