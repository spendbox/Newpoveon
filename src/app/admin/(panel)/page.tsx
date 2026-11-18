export const dynamic = "force-dynamic";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { paystackTestMode } from "@/lib/paystack";
import { Card, H1 } from "../ui";

async function count(table: string, filter?: (q: any) => any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  let q = supabaseAdmin().from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
}

export default async function AdminHome() {
  // Server component: rendered fresh for each request, so reading the clock here is fine.
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const sb = supabaseAdmin();
  const [started, completed, saved, started30, completed30, paid, upcoming, unpaid, newReqs, emails, placeholders] = await Promise.all([
    count("events", (q) => q.eq("type", "started")),
    count("events", (q) => q.eq("type", "completed")),
    count("screenings"),
    count("events", (q) => q.eq("type", "started").gte("created_at", since)),
    count("events", (q) => q.eq("type", "completed").gte("created_at", since)),
    count("bookings", (q) => q.in("status", ["paid", "completed"])),
    count("bookings", (q) => q.eq("status", "paid").gte("slot_starts_at", new Date().toISOString())),
    count("bookings", (q) => q.eq("status", "pending_payment")),
    count("service_requests", (q) => q.eq("status", "new")),
    sb.from("screenings").select("email").limit(10000).then(({ data }) => new Set((data ?? []).map((r) => r.email)).size),
    count("emergency_contacts", (q) => q.eq("is_placeholder", true).eq("active", true)),
  ]);
  const stats: [string, number, string?][] = [
    ["Screenings started", started, `${started30} in the last 30 days`],
    ["Screenings completed", completed, `${completed30} in the last 30 days`],
    ["Results saved", saved],
    ["Emails collected", emails],
    ["Paid doctor bookings", paid],
    ["Upcoming consults", upcoming],
    ["Unpaid bookings", unpaid],
    ["New requests", newReqs],
  ];
  return (
    <>
      <H1 sub="Counts only. No health answers are shown here.">Overview</H1>
      {paystackTestMode() && <p className="mb-4 rounded-lg bg-check-bg px-4 py-2 text-sm font-medium text-check-text">Paystack is in TEST mode: no real money is being taken.</p>}
      {placeholders > 0 && (
        <p className="mb-4 rounded-lg bg-check-bg px-4 py-2 text-sm font-medium text-check-text">
          {placeholders} emergency contact placeholder(s) still need a real number. <Link href="/admin/contacts" className="underline">Fix it</Link>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, n, sub]) => (
          <Card key={label}>
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className="font-display text-3xl font-semibold">{n.toLocaleString("en-NG")}</p>
            {sub && <p className="text-xs font-medium text-subtle">{sub}</p>}
          </Card>
        ))}
      </div>
    </>
  );
}
