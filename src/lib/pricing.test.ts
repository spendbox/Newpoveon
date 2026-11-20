import { describe, expect, it } from "vitest";
import { marginFromMarkup, pricePlan, type Component, type PricingSettings } from "./pricing";

const settings: PricingSettings = { defaultMarkup: 4, quarterlyPremium: 0.1, monthlyPremium: 0.15, roundTo: 1000 };
const components: Component[] = [
  { id: "doc", name: "Doctor review", category: "doctor", costNaira: 8000 },
  { id: "coord", name: "Coordinator month", category: "coordinator", costNaira: 1500 },
  { id: "labs", name: "Starting tests", category: "test", costNaira: 25000 },
  { id: "dev", name: "BP monitor", category: "device", costNaira: null },
];

describe("Care plan pricing", () => {
  const plan = { items: [{ componentId: "doc", quantity: 4 }, { componentId: "coord", quantity: 12 }, { componentId: "labs", quantity: 1 }] };

  it("prices from cost × markup, rounded up", () => {
    const p = pricePlan(plan, components, settings);
    expect(p.costNaira).toBe(75000);
    expect(p.annual).toBe(300000);
    expect(p.markup).toBe(4);
    expect(p.grossMargin).toBeCloseTo(0.75);
    expect(p.source).toBe("computed");
  });
  it("adds the instalment premiums", () => {
    const p = pricePlan(plan, components, settings);
    expect(p.quarterly).toBe(82500); // 300,000 × 1.10 ÷ 4
    expect(p.monthly).toBe(29000); // 300,000 × 1.15 ÷ 12 = 28,750 → rounded up to the next 500
  });
  it("uses a per-plan markup when set", () => {
    expect(pricePlan({ ...plan, markupOverride: 2 }, components, settings).annual).toBe(150000);
  });
  it("uses the admin's fixed price when set, and shows the markup it achieves", () => {
    const p = pricePlan({ ...plan, priceOverrideNaira: 250000 }, components, settings);
    expect(p.annual).toBe(250000);
    expect(p.markup).toBeCloseTo(250000 / 75000);
    expect(p.source).toBe("override");
  });
  it("refuses to compute a price while a cost is missing, and names it", () => {
    const p = pricePlan({ items: [...plan.items, { componentId: "dev", quantity: 1 }] }, components, settings);
    expect(p.annual).toBeNull();
    expect(p.missingCosts).toEqual(["BP monitor"]);
    expect(p.source).toBe("incomplete");
  });
  it("applies a customer option to the lines it affects", () => {
    const p = pricePlan(plan, components, settings, [{ category: "test", multiplier: 1.2, addNaira: 0 }]);
    expect(p.costNaira).toBe(80000);
    expect(p.annual).toBe(320000);
  });
  it("converts markup to margin", () => {
    expect(marginFromMarkup(4)).toBe(0.75);
    expect(marginFromMarkup(2)).toBe(0.5);
  });
});
