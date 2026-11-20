import { describe, expect, it } from "vitest";
import { generateSlots, lagosDate, type Rule } from "./schedule";

// Monday 5 Jan 2026, 08:00 Lagos time (07:00 UTC).
const now = new Date("2026-01-05T07:00:00Z");
const monFri: Rule[] = [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start: "09:00", end: "11:00", capacity: 1 }));
const settings = { slotMinutes: 30, minNoticeHours: 2, horizonDays: 7 };

describe("Weekly availability", () => {
  it("repeats the weekly hours on each day, in Lagos time", () => {
    const slots = generateSlots(monFri, [], settings, now);
    // Monday 09:00 and 09:30 are within 2 hours' notice, so Monday starts at 10:00.
    expect(slots[0].startsAt).toBe("2026-01-05T09:00:00.000Z"); // 10:00 Lagos
    expect(slots.filter((s) => lagosDate(new Date(s.startsAt)) === "2026-01-06").map((s) => s.startsAt)).toEqual([
      "2026-01-06T08:00:00.000Z", "2026-01-06T08:30:00.000Z", "2026-01-06T09:00:00.000Z", "2026-01-06T09:30:00.000Z",
    ]);
  });
  it("skips days with no hours (weekends here)", () => {
    const days = new Set(generateSlots(monFri, [], settings, now).map((s) => lagosDate(new Date(s.startsAt))));
    expect(days.has("2026-01-10")).toBe(false);
    expect(days.has("2026-01-11")).toBe(false);
  });
  it("removes a time once it is booked", () => {
    const taken = new Map([["2026-01-06T08:00:00.000Z", 1]]);
    expect(generateSlots(monFri, [], settings, now, taken).some((s) => s.startsAt === "2026-01-06T08:00:00.000Z")).toBe(false);
  });
  it("keeps a time open while there is capacity left (more doctors later)", () => {
    const two = monFri.map((r) => ({ ...r, capacity: 2 }));
    const taken = new Map([["2026-01-06T08:00:00.000Z", 1]]);
    const s = generateSlots(two, [], settings, now, taken).find((x) => x.startsAt === "2026-01-06T08:00:00.000Z")!;
    expect(s.remaining).toBe(1);
  });
  it("adds up overlapping hours as extra capacity", () => {
    const rules = [...monFri, { weekday: 2, start: "09:00", end: "10:00", capacity: 1 }];
    expect(generateSlots(rules, [], settings, now).find((x) => x.startsAt === "2026-01-06T08:00:00.000Z")!.capacity).toBe(2);
  });
  it("respects closed days and extra hours", () => {
    const slots = generateSlots(monFri, [
      { date: "2026-01-06", kind: "closed" },
      { date: "2026-01-10", kind: "extra", start: "12:00", end: "13:00", capacity: 1 },
    ], settings, now);
    const days = slots.map((s) => lagosDate(new Date(s.startsAt)));
    expect(days).not.toContain("2026-01-06");
    expect(slots.filter((s) => lagosDate(new Date(s.startsAt)) === "2026-01-10").map((s) => s.startsAt)).toEqual(["2026-01-10T11:00:00.000Z", "2026-01-10T11:30:00.000Z"]);
  });
  it("does not offer a slot that would run past the end of the hours", () => {
    const slots = generateSlots([{ weekday: 2, start: "09:00", end: "09:50", capacity: 1 }], [], settings, now);
    expect(slots.map((s) => s.startsAt)).toEqual(["2026-01-06T08:00:00.000Z"]);
  });
});
