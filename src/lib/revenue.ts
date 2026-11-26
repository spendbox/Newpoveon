/**
 * Revenue: every payment Poveon has received, from the website (health checks, plans, consults) and
 * from WhatsApp (entered by the team). Pure functions: date ranges in Lagos time, totals, growth and
 * the chart buckets. The page and the CSV download both use these.
 */

export type Source = "check" | "plan" | "consult" | "bio_age" | "lab_test" | "medicine" | "other";
export type Table = "plan_purchases" | "bookings" | "offline_payments";

export const SOURCES: { key: Source; label: string; online: boolean }[] = [
  { key: "check", label: "Health check", online: true },
  { key: "plan", label: "Plan", online: true },
  { key: "bio_age", label: "Biological Age Check", online: false },
  { key: "lab_test", label: "Lab test", online: false },
  { key: "medicine", label: "Medicine", online: false },
  { key: "consult", label: "Doctor consult", online: true },
  { key: "other", label: "Other", online: false },
];
export const SOURCE_LABEL = Object.fromEntries(SOURCES.map((s) => [s.key, s.label])) as Record<Source, string>;
export const isSource = (s: string): s is Source => SOURCES.some((x) => x.key === s);

/** The chart folds the sources into four series, always in this order (so a colour always means the same thing). */
export const SERIES: { key: string; label: string; sources: Source[] }[] = [
  { key: "check", label: "Health checks", sources: ["check"] },
  { key: "bio", label: "Biological age", sources: ["bio_age"] },
  { key: "lab", label: "Lab tests and medicines", sources: ["lab_test", "medicine"] },
  { key: "other", label: "Plans and other", sources: ["plan", "consult", "other"] },
];
export const seriesIndex = (s: Source) => SERIES.findIndex((x) => x.sources.includes(s));

export type Payment = {
  id: string;
  table: Table;
  source: Source;
  amountKobo: number;
  paidAt: string; // ISO
  name: string | null;
  email: string | null;
  phone: string | null;
  memberCode: string | null;
  reference: string | null;
  via: string; // "paystack", "transfer", "cash"...
  description: string | null;
  refundedAt: string | null;
  refundNote: string | null;
  enteredBy: string | null;
  status: string | null; // bookings only: cancelled after paying, etc.
};

/** Who paid, as one key, so the same person is counted once. */
export const customerKey = (p: Pick<Payment, "email" | "memberCode" | "phone" | "name">) =>
  (p.email?.trim().toLowerCase() || p.memberCode?.trim().toUpperCase() || p.phone?.replace(/\D/g, "") || p.name?.trim().toLowerCase() || "") || null;

// ---------------------------------------------------------------- Lagos time (UTC+1 all year, no daylight saving)
const LAGOS_MS = 60 * 60 * 1000;
const toLagos = (d: Date) => new Date(d.getTime() + LAGOS_MS); // read with getUTC*
const fromLagosParts = (y: number, m: number, d: number, h = 0, min = 0) => new Date(Date.UTC(y, m, d, h, min) - LAGOS_MS);

