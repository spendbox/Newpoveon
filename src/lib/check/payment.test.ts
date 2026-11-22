import { describe, expect, it } from "vitest";
import { defaultGoals } from "./payment";
import type { Answers } from "@/lib/questions";

describe("starting plan from a paid check", () => {
  it("picks the two most useful areas, set up from the answers", () => {
    const a = { active_days: "0-1", sleep_hours: "lt6", height: 170, weight: 90, veg_daily: "no" } as unknown as Answers;
    const g = defaultGoals(a, null);
    expect(g.map((x) => x.area)).toEqual(["move", "sleep"]);
    expect(g[0].settings).toMatchObject({ cue: "After work", activity: "Brisk walking", startLevel: 0 });
  });
  it("builds a weight programme from the weight they entered", () => {
    const a = { active_days: "5+", sleep_hours: "7-9", height: 165, weight: 88 } as unknown as Answers;
    const g = defaultGoals(a, null);
    expect(g[0]).toEqual({ area: "weight", settings: { startKg: 88, targetKg: 83.5, weighDay: 6, moveStart: 6 } });
  });
  it("still gives a plan when everything looks good", () => {
    const a = { active_days: "5+", sleep_hours: "7-9", height: 175, weight: 65, veg_daily: "yes" } as unknown as Answers;
    expect(defaultGoals(a, null).map((x) => x.area)).toEqual(["move"]);
  });
});
