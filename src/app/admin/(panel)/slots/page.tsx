export const dynamic = "force-dynamic";
import { availableSlots, loadBookingSettings } from "@/lib/consults";
import { supabaseAdmin } from "@/lib/supabase/server";
import { addException, addRule, deleteException, deleteRule, saveBookingSettings } from "../../actions";
import { aBtn, aBtnQuiet, aInput, Badge, Card, H1 } from "../../ui";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const t5 = (t: string) => t.slice(0, 5);

export default async function AvailabilityPage() {
  const sb = supabaseAdmin();
  const [settings, rules, exceptions, open, upcoming] = await Promise.all([
    loadBookingSettings(),
    sb.from("availability_rules").select("*").order("start_time"),
    sb.from("availability_exceptions").select("*").gte("on_date", new Date().toISOString().slice(0, 10)).order("on_date"),
    availableSlots(),
    sb.from("bookings").select("id, name, slot_starts_at, status, consult_type_name").gte("slot_starts_at", new Date().toISOString()).in("status", ["paid", "pending_payment"]).order("slot_starts_at").limit(30),
  ]);
  const fmt = new Intl.DateTimeFormat("en-NG", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" });
  return (
    <>
      <H1 sub="Set the hours you take consults each week. They repeat every week. A booked time disappears straight away. Times are Lagos time.">Availability</H1>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <p className="mb-3 font-semibold">Weekly hours</p>
          <div className="flex flex-col divide-y divide-line">
            {ORDER.map((d) => {
              const list = (rules.data ?? []).filter((r) => r.weekday === d);
              return (
                <div key={d} className="flex flex-wrap items-center gap-2 py-2.5">
                  <span className="w-28 text-sm font-semibold">{DAYS[d]}</span>
                  {list.length === 0 && <span className="text-sm text-subtle">Closed</span>}
                  {list.map((r) => (
                    <form key={r.id} action={deleteRule} className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-sm">
                      <input type="hidden" name="id" value={r.id} />
                      <span className="tabular">{t5(r.start_time)}–{t5(r.end_time)}</span>
                      {r.capacity > 1 && <Badge>{r.capacity} at a time</Badge>}
                      <button className="ml-1 text-xs text-act-text hover:underline" aria-label={`Remove ${DAYS[d]} ${t5(r.start_time)} to ${t5(r.end_time)}`}>Remove</button>
                    </form>
                  ))}
                </div>
              );
            })}
          </div>
          <form action={addRule} className="mt-4 rounded-lg bg-ground p-3">
            <p className="mb-2 text-sm font-semibold">Add hours</p>
            <div className="flex flex-wrap gap-2">
              {ORDER.map((d) => (
                <label key={d} className="flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-sm"><input type="checkbox" name="weekday" value={d} defaultChecked={d >= 1 && d <= 5} />{DAYS[d].slice(0, 3)}</label>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4 md:items-end">
              <label className="text-sm font-semibold">From<input type="time" name="start_time" required defaultValue="09:00" className={aInput} /></label>
              <label className="text-sm font-semibold">To<input type="time" name="end_time" required defaultValue="13:00" className={aInput} /></label>
              <label className="text-sm font-semibold">People per time<input type="number" name="capacity" min={1} max={50} defaultValue={1} className={aInput} title="1 for one doctor. More when several doctors cover these hours." /></label>
              <button className={aBtn}>Add to selected days</button>
            </div>
          </form>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <p className="mb-3 font-semibold">Booking rules</p>
            <form action={saveBookingSettings} className="grid grid-cols-2 gap-2">
              <label className="text-sm font-semibold">Consult length (min)<input type="number" name="slot_minutes" min={5} max={180} defaultValue={settings.slotMinutes} className={aInput} /></label>
              <label className="text-sm font-semibold">Minimum notice (hours)<input type="number" name="min_notice_hours" min={0} max={168} defaultValue={settings.minNoticeHours} className={aInput} /></label>
              <label className="text-sm font-semibold">Book up to (days ahead)<input type="number" name="horizon_days" min={1} max={120} defaultValue={settings.horizonDays} className={aInput} /></label>
              <label className="text-sm font-semibold">Hold unpaid time (min)<input type="number" name="hold_minutes" min={5} max={120} defaultValue={settings.holdMinutes} className={aInput} /></label>
              <div className="col-span-2"><button className={aBtn}>Save rules</button></div>
            </form>
            <p className="mt-3 text-xs text-subtle">{open.slots.length} open times in the next {settings.horizonDays} days.</p>
          </Card>

          <Card>
            <p className="mb-3 font-semibold">Closed days and extra hours</p>
            <ul className="mb-3 flex flex-col gap-1.5 text-sm">
              {(exceptions.data ?? []).length === 0 && <li className="text-subtle">None coming up.</li>}
              {(exceptions.data ?? []).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2">
                  <span>{e.on_date} · {e.kind === "closed" ? "Closed" : `Extra ${t5(e.start_time)}–${t5(e.end_time)}`}{e.note ? ` · ${e.note}` : ""}</span>
                  <form action={deleteException}><input type="hidden" name="id" value={e.id} /><button className="text-xs text-act-text hover:underline">Remove</button></form>
                </li>
              ))}
            </ul>
            <form action={addException} className="grid grid-cols-2 gap-2">
              <label className="text-sm font-semibold">Date<input type="date" name="on_date" required className={aInput} /></label>
              <label className="text-sm font-semibold">Type<select name="kind" className={aInput}><option value="closed">Closed all day</option><option value="extra">Extra hours</option></select></label>
              <label className="text-sm font-semibold">From (extra)<input type="time" name="start_time" className={aInput} /></label>
              <label className="text-sm font-semibold">To (extra)<input type="time" name="end_time" className={aInput} /></label>
              <label className="col-span-2 text-sm font-semibold">Note<input name="note" placeholder="e.g. Public holiday" className={aInput} /></label>
              <div className="col-span-2"><button className={aBtnQuiet}>Add</button></div>
            </form>
          </Card>

          <Card>
            <p className="mb-3 font-semibold">Booked times</p>
            <ul className="flex flex-col gap-1.5 text-sm">
              {(upcoming.data ?? []).length === 0 && <li className="text-subtle">No bookings yet.</li>}
              {(upcoming.data ?? []).map((b) => (
                <li key={b.id} className="flex justify-between gap-2"><span>{fmt.format(new Date(b.slot_starts_at))} · {b.name}</span><Badge tone={b.status === "paid" ? "good" : "warn"}>{b.status === "paid" ? "paid" : "paying"}</Badge></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
