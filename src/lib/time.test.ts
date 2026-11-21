import { describe, expect, it } from "vitest";
import { clockTime } from "./time";

describe("clockTime (12-hour, Lagos)", () => {
  it("shows whole hours as 5pm and others as 9:30am", () => {
    expect(clockTime(new Date("2026-11-21T16:00:00Z"))).toBe("5pm"); // 17:00 in Lagos
    expect(clockTime(new Date("2026-11-21T08:30:00Z"))).toBe("9:30am");
    expect(clockTime(new Date("2026-11-21T11:00:00Z"))).toBe("12pm");
    expect(clockTime(new Date("2026-11-20T23:15:00Z"))).toBe("12:15am");
  });
  it("can include seconds for the live clock", () => {
    expect(clockTime(new Date("2026-11-21T07:30:57Z"), "Africa/Lagos", { seconds: true })).toBe("8:30:57 am");
  });
});
