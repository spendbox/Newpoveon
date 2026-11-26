import { describe, expect, it } from "vitest";
import { buckets, customerKey, firstPayments, growth, lagosWhen, parseLagosLocal, previousRange, resolveRange, stepFor, summarise, toCsv, toLagosLocal, type Payment } from "./revenue";

const pay = (over: Partial<Payment>): Payment => ({
  id: Math.random().toString(36), table: "plan_purchases", source: "check", amountKobo: 150000, paidAt: "2026-11-20T10:00:00Z",
  name: null, email: "a@x.com", phone: null, memberCode: null, reference: null, via: "paystack", description: null,
  refundedAt: null, refundNote: null, enteredBy: null, status: null, ...over,
});

// 26 Nov 2026, 3:30pm in Lagos.
const now = new Date("2026-11-26T14:30:00Z");

describe("Lagos time", () => {
  it("reads and writes date-time inputs in Lagos time", () => {
    expect(parseLagosLocal("2026-11-26T09:00")!.toISOString()).toBe("2026-11-26T08:00:00.000Z");
    expect(parseLagosLocal("2026-11-26")!.toISOString()).toBe("2026-11-25T23:00:00.000Z");
    expect(parseLagosLocal("nope")).toBeNull();
    expect(toLagosLocal(now)).toBe("2026-11-26T15:30");
    expect(lagosWhen("2026-11-26T14:30:00Z")).toBe("26 Nov 2026, 3:30pm");
    expect(lagosWhen("2026-11-25T23:00:00Z")).toBe("26 Nov 2026, 12am");
  });
});

describe("ranges", () => {
  it("today starts at Lagos midnight", () => {
    const r = resolveRange("today", now);
    expect(r.from.toISOString()).toBe("2026-11-25T23:00:00.000Z");
    const p = previousRange(r)!;
    expect(p.from.toISOString()).toBe("2026-11-24T23:00:00.000Z");
    expect(p.to.getTime()).toBe(r.to.getTime() - 864e5); // yesterday, up to the same time
    expect(previousRange(resolveRange("7d", now))!.to.getTime()).toBe(now.getTime() + 1 - 7 * 864e5);
  });
  it("last month is the whole of October, compared with September", () => {
    const r = resolveRange("last-month", now);
    expect(r.from.toISOString()).toBe("2026-09-30T23:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(previousRange(r)!.from.toISOString()).toBe("2026-08-31T23:00:00.000Z");
  });
  it("this month so far compares with the same days last month", () => {
    const r = resolveRange("month", now);
    const p = previousRange(r)!;
    expect(p.from.toISOString()).toBe("2026-09-30T23:00:00.000Z");
    expect(p.to.getTime() - p.from.getTime()).toBe(r.to.getTime() - r.from.getTime());
  });
  it("custom dates include the whole last day; bad input falls back to 30 days", () => {
    const r = resolveRange("custom", now, { from: "2026-11-01", to: "2026-11-02" });
    expect(r.to.getTime() - r.from.getTime()).toBe(2 * 864e5);
    expect(resolveRange("custom", now, { from: "2026-11-05", to: "2026-11-01" }).preset).toBe("30d");
    expect(resolveRange("bogus", now).preset).toBe("30d");
  });
  it("all time has no previous period", () => {
    expect(previousRange(resolveRange("all", now, undefined, new Date("2026-11-18T00:00:00Z")))).toBeNull();
  });
});

describe("totals", () => {
  it("takes refunds off and counts each person once", () => {
    const list = [
      pay({ amountKobo: 150000 }),
      pay({ amountKobo: 150000, email: "A@x.com " }),
      pay({ amountKobo: 12500000, source: "bio_age", email: "b@x.com", table: "offline_payments" }),
      pay({ amountKobo: 150000, email: "c@x.com", refundedAt: "2026-11-21T00:00:00Z" }),
    ];
    const s = summarise(list);
    expect(s.grossKobo).toBe(12950000);
    expect(s.refundKobo).toBe(150000);
    expect(s.netKobo).toBe(12800000);
    expect(s.payments).toBe(3);
    expect(s.refunds).toBe(1);
    expect(s.customers).toBe(2);
    expect(s.bySource.bio_age.netKobo).toBe(12500000);
  });
  it("counts new customers by their first-ever payment", () => {
    const old = pay({ paidAt: "2026-10-01T10:00:00Z" });
    const again = pay({ paidAt: "2026-11-20T10:00:00Z" });
    const fresh = pay({ email: "new@x.com", paidAt: "2026-11-21T10:00:00Z" });
    const r = { from: new Date("2026-11-01T00:00:00Z"), to: new Date("2026-12-01T00:00:00Z") };
    const s = summarise([again, fresh], r, firstPayments([old, again, fresh]));
    expect(s.customers).toBe(2);
    expect(s.newCustomers).toBe(1);
  });
  it("matches people by member ID or phone when there's no email", () => {
    expect(customerKey({ email: null, memberCode: "pv-abc", phone: null, name: null })).toBe("PV-ABC");
    expect(customerKey({ email: "", memberCode: null, phone: "+234 916 701", name: null })).toBe("234916701");
  });
  it("growth", () => {
    expect(growth(150, 100)).toBe(50);
    expect(growth(50, 100)).toBe(-50);
    expect(growth(50, 0)).toBeNull();
  });
});

describe("chart buckets", () => {
  it("picks hours, days, weeks or months by length", () => {
    expect(stepFor(resolveRange("today", now))).toBe("hour");
    expect(stepFor(resolveRange("30d", now))).toBe("day");
    expect(stepFor(resolveRange("year", now))).toBe("week");
    expect(stepFor({ from: new Date("2024-01-01"), to: now })).toBe("month");
  });
  it("adds kept payments into the right Lagos day and series", () => {
    const r = resolveRange("7d", now);
    const b = buckets([
      pay({ paidAt: "2026-11-25T23:30:00Z" }), // 12:30am on the 26th in Lagos
      pay({ paidAt: "2026-11-25T22:30:00Z", source: "lab_test", amountKobo: 2000000 }), // 11:30pm on the 25th
      pay({ paidAt: "2026-11-25T12:00:00Z", refundedAt: "2026-11-25T13:00:00Z" }),
    ], r);
    expect(b).toHaveLength(7);
    expect(b.at(-1)!.label).toBe("26 Nov");
    expect(b.at(-1)!.values).toEqual([1500, 0, 0, 0]);
    expect(b.at(-2)!.values).toEqual([0, 0, 20000, 0]);
    expect(b.at(-1)!.counts).toEqual([1, 0, 0, 0]);
  });
  it("labels hours in 12-hour time", () => {
    const b = buckets([], resolveRange("today", now));
    expect(b[0].label).toBe("12am");
    expect(b[15].label).toBe("3pm");
  });
});

describe("CSV", () => {
  it("quotes values and blocks spreadsheet formulas", () => {
    const csv = toCsv([pay({ name: '=HYPERLINK("x")', reference: "CK-1" })]);
    expect(csv.split("\r\n")[0]).toContain('"Paid at (Lagos)"');
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"Health check","1500"');
  });
});