/** "2026-11-26T14:30" typed in Lagos time → a real moment. */
export function parseLagosLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(s.trim());
  if (!m) return null;
  const d = fromLagosParts(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
  return Number.isNaN(d.getTime()) ? null : d;
}
/** A real moment → "2026-11-26T14:30" in Lagos time, for date-time inputs. */
export function toLagosLocal(d: Date): string {
  const l = toLagos(d);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${l.getUTCFullYear()}-${p(l.getUTCMonth() + 1)}-${p(l.getUTCDate())}T${p(l.getUTCHours())}:${p(l.getUTCMinutes())}`;
}
const startOfLagosDay = (d: Date) => { const l = toLagos(d); return fromLagosParts(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate()); };

// ---------------------------------------------------------------- Date ranges
export const PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "last-month", label: "Last month" },
  { key: "90d", label: "Last 90 days" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
] as const;
export type Preset = (typeof PRESETS)[number]["key"] | "custom";

/** A range is [from, to): from is included, to is not. */
export type Range = { preset: Preset; from: Date; to: Date; label: string };

const DAY = 864e5;

/** Turn the page's filters into a range. Unknown or broken input falls back to the last 30 days. */
export function resolveRange(preset: string | undefined, now: Date, custom?: { from?: string; to?: string }, firstPayment?: Date | null): Range {
  const today = startOfLagosDay(now);
  const l = toLagos(now);
  const y = l.getUTCFullYear(), mo = l.getUTCMonth();
  const end = new Date(now.getTime() + 1); // up to and including now
  const label = (k: string) => PRESETS.find((p) => p.key === k)?.label ?? "";
  switch (preset) {
    case "today": return { preset, from: today, to: end, label: label(preset) };
    case "yesterday": return { preset, from: new Date(today.getTime() - DAY), to: today, label: label(preset) };
    case "7d": return { preset, from: new Date(today.getTime() - 6 * DAY), to: end, label: label(preset) };
    case "month": return { preset, from: fromLagosParts(y, mo, 1), to: end, label: label(preset) };
    case "last-month": return { preset, from: fromLagosParts(y, mo - 1, 1), to: fromLagosParts(y, mo, 1), label: label(preset) };
    case "90d": return { preset, from: new Date(today.getTime() - 89 * DAY), to: end, label: label(preset) };
    case "year": return { preset, from: fromLagosParts(y, 0, 1), to: end, label: label(preset) };
    case "all": return { preset, from: firstPayment ? startOfLagosDay(firstPayment) : new Date(today.getTime() - 29 * DAY), to: end, label: label(preset) };
    case "custom": {
      const from = custom?.from ? parseLagosLocal(custom.from) : null;
      // A date with no time means "to the end of that day".
      let to = custom?.to ? parseLagosLocal(custom.to) : null;
      if (to && custom?.to && !custom.to.includes("T")) to = new Date(to.getTime() + DAY);
      if (from && to && from < to) return { preset, from, to, label: "Custom dates" };
      break;
    }
  }
  return { preset: "30d", from: new Date(today.getTime() - 29 * DAY), to: end, label: label("30d") };
}

/** The period just before, of the same length, to compare against. Months compare with the whole month before. */
export function previousRange(r: Range): { from: Date; to: Date } | null {
  if (r.preset === "all") return null;
  if (r.preset === "month" || r.preset === "last-month") {
    const l = toLagos(r.from);
    const from = fromLagosParts(l.getUTCFullYear(), l.getUTCMonth() - 1, 1);
    // "This month" so far compares with the same number of days last month, so growth is fair.
    const to = r.preset === "month" ? new Date(Math.min(from.getTime() + (r.to.getTime() - r.from.getTime()), r.from.getTime())) : r.from;
    return { from, to };
  }
  if (r.preset === "year") {
    const l = toLagos(r.from);
    const from = fromLagosParts(l.getUTCFullYear() - 1, 0, 1);
    return { from, to: new Date(Math.min(from.getTime() + (r.to.getTime() - r.from.getTime()), r.from.getTime())) };
  }
  // "Today" or "last 7 days" run up to now: compare with the same days before, up to the same time of day.
  const len = r.to.getTime() - r.from.getTime();
  const shift = ["today", "7d", "30d", "90d"].includes(r.preset) ? Math.ceil(len / DAY) * DAY : len;
  return { from: new Date(r.from.getTime() - shift), to: new Date(r.to.getTime() - shift) };
}

export const inRange = (p: Pick<Payment, "paidAt">, r: { from: Date; to: Date }) => {
  const t = new Date(p.paidAt).getTime();
  return t >= r.from.getTime() && t < r.to.getTime();
};

// ---------------------------------------------------------------- Totals
export type Summary = {
  grossKobo: number; // everything received
  refundKobo: number; // given back
  netKobo: number; // kept
  payments: number; // payments kept (refunded ones not counted)
  refunds: number;
  customers: number; // different people who paid
  newCustomers: number; // paid for the first time ever in this period
  averageKobo: number; // per payment kept
  bySource: Record<Source, { netKobo: number; payments: number }>;
};

/** Totals for a set of payments. firstSeen maps each customer to their first-ever payment time. */
export function summarise(list: Payment[], range?: { from: Date; to: Date }, firstSeen?: Map<string, number>): Summary {
  const bySource = Object.fromEntries(SOURCES.map((s) => [s.key, { netKobo: 0, payments: 0 }])) as Summary["bySource"];
  let gross = 0, refund = 0, kept = 0, refunds = 0;
  const people = new Set<string>();
  const fresh = new Set<string>();
  for (const p of list) {
    gross += p.amountKobo;
    if (p.refundedAt) { refund += p.amountKobo; refunds++; continue; }
    kept++;
    bySource[p.source].netKobo += p.amountKobo;
    bySource[p.source].payments++;
    const key = customerKey(p);
    if (key) {
      people.add(key);
      const first = firstSeen?.get(key);
      if (range && first !== undefined && first >= range.from.getTime() && first < range.to.getTime()) fresh.add(key);
    }
  }
  const net = gross - refund;
  return { grossKobo: gross, refundKobo: refund, netKobo: net, payments: kept, refunds, customers: people.size, newCustomers: fresh.size, averageKobo: kept ? Math.round(net / kept) : 0, bySource };
}

/** Each customer's first payment that wasn't refunded, to spot new customers. */
export function firstPayments(all: Payment[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of all) {
    if (p.refundedAt) continue;
    const k = customerKey(p);
    if (!k) continue;
    const t = new Date(p.paidAt).getTime();
    if (!m.has(k) || t < m.get(k)!) m.set(k, t);
  }
  return m;
}

/** Growth from the previous period, in percent. null when there's nothing to compare with. */
export function growth(now: number, before: number | null | undefined): number | null {
  if (before == null || before === 0) return null;
  return Math.round(((now - before) / before) * 1000) / 10;
}

// ---------------------------------------------------------------- Chart buckets
export type Step = "hour" | "day" | "week" | "month";
export type Bucket = { start: Date; end: Date; label: string; long: string; values: number[]; counts: number[] }; // values in naira and payment counts, one per SERIES

export function stepFor(r: { from: Date; to: Date }): Step {
  const days = (r.to.getTime() - r.from.getTime()) / DAY;
  return days <= 2 ? "hour" : days <= 92 ? "day" : days <= 366 ? "week" : "month";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const hour12 = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
const dayLabel = (l: Date) => `${l.getUTCDate()} ${MONTHS[l.getUTCMonth()]}`;

/** Splits the range into hours, days, weeks (from Monday) or months, and adds up kept payments in each. */
export function buckets(list: Payment[], r: { from: Date; to: Date }, step = stepFor(r)): Bucket[] {
  const out: Bucket[] = [];
  let l = toLagos(r.from);
  let start: Date;
  if (step === "hour") start = fromLagosParts(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate(), l.getUTCHours());
  else if (step === "day") start = fromLagosParts(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate());
  else if (step === "week") start = fromLagosParts(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate() - ((l.getUTCDay() + 6) % 7));
  else start = fromLagosParts(l.getUTCFullYear(), l.getUTCMonth(), 1);
  for (let guard = 0; start < r.to && guard < 400; guard++) {
    l = toLagos(start);
    const end = step === "hour" ? new Date(start.getTime() + LAGOS_MS)
      : step === "day" ? new Date(start.getTime() + DAY)
      : step === "week" ? new Date(start.getTime() + 7 * DAY)
      : fromLagosParts(l.getUTCFullYear(), l.getUTCMonth() + 1, 1);
    const label = step === "hour" ? hour12(l.getUTCHours()) : step === "month" ? `${MONTHS[l.getUTCMonth()]} ${String(l.getUTCFullYear()).slice(2)}` : dayLabel(l);
    const long = step === "hour" ? `${dayLabel(l)}, ${hour12(l.getUTCHours())} to ${hour12((l.getUTCHours() + 1) % 24)}`
      : step === "day" ? `${dayLabel(l)} ${l.getUTCFullYear()}`
      : step === "week" ? `Week of ${dayLabel(l)} ${l.getUTCFullYear()}`
      : `${MONTHS[l.getUTCMonth()]} ${l.getUTCFullYear()}`;
    out.push({ start, end, label, long, values: SERIES.map(() => 0), counts: SERIES.map(() => 0) });
    start = end;
  }
  for (const p of list) {
    if (p.refundedAt) continue;
    const t = new Date(p.paidAt).getTime();
    const b = out.find((x) => t >= x.start.getTime() && t < x.end.getTime());
    if (b) { b.values[seriesIndex(p.source)] += p.amountKobo / 100; b.counts[seriesIndex(p.source)]++; }
  }
  return out;
}

// ---------------------------------------------------------------- Formatting and CSV
export const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;

export function lagosWhen(iso: string): string {
  const l = toLagos(new Date(iso));
  const h = l.getUTCHours(), m = l.getUTCMinutes();
  return `${dayLabel(l)} ${l.getUTCFullYear()}, ${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

const cell = (v: string | number | null | undefined) => {
  const s = v == null ? "" : String(v);
  // Quote everything; stop spreadsheets treating a value as a formula.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};
export function toCsv(list: Payment[]): string {
  const head = ["Paid at (Lagos)", "What for", "Amount (NGN)", "Refunded", "Refund note", "Name", "Email", "Phone", "Member ID", "Paid via", "Reference", "Details", "Entered by"];
  const rows = list.map((p) => [lagosWhen(p.paidAt), SOURCE_LABEL[p.source], Math.round(p.amountKobo / 100), p.refundedAt ? lagosWhen(p.refundedAt) : "", p.refundNote, p.name, p.email, p.phone, p.memberCode, p.via, p.reference, p.description, p.enteredBy]);
  return [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
