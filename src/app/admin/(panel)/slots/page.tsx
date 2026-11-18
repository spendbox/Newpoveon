export const dynamic = "force-dynamic";
import { site } from "@/config/site";
import { supabaseAdmin } from "@/lib/supabase/server";
import { addSlots, setSlotStatus } from "../../actions";
import { aBtn, aBtnQuiet, aInput, Badge, Card, H1 } from "../../ui";

export default async function SlotsPage() {
  const { data: slots } = await supabaseAdmin().from("availability_slots").select("id, starts_at, duration_min, status, held_until").gte("starts_at", new Date().toISOString()).order("starts_at").limit(400);
  const day = new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long", timeZone: site.timeZone });
  const time = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", timeZone: site.timeZone });
  const groups = new Map<string, typeof slots>();
  for (const s of slots ?? []) {
    const k = day.format(new Date(s.starts_at));
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }
  // Server component: rendered fresh for each request, so reading the clock here is fine.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return (
    <>
      <H1 sub="Times are Lagos time. People can book open times up to 21 days ahead.">Doctor availability</H1>
      <Card className="mb-5">
        <form action={addSlots} className="grid grid-cols-2 gap-3 md:grid-cols-5 md:items-end">
          <label className="text-sm font-medium">Date<input type="date" name="date" required className={aInput} /></label>
          <label className="text-sm font-medium">From<input type="time" name="from" required defaultValue="09:00" className={aInput} /></label>
          <label className="text-sm font-medium">To<input type="time" name="to" required defaultValue="13:00" className={aInput} /></label>
          <label className="text-sm font-medium">Every (minutes)<input type="number" name="every" min={10} max={120} defaultValue={site.consultMinutes} className={aInput} /></label>
          <button className={aBtn}>Add times</button>
        </form>
      </Card>
      {groups.size === 0 && <Card>No upcoming times. Add some above.</Card>}
      <div className="flex flex-col gap-4">
        {[...groups.entries()].map(([d, list]) => (
          <Card key={d}>
            <p className="mb-2 font-semibold">{d}</p>
            <div className="flex flex-wrap gap-2">
              {(list ?? []).map((s) => {
                const held = s.status === "held" && s.held_until && new Date(s.held_until).getTime() > now;
                const label = s.status === "booked" ? "booked" : held ? "being paid" : s.status === "held" ? "open" : s.status;
                return (
                  <form key={s.id} action={setSlotStatus} className="flex items-center gap-1 rounded-lg border border-line px-2 py-1">
                    <input type="hidden" name="id" value={s.id} />
                    <span className="text-sm font-semibold">{time.format(new Date(s.starts_at))}</span>
                    <Badge tone={label === "booked" ? "good" : label === "blocked" ? "warn" : "neutral"}>{label}</Badge>
                    {s.status === "open" && <button name="status" value="blocked" className={`${aBtnQuiet} min-h-[32px] px-2 text-xs`}>Block</button>}
                    {s.status === "blocked" && <button name="status" value="open" className={`${aBtnQuiet} min-h-[32px] px-2 text-xs`}>Open</button>}
                    {(s.status === "open" || s.status === "blocked") && <button name="status" value="delete" className={`${aBtnQuiet} min-h-[32px] px-2 text-xs`} aria-label="Delete time">Delete</button>}
                  </form>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
