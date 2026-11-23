import { describe, expect, it } from "vitest";
import { computeResults } from "@/lib/scoring/results";
import type { Answers } from "@/lib/questions";
import { calmFor, personalAim, personalExtras, personalWhy, planFocus } from "./personal";
import { planHints } from "./hints";

const a: Answers = {
  dob: "1978-05-01", sex: "male", height: 172, weight: 88, waist: 100, cvd_history: "no", smoking: "current",
  bp_known: "yes", bp: { sbp: 148, dbp: 94 }, told_high_bp: "yes", bp_meds: "no", diabetes_dx: "no", high_sugar: "no",
  family_diabetes: "first", veg_daily: "no", active_daily: "no", active_days: "0-1", sleep_hours: "6-7", snore: "no",
  drinks: "no", phq1: "2", phq2: "1", gad1: "0", gad2: "1", who1: "2", who2: "2", who3: "1", who4: "2", who5: "2",
  kidney_conditions: ["none"], family_kidney: "no", checks: ["none"],
};
const r = computeResults(a);

describe("personal plan text", () => {
  it("uses the person's own numbers", () => {
    expect(personalWhy("move", a, r)).toContain("0 or 1 days");
    expect(personalWhy("weight", a, r)).toMatch(/You're 88 kg \(BMI 29\.7\).*Losing 4\.5 kg, to 83\.5 kg/);
    expect(personalWhy("eat", a, r)).toContain("your blood pressure was 148/94");
    expect(personalWhy("eat", a, r)).toContain("you don't eat vegetables every day");
    expect(personalWhy("sleep", a, r)).toContain("6 to 7 hours");
    expect(personalWhy("calm", a, r)).toMatch(/Your wellbeing score is \d+\/100, and you've had some low days lately/);
  });
  it("gives the reasons to the plan builder", () => {
    const h = planHints(a, r);
    expect(h.recs.find((x) => x.area === "weight")?.why).toContain("88 kg");
    expect(h.calm).toEqual({ practice: "walk", cue: "At lunchtime" });
  });
  it("says where each goal is heading", () => {
    expect(personalAim({ area: "move", settings: { cue: "After work", activity: "Brisk walking", startLevel: 0 } })).toContain("in about 7 weeks");
    expect(personalAim({ area: "weight", settings: { startKg: 88, targetKg: 83.5, weighDay: 6 } })).toContain("83.5 kg");
  });
  it("lists what the plan is built around and what else needs attention", () => {
    expect(planFocus(r).length).toBeGreaterThan(1);
    const extras = personalExtras(r);
    expect(extras[0].id).toBe("smoking");
    expect(extras.length).toBeLessThanOrEqual(3);
  });
  it("picks a calm practice that fits", () => {
    expect(calmFor({ ...a, phq1: "0", phq2: "0", gad1: "2", gad2: "2" }, r).practice).toBe("breathe");
    expect(calmFor({ ...a, phq1: "0", phq2: "0", gad1: "0", gad2: "0" }, r).practice).toBe("connect");
  });
});

describe("tidy labels", () => {
  it("keeps abbreviations and avoids repeating the topic", () => {
    expect(planFocus(r).some((c) => c.includes("bMI"))).toBe(false);
    expect(personalExtras(r).find((x) => x.id === "smoking")?.title).toBe("Smoking");
  });
});
