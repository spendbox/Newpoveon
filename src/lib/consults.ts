import "server-only";
import { generateSlots, type Exception, type Rule, type ScheduleSettings, type Slot } from "@/lib/schedule";
import { supabaseAdmin } from "@/lib/supabase/server";

export type ConsultType = {
  id: string; code: string; name: string; description: string | null; grp: string; doctor_type: string;
  duration_min: number; price_naira: number | null; urgent_check: boolean; credit_to_plan: boolean; active: boolean; sort: number;
};

/** Consult types people can book now (active and priced). */
export async function bookableConsultTypes(): Promise<ConsultType[]> {
  const { data } = await supabaseAdmin().from("consult_types").select("*").eq("active", true).not("price_naira", "is", null).order("sort");
  return (data ?? []) as ConsultType[];
}

export async function loadBookingSettings(): Promise<ScheduleSettings & { holdMinutes: number }> {
  const { data } = await supabaseAdmin().from("booking_settings").select("*").eq("id", 1).maybeSingle();
  return {
    slotMinutes: data?.slot_minutes ?? 20,
    minNoticeHours: data?.min_notice_hours ?? 2,
    horizonDays: data?.horizon_days ?? 21,
    holdMinutes: data?.hold_minutes ?? 30,
  };
}

/** Bookable times right now, with booked and held times removed. */
export async function availableSlots(): Promise<{ slots: Slot[]; settings: Awaited<ReturnType<typeof loadBookingSettings>> }> {
  const sb = supabaseAdmin();
  const settings = await loadBookingSettings();
  const now = new Date();
  const until = new Date(now.getTime() + (settings.horizonDays + 1) * 86400000).toISOString();
  const holdSince = new Date(now.getTime() - settings.holdMinutes * 60000).toISOString();
  const [rules, exceptions, booked] = await Promise.all([
    sb.from("availability_rules").select("weekday, start_time, end_time, capacity").eq("active", true),
    sb.from("availability_exceptions").select("on_date, kind, start_time, end_time, capacity").gte("on_date", now.toISOString().slice(0, 10)),
    sb.from("bookings").select("slot_starts_at, status, created_at").gte("slot_starts_at", now.toISOString()).lte("slot_starts_at", until)
      .or(`status.in.(paid,completed),and(status.eq.pending_payment,created_at.gt.${holdSince})`),
  ]);
  const taken = new Map<string, number>();
  for (const b of booked.data ?? []) {
    if (!b.slot_starts_at) continue;
    const k = new Date(b.slot_starts_at).toISOString();
    taken.set(k, (taken.get(k) ?? 0) + 1);
  }
  const r: Rule[] = (rules.data ?? []).map((x) => ({ weekday: x.weekday, start: x.start_time, end: x.end_time, capacity: x.capacity }));
  const e: Exception[] = (exceptions.data ?? []).map((x) => ({ date: x.on_date, kind: x.kind, start: x.start_time, end: x.end_time, capacity: x.capacity }));
  return { slots: generateSlots(r, e, settings, now, taken), settings };
}
