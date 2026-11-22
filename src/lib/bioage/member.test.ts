import { describe, expect, it } from "vitest";
import { normaliseMemberCode, withMemberId } from "./member";

describe("member IDs", () => {
  it("accepts IDs however they're typed", () => {
    expect(normaliseMemberCode("PV-7K3M9Q")).toBe("PV-7K3M9Q");
    expect(normaliseMemberCode("pv 7k3m9q")).toBe("PV-7K3M9Q");
    expect(normaliseMemberCode("7K3M9Q")).toBe("PV-7K3M9Q");
  });
  it("rejects wrong lengths and look-alike characters", () => {
    expect(normaliseMemberCode("PV-7K3M9")).toBeNull();
    expect(normaliseMemberCode("PV-0K3M9Q")).toBeNull();
    expect(normaliseMemberCode("hello@x.com")).toBeNull();
  });
  it("adds the ID to WhatsApp messages", () => {
    expect(withMemberId("Hello.", "PV-7K3M9Q")).toBe("Hello. My Poveon ID is PV-7K3M9Q.");
    expect(withMemberId("Hello.", null)).toBe("Hello.");
  });
});
