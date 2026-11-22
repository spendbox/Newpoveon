import { describe, expect, it } from "vitest";
import { addDays, bedtimeFor, expectedWeight, lagosDay, mondayOf, moveStartLevel, progress, recommend, suggestedSwaps, targetFor, weightTarget, type Goal, type Log } from "./engine";

const START = "2026-11-02"; // a Monday
const move: Goal = { area: "move", settings: { cue: "After work", activity: "Walk", startLevel: 0 } };
const ticks = (weekIndex: number, n: number): Log[] => Array.from({ length: n }, (_, i) => ({ day: addDays(START, weekIndex * 7 + i), done: true }));

describe("dates", () => {
  it("finds Monday and Lagos today", () => {
    expect(mondayOf("2026-11-08")).toBe("2026-11-02"); // Sunday → previous Monday
    expect(mondayOf("2026-11-02")).toBe("2026-11-02");
    expect(lagosDay(new Date("2026-11-20T23:30:00Z"))).toBe("2026-11-21");
  });
});

describe("move progression", () => {
  it("starts small and steps up after a good week", () => {
    const p = progress(move, ticks(0, 3), START, "2026-11-10"); // week 2
    expect(p.week).toBe(2);
    expect(p.history[0]).toMatchObject({ done: 3, needed: 3, change: "up" });
    expect(p.target.headline).toBe("15 minutes, 3 days this week");
  });
  it("holds at 50–79% and steps back under 50%", () => {
    const g: Goal = { ...move, settings: { ...move.settings, startLevel: 3 } as never }; // 20 × 4
    expect(progress(g, ticks(0, 2), START, "2026-11-10").level).toBe(3); // 2/4 = 50% → stay
    expect(progress(g, ticks(0, 1), START, "2026-11-10").level).toBe(2); // 1/4 → down
  });
  it("tops out at WHO's 150 minutes plus strength", () => {
    const g: Goal = { ...move, settings: { ...move.settings, startLevel: 7 } as never };
    const t = targetFor(g, 7, 0);
    expect(t.days * 30).toBe(150);
    expect(t.steps.join(" ")).toMatch(/strength/);
    expect(progress(g, ticks(0, 7), START, "2026-11-10").level).toBe(7);
  });
  it("counts this week's ticks and builds a streak", () => {
    const logs = [...ticks(0, 3), ...ticks(1, 3), { day: "2026-11-16", done: true }];
    const p = progress(move, logs, START, "2026-11-17");
    expect(p.week).toBe(3);
    expect(p.streak).toBe(2);
    expect(p.thisWeek.done).toBe(1);
  });
  it("maps check answers to a start level", () => {
    expect(moveStartLevel("0-1")).toBe(0);
    expect(moveStartLevel("2-4")).toBe(3);
    expect(moveStartLevel("5+")).toBe(6);
  });
});

describe("sleep", () => {
  it("works out a bedtime for 7.5 hours", () => {
    expect(bedtimeFor("06:30")).toBe("11pm");
    expect(bedtimeFor("05:45")).toBe("10:15pm");
  });
  it("adds habits one at a time", () => {
    const g: Goal = { area: "sleep", settings: { wake: "06:30", startLevel: 0 } };
    expect(targetFor(g, 0, 0).steps).toHaveLength(1);
    expect(targetFor(g, 2, 0).steps).toHaveLength(3);
  });
});

describe("eat", () => {
  it("adds a new swap only every two good weeks", () => {
    const g: Goal = { area: "eat", settings: { swaps: ["sugary-drinks", "salt", "veg"] } };
    const w = (i: number) => ticks(i, 5);
    expect(progress(g, w(0), START, "2026-11-10").target.steps).toHaveLength(1);
    expect(progress(g, [...w(0), ...w(1)], START, "2026-11-17").target.steps).toHaveLength(2);
  });
  it("puts the most useful swaps first", () => {
    expect(suggestedSwaps({ bpHigh: true, diabetesRisk: "low", vegDaily: true, bmi: 22 })[0]).toBe("salt");
    expect(suggestedSwaps({ diabetesRisk: "high" })[0]).toBe("sugary-drinks");
  });
});

