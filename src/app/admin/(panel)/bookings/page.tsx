export const dynamic = "force-dynamic";
import { formatWhen } from "@/lib/email";
import type { Results } from "@/lib/scoring/results";
import { STATUS_LABEL } from "@/lib/scoring/results";
import { supabaseAdmin } from "@/lib/supabase/server";
import { saveBookingNotes, setBookingStatus } from "../../actions";
import { aBtn, aBtnQuiet, aInput, Badge, Card, H1, Tabs } from "../../ui";

const VIEWS = { upcoming: "Paid · upcoming", done: "Done", unpaid: "Unpaid", all: "All" } as const;

export default async function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  const sp = await searchParams;
  const view = (typeof sp.view === "string" && sp.view in VIEWS ? sp.view : "upcoming") as keyof typeof VIEWS;
  let q = supabaseAdmin().from("bookings").select("*, screenings(results, created_at)").limit(200);
  if (view === "upcoming") q = q.eq("status", "paid").order("slot_starts_at", { ascending: true, nullsFirst: true });
  else if (view === "done") q = q.eq("status", "completed").order("slot_starts_at", { ascending: false });
  else if (view === "unpaid") q = q.eq("status", "pending_payment").order("created_at", { ascending: false });
  else q = q.order("created_at", { ascending: false });
  const { data: rows } = await q;
  // Short-lived links so the team can listen to voice notes (the bucket is private).
  const paths = (rows ?? []).map((r) => r.voice_note_path).filter(Boolean) as string[];
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data: urls } = await supabaseAdmin().storage.from("voice-notes").createSignedUrls(paths, 3600);
    (urls ?? []).forEach((u) => u.signedUrl && u.path && signed.set(u.path, u.signedUrl));
  }
  return (
    <>
      <H1 sub={`Consult fees are set per type in Consults. Payments are confirmed by Paystack on the server.`}>Doctor bookings</H1>
      <Tabs active={view} items={Object.entries(VIEWS).map(([k, label]) => ({ key: k, label, href: `/admin/bookings?view=${k}` }))} />
      <div className="flex flex-col gap-3">
        {(rows ?? []).length === 0 && <Card>Nothing here yet.</Card>}
        {(rows ?? []).map((b) => {
          const shared = b.share_results && b.screenings ? (b.screenings.results as Results) : null;
          return (
            <Card key={b.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-semibold">{b.name}</p>
                  <p className="text-sm font-medium"><a className="underline" href={`tel:${b.phone}`}>{b.phone}</a> · {b.email}</p>
                  <p className="mt-1 text-sm">{b.slot_starts_at ? formatWhen(b.slot_starts_at) : "No slot: call to agree a time"}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={b.status === "paid" ? "good" : b.status === "pending_payment" ? "warn" : "neutral"}>{b.status.replace("_", " ")}</Badge>
                  {b.needs_reschedule && <Badge tone="warn">needs new time</Badge>}
                </div>
              </div>
              <p className="mt-2 text-sm"><span className="font-semibold">Needs help with:</span> {b.consult_type_name ?? "General consult"}{b.doctor_type ? ` · ${b.doctor_type}` : ""} · ₦{(b.amount_kobo / 100).toLocaleString("en-NG")}</p>
              <p className="text-sm"><span className="font-semibold">In their words:</span> {b.reason}</p>
              {b.voice_note_path && signed.get(b.voice_note_path) && (
                <div className="mt-2"><p className="text-xs font-semibold text-muted">Voice note</p><audio controls preload="none" src={signed.get(b.voice_note_path)} className="mt-1 w-full max-w-md" /></div>
              )}
              <p className="text-xs text-muted">Ref {b.paystack_reference}{b.paid_at ? ` · paid ${formatWhen(b.paid_at)}` : ""}</p>
              {shared && (
                <details className="mt-2 rounded-lg bg-ground p-3 text-sm">
                  <summary className="cursor-pointer font-semibold">Results shared by the patient</summary>
                  <p className="mt-2">Age {shared.age}, {shared.sex}. {shared.heart ? `Heart age ${shared.heart.heartAge.value}, 10-year risk ${shared.heart.riskPercent}%.` : shared.heartNote}</p>
                  <ul className="mt-1 list-disc pl-5">
                    {shared.cards.map((c) => <li key={c.id}><b>{c.topic}</b>: {STATUS_LABEL[c.status]}, {c.value}. {c.summary}</li>)}
                  </ul>
                </details>
              )}
              <form action={saveBookingNotes} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="id" value={b.id} />
                <label className="sr-only" htmlFor={`n-${b.id}`}>Notes</label>
                <textarea id={`n-${b.id}`} name="notes" defaultValue={b.admin_notes ?? ""} rows={2} className={`${aInput} py-2`} placeholder="Notes for the team" />
                <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="needs_reschedule" defaultChecked={b.needs_reschedule} /> Needs a new time</label>
                <div className="flex flex-wrap gap-2">
                  <button className={aBtnQuiet}>Save notes</button>
                  {b.status === "paid" && <button formAction={setBookingStatus} name="status" value="completed" className={aBtn}>Mark done</button>}
                  {b.status !== "cancelled" && b.status !== "completed" && <button formAction={setBookingStatus} name="status" value="cancelled" className={aBtnQuiet}>Cancel</button>}
                </div>
              </form>
            </Card>
          );
        })}
      </div>
    </>
  );
}
