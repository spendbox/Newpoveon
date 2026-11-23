import { describe, expect, it } from "vitest";
import { dobFromAnswers } from "./dob";

describe("date of birth for the biological age form", () => {
  it("uses the date of birth from the check", () => {
    expect(dobFromAnswers({ dob: "1990-06-15", age: 30 }, "2026-01-01T00:00:00Z")).toEqual({ dob: "1990-06-15", source: "exact", from: "2026-01-01T00:00:00Z" });
  });
  it("estimates from an older check that only has an age", () => {
    const g = dobFromAnswers({ age: 34 }, "2026-06-01T00:00:00Z")!;
    expect(g.source).toBe("estimated");
    expect(g.dob.startsWith("1991-")).toBe(true);
  });
  it("gives nothing when there's nothing to go on", () => {
    expect(dobFromAnswers(null, "2026-01-01")).toBeNull();
    expect(dobFromAnswers({ dob: "bad" }, "2026-01-01")).toBeNull();
    expect(dobFromAnswers({ age: 9 }, "2026-01-01")).toBeNull();
  });
});
