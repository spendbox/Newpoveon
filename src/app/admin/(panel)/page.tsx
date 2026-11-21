export const dynamic = "force-dynamic";
import Link from "next/link";
import { site } from "@/config/site";
import { Icon, type IconName } from "@/components/icons";
import { formatWhen } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/server";
import { paystackTestMode } from "@/lib/paystack";
import { Card, H1 } from "../ui";

async function count(table: string, filter?: (q: any) => any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  let q = supabaseAdmin().from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
}

function Stat({ icon, label, value, sub, href, tint }: { icon: IconName; label: string; value: number; sub?: string; href?: string; tint: string }) {
  const body = (
    <Card className="h-full transition-shadow hover:shadow-[var(--shadow-md)]">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}><Icon name={icon} size={18} strokeWidth={2} /></span>
      <p className="mt-3 text-sm font-medium text-muted">{label}</p>
      <p className="font-display text-3xl font-semibold tabular">{value.toLocaleString("en-NG")}</p>
      {sub && <p className="text-xs font-medium text-subtle">{sub}</p>}
    </Card>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

/** The admin home: today at a glance. Counts and contact details only; no health answers. */
export default async function AdminHome() {
  // Server component: rendered fresh for each request, so reading the clock here is fine.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const since30 = new Date(now - 30 * 864e5).toISOString();
  const since7 = new Date(now - 7 * 864e5).toISOString();
  const nowIso = new Date(now).toISOString();
  const sb = supabaseAdmin();
  const [users, users7, completed, completed30, saved, paid, upcomingN, unpaid, newReqs, placeholders, upcoming, recentUsers, recentReqs] = await Promise.all([
    count("profiles"),
    count("profiles", (q) => q.gte("created_at", since7)),
    count("events", (q) => q.eq("type", "completed")),
    count("events", (q) => q.eq("type", "completed").gte("created_at", since30)),
    count("screenings"),
    count("bookings", (q) => q.in("status", ["paid", "completed"])),
    count("bookings", (q) => q.eq("status", "paid").gte("slot_starts_at", nowIso)),
    count("bookings", (q) => q.eq("status", "pending_payment")),
    count("service_requests", (q) => q.eq("status", "new")),
    count("emergency_contacts", (q) => q.eq("is_placeholder", true).eq("active", true)),
    sb.from("bookings").select("id, name, phone, slot_starts_at, consult_type_name, needs_reschedule").eq("status", "paid").or(`slot_starts_at.gte."${nowIso}",slot_starts_at.is.null`).order("slot_starts_at", { ascending: true, nullsFirst: true }).limit(6).then((r) => r.data ?? []),
    sb.from("profiles").select("id, email, full_name, created_at").order("created_at", { ascending: false }).limit(5).then((r) => r.data ?? []),
    sb.from("service_requests").select("id, kind, name, created_at").eq("status", "new").order("created_at", { ascending: false }).limit(5).then((r) => r.data ?? []),
  ]);
  const fmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: site.timeZone });
  const KIND: Record<string, string> = { home_test: "Lab test", medication: "Medication", family_care: "Family care" };

  return (
    <>
      <H1 sub="Today at a glance. No health answers are shown here.">Overview</H1>
      <div className="mb-5 flex flex-col gap-2">
        {paystackTestMode() && <p className="rounded-lg bg-check-bg px-4 py-2 text-sm font-medium text-check-text">Paystack is in TEST mode: no real money is being taken.</p>}
        {placeholders > 0 && <p className="rounded-lg bg-check-bg px-4 py-2 text-sm font-medium text-check-text">{placeholders} emergency contact placeholder(s) still need a real number. <Link href="/admin/contacts" className="underline">Fix it</Link></p>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="user" label="Registered users" value={users} sub={`${users7} new this week`} href="/admin/users" tint="bg-primary-soft text-primary" />
        <Stat icon="clipboard" label="Checks completed" value={completed} sub={`${completed30} in the last 30 days · ${saved.toLocaleString("en-NG")} saved`} tint="bg-lavender-soft text-lavender" />
        <Stat icon="stethoscope" label="Upcoming consults" value={upcomingN} sub={`${paid} paid in total · ${unpaid} unpaid`} href="/admin/bookings" tint="bg-coral-soft text-act-text" />
        <Stat icon="box" label="New requests" value={newReqs} sub="Lab tests, medicines and family care" href="/admin/requests" tint="bg-sun-soft text-check-text" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Next consults</h2>
            <Link href="/admin/bookings" className="text-sm font-semibold text-primary hover:underline">All bookings</Link>
          </div>
          {upcoming.length === 0 ? <p className="mt-3 text-sm text-muted">No paid consults coming up.</p> : (
            <ul className="mt-3 divide-y divide-line">
              {upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.name}</p>
                    <p className="truncate text-sm text-muted">{b.consult_type_name ?? "Consult"}</p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="font-medium">{b.slot_starts_at ? formatWhen(b.slot_starts_at) : "Call to agree a time"}</p>
                    {b.needs_reschedule ? <p className="text-xs font-semibold text-act-text">Needs a new time</p> : <a href={`tel:${b.phone}`} className="text-xs font-semibold text-primary">Call {b.phone}</a>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Newest users</h2>
              <Link href="/admin/users" className="text-sm font-semibold text-primary hover:underline">All users</Link>
            </div>
            {recentUsers.length === 0 ? <p className="mt-3 text-sm text-muted">No one has registered yet.</p> : (
              <ul className="mt-3 flex flex-col gap-2.5">
                {recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary uppercase">{(u.full_name || u.email).slice(0, 1)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{u.full_name || u.email}</span>
                    <span className="shrink-0 text-xs text-subtle">{fmt.format(new Date(u.created_at))}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New requests</h2>
              <Link href="/admin/requests" className="text-sm font-semibold text-primary hover:underline">Open</Link>
            </div>
            {recentReqs.length === 0 ? <p className="mt-3 text-sm text-muted">All caught up.</p> : (
              <ul className="mt-3 flex flex-col gap-2">
                {recentReqs.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{r.name}</span>
                    <span className="shrink-0 rounded-full bg-ground px-2 py-0.5 text-xs font-semibold text-muted">{KIND[r.kind] ?? r.kind}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <h2 className="text-lg font-semibold">Quick links</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[["/admin/consults", "Change consult fees", "edit"], ["/admin/slots", "Set availability", "calendar"], ["/admin/contacts", "Emergency contacts", "phone"], ["/", "Open the site", "home"]].map(([href, label, icon]) => (
            <Link key={href} href={href} className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold whitespace-nowrap hover:bg-ground"><Icon name={icon as IconName} size={16} strokeWidth={2} />{label}</Link>
          ))}
        </div>
      </Card>
    </>
  );
}