describe("weight programme", () => {
  const g: Goal = { area: "weight", settings: { startKg: 90, targetKg: weightTarget(90), weighDay: 0, moveStart: 0 } };
  const wtick = (w: number, n: number, kg?: number): Log[] => Array.from({ length: n }, (_, i) => ({ day: addDays(START, w * 7 + i), done: true, value: kg !== undefined && i === n - 1 ? kg : null }));
  it("sets a safe 5% target and 0.5 kg a week", () => {
    expect(weightTarget(90)).toBe(85.5);
    expect(expectedWeight(g.settings as never, 4)).toBe(88);
    expect(expectedWeight(g.settings as never, 30)).toBe(85.5);
  });
  it("is a full programme: a plate habit, movement and a weigh-in, 5 days a week", () => {
    const t = targetFor(g, 0, 0);
    expect(t.days).toBe(5);
    expect(t.steps.join(" ")).toMatch(/half your plate vegetables/);
    expect(t.steps.join(" ")).toMatch(/Move for 10 minutes/);
    expect(t.steps.at(-1)).toMatch(/Weigh yourself on Sunday/);
  });
  it("leaves movement to a separate Move goal when there is one", () => {
    expect(targetFor(g, 0, 0, { hasMove: true }).steps.join(" ")).not.toMatch(/Move for/);
  });
  it("grows to two plates a day and more movement as they keep up", () => {
    const p = progress(g, [...wtick(0, 5, 89.4), ...wtick(1, 5, 88.9)], START, "2026-11-17");
    expect(p.level).toBe(2);
    expect(p.target.headline).toMatch(/^2 plates a day \+ 15 min moving/);
  });
  it("adds one more change when the scale stalls for 2 weeks despite keeping up", () => {
    const stalled = progress(g, [...wtick(0, 5, 90), ...wtick(1, 5, 89.9)], START, "2026-11-17");
    expect(stalled.weight?.levers).toBe(1);
    expect(stalled.target.steps.join(" ")).toMatch(/zobo/);
    const losing = progress(g, [...wtick(0, 5, 89.4), ...wtick(1, 5, 88.9)], START, "2026-11-17");
    expect(losing.weight?.levers).toBe(0);
  });
  it("doesn't add changes when someone isn't keeping up; it eases back instead", () => {
    const p = progress({ ...g, settings: { ...(g.settings as object), moveStart: 0 } as never }, [...wtick(0, 1, 90), ...wtick(1, 1, 90)], START, "2026-11-17");
    expect(p.weight?.levers).toBe(0);
    expect(p.level).toBe(0);
  });
  it("tracks weight lost and whether it's on track", () => {
    const p = progress(g, [{ day: "2026-11-08", done: true, value: 89.6 }, { day: "2026-11-15", done: true, value: 89.2 }], START, "2026-11-17");
    expect(p.weight).toMatchObject({ latest: 89.2, expected: 89, onTrack: true, lost: 0.8 });
  });
});

describe("recommendations", () => {
  it("suggests areas from the check", () => {
    const r = recommend({ activeDays: "0-1", sleepHours: "lt6", bmi: 29, bpHigh: true, wellbeing: 40 }).map((x) => x.area);
    expect(r).toEqual(["move", "sleep", "weight", "eat", "calm"]);
    expect(recommend({ activeDays: "5+", sleepHours: "7-9", bmi: 22, wellbeing: 80, vegDaily: true })).toEqual([]);
  });
});

import { cleanGoals } from "./validate";
describe("server-side plan checks", () => {
  it("accepts known choices and recomputes the weight target", () => {
    const g = cleanGoals([{ area: "weight", settings: { startKg: 90, targetKg: 10, weighDay: 0 } }, { area: "eat", settings: { swaps: ["salt", "salt", "evil"] } }]);
    expect(g).toEqual([{ area: "weight", settings: { startKg: 90, targetKg: 85.5, weighDay: 0, moveStart: 0 } }, { area: "eat", settings: { swaps: ["salt"] } }]);
  });
  it("rejects unknown areas, made-up choices and too many areas", () => {
    expect(cleanGoals([{ area: "hack", settings: {} }])).toBeNull();
    expect(cleanGoals([{ area: "move", settings: { cue: "Whenever", activity: "Brisk walking", startLevel: 0 } }])).toBeNull();
    expect(cleanGoals([{ area: "sleep", settings: { wake: "03:00", startLevel: 0 } }])).toBeNull();
    const ok = { area: "calm", settings: { practice: "breathe", cue: "Before bed" } };
    expect(cleanGoals([ok, { ...ok, area: "move" }, ok, ok])).toBeNull();
  });
});
