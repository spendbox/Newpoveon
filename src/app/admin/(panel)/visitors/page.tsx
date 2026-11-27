export const dynamic = "force-dynamic";
import Link from "next/link";
import { SubmitButton } from "@/components/buttons";
import { bySource, dropOffs, funnel, pageLabel, pct, sourceLabel, traffic } from "@/lib/funnel";
import { firstView, loadFunnel } from "@/lib/funnel-server";
import { growth, lagosWhen, PRESETS, previousRange, resolveRange, toLagosLocal } from "@/lib/revenue";
import { aBtn, aInput, Badge, Card, H1 } from "../../ui";

/**
 * Admin → Visitors and drop-off. How many people visit, how many open and finish the health check,
 * and the exact questions where people stop. All anonymous: no answers are ever recorded.
 */
export default async function VisitorsPage({ searchParams }: PageProps<"/admin/visitors">) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).slice(0, 40) : "");
  // Server component: rendered fresh for each request, so reading the clock here is fine.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date(Date.now());
  const range = resolveRange(one("range") || "7d", now, { from: one("from"), to: one("to") }, await firstView().catch(() => null));
  const prev = previousRange(range);
  const [cur, before] = await Promise.all([loadFunnel(range), prev ? loadFunnel(prev) : Promise.resolve(null)]);

  const t = traffic(cur.views);
  const steps = funnel(t.visitors, cur.sessions, cur.paid);
  const tb = before ? traffic(before.views) : null;
  const stepsBefore = before && tb ? funnel(tb.visitors, before.sessions, before.paid) : null;
  const drops = dropOffs(cur.sessions, now.getTime());
  const top = [...drops.rows].filter((r) => r.stopped > 0).sort((a, b) => b.stopped - a.stopped || b.rate - a.rate).slice(0, 5);
  const topIds = new Set(top.slice(0, 3).map((r) => r.id));
  const sources = bySource(cur.views, cur.sessions);
  const max = Math.max(1, ...steps.map((s) => s.count));

  // The biggest loss between two steps of the health check itself (not "visited → opened").
  let worst: { from: string; to: string; lost: number; rate: number } | null = null;
  for (let i = 2; i < steps.length; i++) {
    const lost = steps[i - 1].count - steps[i].count;
    if (lost > 0 && (!worst || lost > worst.lost)) worst = { from: steps[i - 1].label, to: steps[i].label, lost, rate: pct(lost, steps[i - 1].count) };
  }

  const withRange = (k: string) => `/admin/visitors?range=${k}`;
  const fmtSpan = (r: { from: Date; to: Date }) => `${lagosWhen(r.from.toISOString())} to ${lagosWhen(new Date(r.to.getTime() - 60_000).toISOString())}`;
  const stat = (key: string) => ({ now: steps.find((s) => s.key === key)!.count, before: stepsBefore?.find((s) => s.key === key)!.count ?? null });

  return (
    <>
      <H1 sub="How many people visit, how many start and finish the health check, and the exact questions where people stop. Anonymous: no names, emails or answers are recorded. Times are Lagos time.">Visitors and drop-off</H1>
      {cur.needsSql && <p className="mb-4 rounded-lg bg-check-bg px-4 py-2 text-sm font-medium text-check-text">Run SQL 19 in Supabase to start counting. Counting starts from the moment it&apos;s run; earlier visits weren&apos;t recorded.</p>}

      <nav className="mb-3 flex gap-2 overflow-x-auto pb-1" aria-label="Date range">
        {PRESETS.map((p) => (
          <Link key={p.key} href={withRange(p.key)} aria-current={range.preset === p.key ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${range.preset === p.key ? "bg-ink text-white" : "border border-line bg-surface hover:bg-ground"}`}>{p.label}</Link>
        ))}
      </nav>
      <form className="mb-5 grid gap-2 rounded-xl border border-line bg-surface p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <input type="hidden" name="range" value="custom" />
        <label className="text-xs font-semibold text-muted">From
          <input type="datetime-local" name="from" defaultValue={range.preset === "custom" ? one("from") : toLagosLocal(range.from)} className={`${aInput} mt-1`} required />
        </label>
        <label className="text-xs font-semibold text-muted">To
          <input type="datetime-local" name="to" defaultValue={range.preset === "custom" ? one("to") : toLagosLocal(now)} className={`${aInput} mt-1`} required />
        </label>
        <SubmitButton className={`${aBtn} whitespace-nowrap`}>Apply dates</SubmitButton>
      </form>
      <p className="mb-3 text-sm text-muted"><b className="text-ink">{range.label}</b>: {fmtSpan(range)}{prev && <> · compared with {fmtSpan(prev)}</>}</p>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Visitors" value={t.visitors} before={tb?.visitors ?? null} sub={`${t.views.toLocaleString("en-NG")} page views`} />
        <Stat label="Opened the health check" value={stat("open").now} before={stat("open").before} sub={`${pct(stat("open").now, t.visitors)}% of visitors`} />
        <Stat label="Answered every question" value={stat("done").now} before={stat("done").before} sub={`${pct(stat("done").now, stat("open").now)}% of those who opened it`} />
        <Stat label="Paid for their results" value={stat("paid").now} before={stat("paid").before} sub={`${pct(stat("paid").now, stat("done").now)}% of those who finished`} />
      </div>

      {/* The funnel: one bar per step, with how many were lost between steps. */}
      <Card className="mb-5">
        <h2 className="text-lg font-semibold">From visit to payment</h2>
        <p className="mb-4 text-sm text-muted">Each step, and how many people were lost before the next one.{worst && <> The biggest drop is between <b className="text-ink">{worst.from.toLowerCase()}</b> and <b className="text-ink">{worst.to.toLowerCase()}</b>: {worst.lost.toLocaleString("en-NG")} people ({worst.rate}%).</>}</p>
        <ol className="flex flex-col">
          {steps.map((s, i) => {
            const lost = i > 0 ? steps[i - 1].count - s.count : 0;
            return (
              <li key={s.key}>
                {i > 0 && lost > 0 && (
                  <p className={`my-1 pl-1 text-xs font-semibold ${worst && worst.to === s.label ? "text-act-text" : "text-subtle"}`}>
                    <span aria-hidden="true">↓ </span>{lost.toLocaleString("en-NG")} left ({pct(lost, steps[i - 1].count)}%)
                  </p>
                )}
                {i > 0 && lost <= 0 && <div className="h-2" />}
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 sm:grid-cols-[220px_minmax(0,1fr)_auto]">
                  <span className="min-w-0 sm:col-start-1 sm:row-start-1">
                    <span className="block text-sm font-semibold">{s.label}</span>
                    <span className="block text-xs text-muted">{s.help}</span>
                  </span>
                  <span className="col-span-2 row-start-2 mt-1 h-3 overflow-hidden rounded-full bg-ground sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:mt-0" aria-hidden="true">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${(s.count / max) * 100}%` }} />
                  </span>
                  <span className="col-start-2 row-start-1 text-right sm:col-start-3">
                    <span className="block font-display text-xl font-semibold tabular">{s.count.toLocaleString("en-NG")}</span>
                    <span className="block text-xs text-subtle">{i === 0 ? " " : `${pct(s.count, steps[0].count)}% of visitors`}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-xs text-subtle">Steps 2 to 7 count health check attempts started in this period. Payments are health check payments made in this period. Someone who comes back to an old check counts once.</p>
      </Card>

      {/* Where people stop in the questions. */}
      <Card className="mb-5">
        <h2 className="text-lg font-semibold">Where people stop in the questions</h2>
        <p className="mb-3 text-sm text-muted">
          Numbers match what people see on screen (&ldquo;5 of 31&rdquo;); &ldquo;5+&rdquo; is a question only some people get, after question 5. A person &ldquo;stopped&rdquo; at a question if it was on their screen when they left, and they didn&apos;t come back within 30 minutes.
          {" "}<b className="text-ink">{drops.stopped.toLocaleString("en-NG")}</b> stopped, <b className="text-ink">{drops.finished.toLocaleString("en-NG")}</b> finished{drops.inProgress ? <>, {drops.inProgress.toLocaleString("en-NG")} still answering</> : null}.
        </p>
        {top.length > 0 && (
          <ol className="mb-4 grid gap-2 sm:grid-cols-2">
            {top.map((r, i) => (
              <li key={r.id} className={`flex items-start gap-3 rounded-lg p-3 ${i < 3 ? "bg-act-bg" : "bg-ground"}`}>
                <span className="font-display text-lg font-semibold tabular">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{r.sometimes ? `After question ${r.number}` : `Question ${r.number}`}: {r.title}</span>
                  <span className="block text-xs text-muted">{r.stopped.toLocaleString("en-NG")} stopped here · {r.rate}% of the {r.reached.toLocaleString("en-NG")} who got this far</span>
                </span>
              </li>
            ))}
          </ol>
        )}
        {drops.rows.length === 0 ? <p className="text-sm text-muted">No health check attempts in this period yet.</p> : (
          <div className="max-h-[560px] overflow-auto rounded-lg border border-line">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="sticky top-0 bg-ground text-xs text-subtle">
                <tr><th className="px-3 py-2 font-medium">#</th><th className="font-medium">Question</th><th className="px-2 text-right font-medium">Got this far</th><th className="px-2 text-right font-medium">Stopped here</th><th className="w-40 px-3 font-medium">Share who stopped</th></tr>
              </thead>
              <tbody>
                {drops.rows.map((r) => (
                  <tr key={r.id} className={`border-t border-line ${topIds.has(r.id) ? "bg-act-bg/60" : ""}`}>
                    <td className="px-3 py-2 text-subtle tabular">{r.sometimes ? `${r.number}+` : r.number}</td>
                    <td className="py-2 pr-2">
                      <span className="block font-medium">{r.title}</span>
                      <span className="text-xs text-muted">{r.topic}{r.sometimes ? " · only some people see this" : ""}</span>
                      {topIds.has(r.id) && <span className="ml-2"><Badge tone="warn">Top drop-off</Badge></span>}
                    </td>
                    <td className="px-2 text-right tabular">{r.reached.toLocaleString("en-NG")}</td>
                    <td className="px-2 text-right font-semibold tabular">{r.stopped.toLocaleString("en-NG")}</td>
                    <td className="px-3">
                      <span className="flex items-center gap-2">
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-ground" aria-hidden="true"><span className="block h-full rounded-full bg-act-text" style={{ width: `${Math.min(100, r.rate)}%` }} /></span>
                        <span className="w-12 text-right text-xs tabular">{r.rate}%</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Where visitors come from</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-subtle"><tr><th className="py-1.5 font-medium">Source</th><th className="text-right font-medium">Visitors</th><th className="text-right font-medium">Opened check</th><th className="text-right font-medium">Finished</th></tr></thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.key} className="border-t border-line">
                  <td className="py-2 font-medium">{sourceLabel(s.key)}</td>
                  <td className="text-right tabular">{s.visitors.toLocaleString("en-NG")}</td>
                  <td className="text-right tabular">{s.opened.toLocaleString("en-NG")}</td>
                  <td className="text-right tabular">{s.finished.toLocaleString("en-NG")}</td>
                </tr>
              ))}
              {sources.length === 0 && <tr><td colSpan={4} className="py-3 text-muted">No visits in this period yet.</td></tr>}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-subtle">WhatsApp often hides where people came from, so they show as &ldquo;Direct&rdquo;. To count WhatsApp properly, share this link instead: <span className="font-mono text-ink">poveon.com/?utm_source=whatsapp</span> (or <span className="font-mono text-ink">?utm_source=flyer</span> on flyers).</p>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Pages</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-subtle"><tr><th className="py-1.5 font-medium">Page</th><th className="text-right font-medium">Views</th><th className="text-right font-medium">Visitors</th></tr></thead>
            <tbody>
              {t.pages.slice(0, 15).map((p) => (
                <tr key={p.key} className="border-t border-line">
                  <td className="py-2 font-medium">{pageLabel(p.key)}</td>
                  <td className="text-right tabular">{p.views.toLocaleString("en-NG")}</td>
                  <td className="text-right tabular">{p.visitors.toLocaleString("en-NG")}</td>
                </tr>
              ))}
              {t.pages.length === 0 && <tr><td colSpan={3} className="py-3 text-muted">No visits in this period yet.</td></tr>}
            </tbody>
          </table>
          {t.visitors > 0 && <p className="mt-3 text-xs text-subtle">Devices: {pct(t.devices.phone, t.visitors)}% phone, {pct(t.devices.tablet, t.visitors)}% tablet, {pct(t.devices.desktop, t.visitors)}% computer.</p>}
        </Card>
      </div>
      <p className="text-xs text-subtle">A visitor is one browser, counted once (a random number kept on their device, not linked to who they are). Admin pages aren&apos;t counted.</p>
    </>
  );
}

function Stat({ label, value, before, sub }: { label: string; value: number; before: number | null; sub: string }) {
  const g = growth(value, before);
  return (
    <Card>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="font-display text-3xl font-semibold tabular">{value.toLocaleString("en-NG")}</p>
      <p className="text-xs font-medium text-subtle">{sub}</p>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-subtle">
        {before === null ? "Nothing to compare with" : g === null ? `was ${before.toLocaleString("en-NG")}` : (
          <>
            <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold whitespace-nowrap ${g === 0 ? "bg-ground text-muted" : g > 0 ? "bg-good-bg text-good-text" : "bg-act-bg text-act-text"}`}>
              <span aria-hidden="true">{g === 0 ? "→" : g > 0 ? "↑" : "↓"}</span>{g === 0 ? "No change" : `${g > 0 ? "Up" : "Down"} ${Math.abs(g)}%`}
            </span>
            from {before.toLocaleString("en-NG")}
          </>
        )}
      </p>
    </Card>
  );
}
