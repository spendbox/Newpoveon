export const dynamic = "force-dynamic";
import { site } from "@/config/site";
import { supabaseAdmin } from "@/lib/supabase/server";
import { setRequestStatus } from "../../actions";
import { aBtn, aBtnQuiet, aInput, Badge, Card, H1, Tabs } from "../../ui";
import { clockTime } from "@/lib/time";

export default async function RequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  const sp = await searchParams;
  const kind = sp.kind === "medication" ? "medication" : sp.kind === "home_test" ? "home_test" : sp.kind === "family_care" ? "family_care" : "all";
  const show = sp.show === "handled" ? "handled" : "open";
  let q = supabaseAdmin().from("service_requests").select("*").order("created_at", { ascending: false }).limit(200);
  if (kind !== "all") q = q.eq("kind", kind);
  q = show === "open" ? q.in("status", ["new", "in_progress"]) : q.in("status", ["handled", "cancelled"]);
  const { data: rows } = await q;
  const dayFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: site.timeZone });
  const fmt = { format: (d: Date) => `${dayFmt.format(d)}, ${clockTime(d, site.timeZone)}` };
  return (
    <>
      <H1 sub="Home tests and medication deliveries. Your team is also emailed for each new one.">Requests</H1>
      <Tabs active={`${kind}-${show}`} items={[
        { key: "all-open", label: "All open", href: "/admin/requests" },
        { key: "home_test-open", label: "Home tests", href: "/admin/requests?kind=home_test" },
        { key: "medication-open", label: "Medication", href: "/admin/requests?kind=medication" },
        { key: "family_care-open", label: "Family care", href: "/admin/requests?kind=family_care" },
        { key: `${kind}-handled`, label: "Handled", href: `/admin/requests?show=handled${kind !== "all" ? `&kind=${kind}` : ""}` },
      ]} />
      <div className="flex flex-col gap-3">
        {(rows ?? []).length === 0 && <Card>Nothing here.</Card>}
        {(rows ?? []).map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-lg font-semibold">{r.kind === "home_test" ? r.test_name ?? "Home test" : r.kind === "family_care" ? "Family care enquiry" : "Medication delivery"} · {r.name}</p>
                <p className="text-sm font-medium"><a className="underline" href={`tel:${r.phone}`}>{r.phone}</a>{r.email ? ` · ${r.email}` : ""}</p>
                <p className="text-sm">{r.address}</p>
                {r.preferred_time && <p className="text-sm">Preferred: {r.preferred_time}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge tone={r.status === "new" ? "warn" : r.status === "handled" ? "good" : "neutral"}>{r.status.replace("_", " ")}</Badge>
                <span className="text-xs text-muted">{fmt.format(new Date(r.created_at))}</span>
              </div>
            </div>
            {r.kind === "family_care" && (
              <div className="mt-2 rounded-lg bg-ground p-3 text-sm">
                <p><b>Lives in:</b> {r.details?.country || "not given"} · <b>Care for:</b> {r.details?.relationship}{r.details?.parent_name ? ` (${r.details.parent_name}` : ""}{r.details?.parent_age ? `, ${r.details.parent_age})` : r.details?.parent_name ? ")" : ""}</p>
                {r.details?.concerns?.length > 0 && <p><b>Concerns:</b> {r.details.concerns.join(", ")}</p>}
                {r.details?.plan && <p><b>Plan:</b> {r.details.plan}</p>}
                {r.details?.notes && <p><b>Notes:</b> {r.details.notes}</p>}
                <p className="mt-1 font-bold text-check-text">Confirm the parent agrees before starting care or sharing anything with the family.</p>
              </div>
            )}
            {r.kind === "medication" && (
              <div className="mt-2 rounded-lg bg-ground p-3 text-sm">
                <p><b>Medicines:</b> {r.details?.medicines}</p>
                <p><b>Prescription medicine:</b> {r.details?.prescription_answer}{r.details?.consult_reference ? ` · consult ref ${r.details.consult_reference}` : ""}</p>
                {r.has_prescription && <p className="mt-1 font-medium text-check-text">Check the doctor consult before supplying prescription medicines.</p>}
              </div>
            )}
            {r.amount_kobo != null && <p className="mt-1 text-sm">Price: ₦{(r.amount_kobo / 100).toLocaleString("en-NG")} (pay on confirmation)</p>}
            <form action={setRequestStatus} className="mt-3 flex flex-col gap-2">
              <input type="hidden" name="id" value={r.id} />
              <textarea name="notes" defaultValue={r.admin_notes ?? ""} rows={2} className={`${aInput} py-2`} placeholder="Notes" aria-label="Notes" />
              <div className="flex flex-wrap gap-2">
                {r.status === "new" && <button name="status" value="in_progress" className={aBtnQuiet}>Mark in progress</button>}
                {r.status !== "handled" && <button name="status" value="handled" className={aBtn}>Mark handled</button>}
                {r.status !== "cancelled" && r.status !== "handled" && <button name="status" value="cancelled" className={aBtnQuiet}>Cancel</button>}
                {(r.status === "handled" || r.status === "cancelled") && <button name="status" value="new" className={aBtnQuiet}>Re-open</button>}
              </div>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}
