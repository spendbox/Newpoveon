import { describe, expect, it } from "vitest";
import { discountLabel, memberPrice } from "./perks";

describe("plan member discount", () => {
  it("takes a fixed amount off", () => {
    expect(memberPrice(8000, { type: "fixed", value: 2500 })).toBe(5500);
    expect(discountLabel({ type: "fixed", value: 2500 })).toBe("₦2,500 off");
  });
  it("takes a percentage off, rounded to the naira", () => {
    expect(memberPrice(7999, { type: "percent", value: 20 })).toBe(6399);
    expect(discountLabel({ type: "percent", value: 20 })).toBe("20% off");
  });
  it("never goes below ₦100, and can be switched off", () => {
    expect(memberPrice(2000, { type: "fixed", value: 2500 })).toBe(100);
    expect(memberPrice(5000, { type: "percent", value: 100 })).toBe(100);
    expect(memberPrice(5000, { type: "none", value: 2500 })).toBe(5000);
    expect(discountLabel({ type: "none", value: 2500 })).toBe("");
  });
});
