/**
 * Care plan pricing engine. Pure functions: admin edits the inputs (unit costs, quantities,
 * markup, instalment premiums, overrides), this works out the prices.
 *
 *   cost      = Σ (unit cost × quantity × option multiplier) + option add-ons
 *   annual    = price override, or cost × markup, rounded UP to `roundTo`
 *   quarterly = annual × (1 + quarterly premium) ÷ 4   (rounded up)
 *   monthly   = annual × (1 + monthly premium) ÷ 12    (rounded up)
 *
 * "Markup" is price ÷ cost: 4× markup = 75% gross margin.
 */
export interface PricingSettings {
  defaultMarkup: number;
  quarterlyPremium: number; // 0.10 = 10% more when paying quarterly
  monthlyPremium: number;
  roundTo: number; // e.g. 1000 → prices end in ,000
}

export interface Component {
  id: string;
  name: string;
  category: string;
  costNaira: number | null; // null = not set yet
}

export interface PlanItem {
  componentId: string;
  quantity: number;
}

export interface Plan {
  items: PlanItem[];
  markupOverride?: number | null;
  priceOverrideNaira?: number | null;
}

/** A customer choice, e.g. "Tests at home" = ×1.2 on test lines + ₦5,000. */
export interface PriceOption {
  category: string | null;
  multiplier: number;
  addNaira: number;
}

export interface PlanPrice {
  costNaira: number;
  missingCosts: string[]; // components still without a cost
  markup: number; // the markup actually achieved (price ÷ cost)
  grossMargin: number; // 1 − cost ÷ price
  annual: number | null; // null when it can't be priced yet
  quarterly: number | null;
  monthly: number | null;
  source: "override" | "computed" | "incomplete";
}

const roundUp = (n: number, step: number) => (step > 0 ? Math.ceil(n / step) * step : Math.ceil(n));

export function planCost(plan: Plan, components: Component[], options: PriceOption[] = []) {
  const byId = new Map(components.map((c) => [c.id, c]));
  let cost = 0;
  const missing: string[] = [];
  for (const item of plan.items) {
    const c = byId.get(item.componentId);
    if (!c) continue;
    if (c.costNaira == null) {
      missing.push(c.name);
      continue;
    }
    const mult = options.filter((o) => o.category === c.category).reduce((m, o) => m * o.multiplier, 1);
    cost += c.costNaira * item.quantity * mult;
  }
  cost += options.reduce((s, o) => s + (o.addNaira || 0), 0);
  return { cost: Math.round(cost), missing };
}

export function pricePlan(plan: Plan, components: Component[], settings: PricingSettings, options: PriceOption[] = []): PlanPrice {
  const { cost, missing } = planCost(plan, components, options);
  let annual: number | null;
  let source: PlanPrice["source"];
  if (plan.priceOverrideNaira != null && plan.priceOverrideNaira > 0) {
    // An option still changes an overridden price by the same proportion as it changes cost.
    const base = planCost(plan, components).cost;
    const ratio = base > 0 && options.length ? cost / base : 1;
    annual = roundUp(plan.priceOverrideNaira * ratio, settings.roundTo);
    source = "override";
  } else if (missing.length === 0 && cost > 0) {
    annual = roundUp(cost * (plan.markupOverride ?? settings.defaultMarkup), settings.roundTo);
    source = "computed";
  } else {
    annual = null;
    source = "incomplete";
  }
  const markup = annual && cost > 0 ? annual / cost : 0;
  return {
    costNaira: cost,
    missingCosts: missing,
    markup,
    grossMargin: annual && cost > 0 ? 1 - cost / annual : 0,
    annual,
    quarterly: annual ? roundUp((annual * (1 + settings.quarterlyPremium)) / 4, Math.min(settings.roundTo, 500) || 1) : null,
    monthly: annual ? roundUp((annual * (1 + settings.monthlyPremium)) / 12, Math.min(settings.roundTo, 500) || 1) : null,
    source,
  };
}

/** Markup ↔ gross margin, for showing both to admins. */
export const marginFromMarkup = (markup: number) => (markup > 0 ? 1 - 1 / markup : 0);
