/**
 * Weekly availability → bookable times. Pure functions (tested in schedule.test.ts).
 * All times are Lagos time (WAT, UTC+1 all year, no daylight saving).
 * Capacity = how many people can book the same time; overlapping hours add up
 * (so a second doctor's hours simply add capacity).
 */
export interface Rule { weekday: number; start: string; end: string; capacity: number }
export interface Exception { date: string; kind: "closed" | "extra"; start?: string | null; end?: string | null; capacity?: number }
export interface ScheduleSettings { slotMinutes: number; minNoticeHours: number; horizonDays: number }
export interface Slot { startsAt: string; capacity: number; remaining: number }

const OFFSET_MIN = 60; // WAT = UTC+1
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};
/** Lagos calendar date (YYYY-MM-DD) for a moment in time. */
export const lagosDate = (d: Date) => new Date(d.getTime() + OFFSET_MIN * 60000).toISOString().slice(0, 10);
const utcFromLagos = (date: string, minutes: number) => {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, 0, minutes) - OFFSET_MIN * 60000);
};

/** Every bookable start time in the horizon, with how many places are left. */
export function generateSlots(rules: Rule[], exceptions: Exception[], s: ScheduleSettings, now: Date, taken: Map<string, number> = new Map()): Slot[] {
  const earliest = now.getTime() + s.minNoticeHours * 3600000;
  const out: Slot[] = [];
  const today = lagosDate(now);
  for (let i = 0; i <= s.horizonDays; i++) {
    const date = lagosDate(new Date(utcFromLagos(today, 12 * 60).getTime() + i * 86400000));
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const closed = exceptions.some((e) => e.date === date && e.kind === "closed");
    const ranges = [
      ...(closed ? [] : rules.filter((r) => r.weekday === weekday).map((r) => ({ a: toMin(r.start), b: toMin(r.end), cap: r.capacity }))),
      ...exceptions.filter((e) => e.date === date && e.kind === "extra" && e.start && e.end).map((e) => ({ a: toMin(e.start!), b: toMin(e.end!), cap: e.capacity ?? 1 })),
    ];
    const caps = new Map<number, number>();
    for (const r of ranges) {
      for (let t = r.a; t + s.slotMinutes <= r.b; t += s.slotMinutes) caps.set(t, (caps.get(t) ?? 0) + r.cap);
    }
    for (const [t, cap] of [...caps.entries()].sort((x, y) => x[0] - y[0])) {
      const at = utcFromLagos(date, t);
      if (at.getTime() < earliest) continue;
      const iso = at.toISOString();
      const remaining = cap - (taken.get(iso) ?? 0);
      if (remaining > 0) out.push({ startsAt: iso, capacity: cap, remaining });
    }
  }
  return out;
}
