export const dynamic = "force-dynamic";
import Link from "next/link";
import { SubmitButton } from "@/components/buttons";
import { Icon } from "@/components/icons";
import {
  buckets, firstPayments, growth, inRange, isSource, lagosWhen, naira, PRESETS, previousRange, resolveRange,
  SERIES, SOURCE_LABEL, SOURCES, stepFor, summarise, toLagosLocal, type Payment, type Source,
} from "@/lib/revenue";
import { loadPayments } from "@/lib/revenue-server";
import { aBtn, aBtnQuiet, aInput, Badge, Card, H1 } from "../../ui";
import { deletePayment, recordPayment, setRefund } from "./actions";
import { RevenueChart } from "./revenue-chart";

const VIA: Record<string, string> = { paystack: "Paystack (website)", transfer: "Bank transfer", cash: "Cash", pos: "POS", other: "Other" };
const STEP_WORD = { hour: "hour", day: "day", week: "week", month: "month" } as const;
const SHOW = 50;

/**
 * Admin → Revenue. Every payment ever received, online and on WhatsApp, filtered by date and time
 * (Lagos), with growth against the period before, a chart, a breakdown and a CSV download.
 */
export default async function RevenuePage({ searchParams }: PageProps<"/admin/revenue">) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).slice(0, 100) : "");
  const preset = one("range") || "30d";
  const source = isSource(one("source")) ? (one("source") as Source) : null;
  const q = one("q").trim().toLowerCase();

  const { payments: everything, needsSql } = await loadPayments();
  // Server component: rendered fresh for each request, so reading the clock here is fine.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date(Date.now());
  const oldest = everything.at(-1) ? new Date(everything.at(-1)!.paidAt) : null;
  const range = resolveRange(preset, now, { from: one("from"), to: one("to") }, oldest);
  const prev = previousRange(range);

  const scoped = source ? everything.filter((p) => p.source === source) : everything;
  const first = firstPayments(everything); // "new customer" means new to Poveon, whatever they bought
  const cur = scoped.filter((p) => inRange(p, range));
  const before = prev ? scoped.filter((p) => inRange(p, prev)) : null;
  const s = summarise(cur, range, first);
  const b = before && prev ? summarise(before, prev, first) : null;
  const allTime = summarise(scoped);

  const step = stepFor(range);
  const chart = buckets(cur, range, step).map((x) => ({ label: x.label, long: x.long, values: x.values, counts: x.counts }));

  const match = (p: Payment) => !q || [p.name, p.email, p.phone, p.memberCode, p.reference, p.description].some((v) => v?.toLowerCase().includes(q));
  const listed = cur.filter(match);

  // Keep the filters on every link and form.
  const keep = new URLSearchParams();
  keep.set("range", range.preset);
  if (range.preset === "custom") { keep.set("from", one("from")); keep.set("to", one("to")); }
  if (source) keep.set("source", source);
  if (q) keep.set("q", q);
  const ret = keep.toString();
  const withParams = (over: Record<string, string | null>) => {
    const u = new URLSearchParams(keep);
    for (const [k, v] of Object.entries(over)) { if (v === null) u.delete(k); else u.set(k, v); }
    if (u.get("range") !== "custom") { u.delete("from"); u.delete("to"); }
    return `/admin/revenue?${u.toString()}`;
  };

  const fmtSpan = (r: { from: Date; to: Date }) => `${lagosWhen(r.from.toISOString())} to ${lagosWhen(new Date(r.to.getTime() - 60_000).toISOString())}`;
  const customFrom = range.preset === "custom" ? one("from") : toLagosLocal(range.from);
  const customTo = range.preset === "custom" ? one("to") : toLagosLocal(now);

  return (
    <>
      <span id="top" />
      <H1 sub="Every payment received: health checks, plans and consults paid on the website, and payments your team records from WhatsApp. Times are Lagos time.">Revenue</H1>

      {needsSql && <p className="mb-4 rounded-lg bg-check-bg px-4 py-2 text-sm font-medium text-check-text">Run SQL 18 in Supabase to record WhatsApp payments and refunds. Website payments are already shown below.</p>}
      {sp.saved && <p className="mb-4 rounded-lg bg-good-bg px-4 py-2 text-sm font-medium text-good-text">Payment recorded.</p>}
      {sp.refunded && <p className="mb-4 rounded-lg bg-good-bg px-4 py-2 text-sm font-medium text-good-text">{sp.refunded === "undone" ? "Refund removed. The payment counts again." : "Marked as refunded. It no longer counts in the totals."}</p>}
      {sp.deleted && <p className="mb-4 rounded-lg bg-good-bg px-4 py-2 text-sm font-medium text-good-text">Payment deleted.</p>}
      {typeof sp.error === "string" && <p className="mb-4 rounded-lg bg-act-bg px-4 py-2 text-sm font-medium text-act-text">{sp.error}</p>}

      {/* Filters: one row of quick ranges, then your own dates and what it was for. */}
      <nav className="mb-3 flex gap-2 overflow-x-auto pb-1" aria-label="Date range">
        {PRESETS.map((p) => (
          <Link key={p.key} href={withParams({ range: p.key })} aria-current={range.preset === p.key ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${range.preset === p.key ? "bg-ink text-white" : "border border-line bg-surface hover:bg-ground"}`}>{p.label}</Link>
        ))}
      </nav>
      <form className="mb-5 grid gap-2 rounded-xl border border-line bg-surface p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <input type="hidden" name="range" value="custom" />
        {q && <input type="hidden" name="q" value={q} />}
        <label className="text-xs font-semibold text-muted">From
          <input type="datetime-local" name="from" defaultValue={customFrom} className={`${aInput} mt-1`} required />
        </label>
        <label className="text-xs font-semibold text-muted">To
          <input type="datetime-local" name="to" defaultValue={customTo} className={`${aInput} mt-1`} required />
        </label>
        <label className="text-xs font-semibold text-muted">What for
          <select name="source" defaultValue={source ?? ""} className={`${aInput} mt-1`}>
            <option value="">Everything</option>
            {SOURCES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
          </select>
        </label>
        <SubmitButton className={`${aBtn} whitespace-nowrap`}>Apply dates</SubmitButton>
      </form>
      {source && <p className="-mt-3 mb-4 text-sm">Showing <b>{SOURCE_LABEL[source]}</b> only. <Link href={withParams({ source: null })} className="font-semibold text-primary hover:underline">Show everything</Link></p>}

      <p className="mb-3 text-sm text-muted">
        <b className="text-ink">{range.label}</b>: {fmtSpan(range)}{prev && <> · compared with {fmtSpan(prev)}</>}
      </p>

      {/* The headline numbers. */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={naira(s.netKobo)} change={growth(s.netKobo, b?.netKobo)} before={b ? naira(b.netKobo) : null} big
          sub={s.refundKobo ? `${naira(s.grossKobo)} received, ${naira(s.refundKobo)} refunded` : "After refunds"} />
        <Stat label="Payments" value={s.payments.toLocaleString("en-NG")} change={growth(s.payments, b?.payments)} before={b ? b.payments.toLocaleString("en-NG") : null}
          sub={`Average ${naira(s.averageKobo)}`} />
        <Stat label="Customers" value={s.customers.toLocaleString("en-NG")} change={growth(s.customers, b?.customers)} before={b ? b.customers.toLocaleString("en-NG") : null}
          sub={`${s.newCustomers.toLocaleString("en-NG")} paying for the first time`} />
        <Stat label="Health checks paid" value={s.bySource.check.payments.toLocaleString("en-NG")} change={growth(s.bySource.check.payments, b?.bySource.check.payments)}
          before={b ? b.bySource.check.payments.toLocaleString("en-NG") : null} sub={naira(s.bySource.check.netKobo)} />
      </div>

      <Card className="mb-5">
        <h2 className="text-lg font-semibold">Revenue by {STEP_WORD[step]}</h2>
        <p className="mb-3 text-sm text-muted">After refunds. Hover over or tap a bar for the details. Switch to &ldquo;Number of payments&rdquo; to see health checks next to bigger payments.</p>
        <RevenueChart buckets={chart} series={SERIES.map(({ key, label }) => ({ key, label }))} stepWord={STEP_WORD[step]} />
      </Card>

      <Card className="mb-5">
        <h2 className="mb-3 text-lg font-semibold">What it was for</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs text-subtle"><tr><th className="py-1.5 font-medium">What for</th><th className="text-right font-medium">Payments</th><th className="text-right font-medium">Revenue</th><th className="text-right font-medium">Share</th><th className="pl-3 text-right font-medium">vs before</th></tr></thead>
            <tbody>
              {SOURCES.filter((x) => (!source || x.key === source) && (s.bySource[x.key].payments || b?.bySource[x.key].payments)).map((x) => {
                const c = s.bySource[x.key], g = growth(c.netKobo, b?.bySource[x.key].netKobo);
                return (
                  <tr key={x.key} className="border-t border-line">
                    <td className="py-2"><Link href={withParams({ source: x.key })} className="font-semibold hover:underline">{x.label}</Link> <span className="text-xs text-subtle">{x.online ? "website" : "WhatsApp"}</span></td>
                    <td className="text-right tabular">{c.payments.toLocaleString("en-NG")}</td>
                    <td className="text-right font-semibold tabular">{naira(c.netKobo)}</td>
                    <td className="text-right tabular">{s.netKobo ? `${Math.round((c.netKobo / s.netKobo) * 100)}%` : "–"}</td>
                    <td className="pl-3 text-right"><Change value={g} /></td>
                  </tr>
                );
              })}
              {s.payments === 0 && !b?.payments && <tr><td colSpan={5} className="py-3 text-muted">No payments in this period.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-subtle">All time{source ? ` (${SOURCE_LABEL[source]})` : ""}: <b className="text-ink">{naira(allTime.netKobo)}</b> from {allTime.payments.toLocaleString("en-NG")} payments by {allTime.customers.toLocaleString("en-NG")} customers{oldest ? `, since ${lagosWhen(oldest.toISOString()).split(",")[0]}` : ""}.</p>
      </Card>

      {/* Record a WhatsApp payment, in two short steps. */}
      <details className="mb-5 rounded-xl border border-line bg-surface" open={!!sp.error && !sp.refunded}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
          <span>
            <span className="block text-lg font-semibold">Record a WhatsApp payment</span>
            <span className="block text-sm text-muted">For the Biological Age Check, lab tests, medicines or anything paid outside the website.</span>
          </span>
          <span className={`${aBtn} inline-flex shrink-0 items-center whitespace-nowrap`}>Add payment</span>
        </summary>
        <form action={recordPayment} className="flex flex-col gap-5 border-t border-line p-4">
          <input type="hidden" name="return" value={ret} />
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold">1. The payment</legend>
            <label className="text-sm font-semibold">What for
              <select name="kind" className={`${aInput} mt-1`} defaultValue="bio_age" required>
                {SOURCES.filter((x) => x.key !== "consult").map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Amount (₦)
              <input name="amount" inputMode="numeric" placeholder="125000" className={`${aInput} mt-1`} required />
            </label>
            <label className="text-sm font-semibold">When it was paid
              <input type="datetime-local" name="paid_at" defaultValue={toLagosLocal(now)} className={`${aInput} mt-1`} required />
            </label>
            <label className="text-sm font-semibold">How they paid
              <select name="paid_via" className={`${aInput} mt-1`} defaultValue="transfer">
                {Object.entries(VIA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold sm:col-span-2">Details <span className="font-normal text-muted">(optional)</span>
              <input name="description" placeholder="Like: Lipid profile and HbA1c" className={`${aInput} mt-1`} />
            </label>
          </fieldset>
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold">2. Who paid</legend>
            <label className="text-sm font-semibold sm:col-span-2">Member ID, email or name
              <input name="who" placeholder="PV-… (from their WhatsApp message)" className={`${aInput} mt-1`} required aria-describedby="who-help" />
              <span id="who-help" className="mt-1 block text-xs font-normal text-muted">With a member ID or email, the payment is linked to their account.</span>
            </label>
            <label className="text-sm font-semibold">Phone <span className="font-normal text-muted">(optional)</span>
              <input name="phone" inputMode="tel" className={`${aInput} mt-1`} />
            </label>
            <label className="text-sm font-semibold">Transfer reference <span className="font-normal text-muted">(optional)</span>
              <input name="reference" className={`${aInput} mt-1`} />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">Note for the team <span className="font-normal text-muted">(optional)</span>
              <input name="note" className={`${aInput} mt-1`} />
            </label>
          </fieldset>
          <SubmitButton className={`${aBtn} self-start whitespace-nowrap`}>Save payment</SubmitButton>
        </form>
      </details>

      {/* Every payment in the period. */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Payments <span className="text-sm font-normal text-muted">({listed.length.toLocaleString("en-NG")}{q ? " matching" : ""})</span></h2>
        <div className="flex gap-2">
          <form className="flex gap-2" role="search">
            {[...keep.entries()].filter(([k]) => k !== "q").map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <input name="q" defaultValue={q} placeholder="Name, email, ID or reference" className={aInput} aria-label="Search payments" />
            <SubmitButton className={aBtnQuiet}>Find</SubmitButton>
          </form>
          <a href={`/admin/revenue/csv?${ret}`} className={`${aBtnQuiet} inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap`}><Icon name="download" size={16} strokeWidth={2.2} />CSV</a>
        </div>
      </div>
      {listed.length === 0 ? <Card><p className="text-sm text-muted">No payments{q ? ` matching "${q}"` : ""} in this period.</p></Card> : (
        <ul className="flex flex-col gap-2">
          {listed.slice(0, SHOW).map((p) => (
            <li key={`${p.table}-${p.id}`}>
              <details className="rounded-xl border border-line bg-surface">
                <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 p-3 sm:grid-cols-[150px_1fr_auto]">
                  <span className="text-xs text-muted sm:text-sm">{lagosWhen(p.paidAt)}</span>
                  <span className="col-start-1 row-start-2 min-w-0 truncate sm:col-start-2 sm:row-start-1">
                    <b>{p.name || p.email || p.memberCode || p.phone || "Unknown"}</b> <span className="text-sm text-muted">· {SOURCE_LABEL[p.source]}</span>
                  </span>
                  <span className={`row-span-2 text-right font-semibold tabular sm:row-span-1 ${p.refundedAt ? "text-muted line-through" : ""}`}>
                    {naira(p.amountKobo)}
                    {p.refundedAt && <span className="ml-2 no-underline"><Badge tone="warn">Refunded</Badge></span>}
                  </span>
                </summary>
                <div className="border-t border-line p-3 text-sm">
                  <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[140px_1fr]">
                    {p.description && <><dt className="text-muted">Details</dt><dd>{p.description}</dd></>}
                    {p.email && <><dt className="text-muted">Email</dt><dd>{p.email}</dd></>}
                    {p.phone && <><dt className="text-muted">Phone</dt><dd>{p.phone}</dd></>}
                    {p.memberCode && <><dt className="text-muted">Member ID</dt><dd><Link href={`/admin/bio-age?code=${encodeURIComponent(p.memberCode)}`} className="font-mono font-semibold text-primary hover:underline">{p.memberCode}</Link></dd></>}
                    <dt className="text-muted">Paid via</dt><dd>{VIA[p.via] ?? p.via}</dd>
                    {p.reference && <><dt className="text-muted">Reference</dt><dd className="font-mono text-xs">{p.reference}</dd></>}
                    {p.status && p.status !== "paid" && p.status !== "completed" && <><dt className="text-muted">Booking</dt><dd className="capitalize">{p.status.replace("_", " ")} after paying</dd></>}
                    {p.enteredBy && <><dt className="text-muted">Entered by</dt><dd>{p.enteredBy}</dd></>}
                    {p.refundedAt && <><dt className="text-muted">Refunded</dt><dd>{lagosWhen(p.refundedAt)}{p.refundNote ? ` · ${p.refundNote}` : ""}</dd></>}
                  </dl>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <form action={setRefund} className="flex flex-1 flex-col gap-2 sm:flex-row">
                      <input type="hidden" name="return" value={ret} />
                      <input type="hidden" name="table" value={p.table} />
                      <input type="hidden" name="id" value={p.id} />
                      {p.refundedAt ? (
                        <><input type="hidden" name="undo" value="1" /><SubmitButton className={`${aBtnQuiet} whitespace-nowrap`}>Undo refund</SubmitButton></>
                      ) : (
                        <>
                          <input name="refund_note" placeholder="Why it was refunded (optional)" className={aInput} aria-label="Refund note" />
                          <SubmitButton className={`${aBtnQuiet} shrink-0 whitespace-nowrap`}>Mark as refunded</SubmitButton>
                        </>
                      )}
                    </form>
                    {p.table === "offline_payments" && (
                      <form action={deletePayment} className="flex gap-2">
                        <input type="hidden" name="return" value={ret} />
                        <input type="hidden" name="id" value={p.id} />
                        <input name="confirm" placeholder="Type delete" className={`${aInput} w-32`} aria-label="Type delete to confirm" autoComplete="off" />
                        <SubmitButton className="min-h-[40px] shrink-0 rounded-lg bg-act-text px-4 text-sm font-semibold whitespace-nowrap text-white hover:opacity-90">Delete</SubmitButton>
                      </form>
                    )}
                  </div>
                  {p.table !== "offline_payments" && !p.refundedAt && <p className="mt-2 text-xs text-subtle">Marking it refunded only updates these totals. Send the money back in Paystack first.</p>}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
      {listed.length > SHOW && <p className="mt-3 text-sm text-muted">Showing the newest {SHOW}. Download the CSV for all {listed.length.toLocaleString("en-NG")}, or narrow the dates.</p>}
      <p className="mt-6 text-xs text-subtle">Website payments come from Paystack and can&apos;t be changed here, only marked as refunded. Customers are counted once each, by email, member ID or phone.</p>
    </>
  );
}

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-subtle">–</span>;
  const up = value > 0, flat = value === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${flat ? "bg-ground text-muted" : up ? "bg-good-bg text-good-text" : "bg-act-bg text-act-text"}`}>
      <span aria-hidden="true">{flat ? "→" : up ? "↑" : "↓"}</span>{flat ? "No change" : `${up ? "Up" : "Down"} ${Math.abs(value)}%`}
    </span>
  );
}

function Stat({ label, value, sub, change, before, big }: { label: string; value: string; sub?: string; change: number | null; before: string | null; big?: boolean }) {
  return (
    <Card className={big ? "bg-[linear-gradient(135deg,#0E2A24,#136F58)] text-white" : ""}>
      <p className={`text-sm font-medium ${big ? "text-white/75" : "text-muted"}`}>{label}</p>
      <p className="font-display text-3xl font-semibold tabular">{value}</p>
      {sub && <p className={`text-xs font-medium ${big ? "text-white/70" : "text-subtle"}`}>{sub}</p>}
      <p className={`mt-2 flex flex-wrap items-center gap-1.5 text-xs ${big ? "text-white/70" : "text-subtle"}`}>
        {before === null ? "Nothing to compare with" : <><Change value={change} /> {change === null ? `was ${before}` : `from ${before}`}</>}
      </p>
    </Card>
  );
}

