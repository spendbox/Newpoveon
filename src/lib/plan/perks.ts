/**
 * Health plan perks: money off doctor consults while a plan is active.
 * Set in Admin → Consults and fees as a fixed amount or a percentage.
 */
export type Discount = { type: "none" | "percent" | "fixed"; value: number };

/** Lowest a discounted consult can cost, so Paystack can still take the payment. */
export const MIN_CONSULT_NAIRA = 100;

/** The price a plan member pays, in naira. */
export function memberPrice(price: number, d: Discount): number {
  if (d.type === "none" || d.value <= 0 || price <= MIN_CONSULT_NAIRA) return price;
  const off = d.type === "percent" ? Math.round((price * Math.min(100, d.value)) / 100) : d.value;
  return Math.max(MIN_CONSULT_NAIRA, price - off);
}

/** "₦2,500 off" or "20% off". Empty when there's no discount. */
export function discountLabel(d: Discount): string {
  if (d.type === "none" || d.value <= 0) return "";
  return d.type === "percent" ? `${d.value}% off` : `₦${d.value.toLocaleString("en-NG")} off`;
}
