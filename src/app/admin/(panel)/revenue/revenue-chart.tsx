"use client";
import { useEffect, useRef, useState } from "react";

export type ChartBucket = { label: string; long: string; values: number[]; counts: number[] };
type Series = { key: string; label: string };

// Categorical slots 1–4 (validated for stacked bars: adjacent CVD ΔE ≥ 11.8, normal-vision ≥ 23.8).
// Three sit under 3:1 on white, so the table view and the hover breakdown carry the numbers.
const COLORS = ["#257de0", "#f47230", "#00b894", "#f2a600"];
const money = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const short = (n: number) => (n >= 1e6 ? `₦${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}m` : n >= 1e4 ? `₦${Math.round(n / 1e3)}k` : n >= 1e3 ? `₦${Math.round(n / 100) / 10}k` : `₦${Math.round(n)}`);

/** A "nice" top for the axis: 1, 2 or 5 × a power of ten. */
function niceMax(v: number, count = false) {
  if (v <= 0) return count ? 4 : 1000;
  if (count && v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= v) ?? 10) * p;
}

/** Money in over time, stacked by what it was for. Hover or tap a bar for the breakdown. */
export function RevenueChart({ buckets: raw, series, stepWord }: { buckets: ChartBucket[]; series: Series[]; stepWord: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const [byCount, setByCount] = useState(false);
  const buckets = byCount ? raw.map((b) => ({ ...b, values: b.counts })) : raw;
  const fmt = (n: number) => (byCount ? `${n.toLocaleString("en-NG")} ${n === 1 ? "payment" : "payments"}` : money(n));
  const axis = (n: number) => (byCount ? String(Math.round(n)) : short(n));

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totals = buckets.map((b) => b.values.reduce((a, v) => a + v, 0));
  const max = niceMax(Math.max(0, ...totals), byCount);
  const H = 240, top = 18, bottom = 26, left = 52, right = 8;
  const plotW = width - left - right, plotH = H - top - bottom;
  const slot = plotW / Math.max(1, buckets.length);
  const barW = Math.max(2, Math.min(36, slot * 0.7));
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max).filter((t) => !byCount || Number.isInteger(t));
  const every = Math.max(1, Math.ceil(buckets.length / Math.floor(plotW / 56)));
  const peak = totals.indexOf(Math.max(...totals));
  const used = series.map((_, i) => buckets.some((b) => b.values[i] > 0));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]" aria-label="Legend">
          {series.map((s, i) => (
            <li key={s.key} className={`inline-flex items-center gap-1.5 ${used[i] ? "" : "opacity-50"}`}>
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: COLORS[i] }} aria-hidden="true" />{s.label}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
        <div className="inline-flex rounded-lg border border-line p-0.5 text-[13px] font-semibold" role="group" aria-label="Show">
          {[["Money", false], ["Number of payments", true]].map(([l, v]) => (
            <button key={l as string} type="button" onClick={() => setByCount(v as boolean)} aria-pressed={byCount === v}
              className={`rounded-md px-2.5 py-0.5 whitespace-nowrap ${byCount === v ? "bg-ink text-white" : "hover:bg-ground"}`}>{l as string}</button>
          ))}
        </div>
        <button type="button" onClick={() => setTable((t) => !t)} className="rounded-lg border border-line px-3 py-1 text-[13px] font-semibold whitespace-nowrap hover:bg-ground" aria-pressed={table}>
          {table ? "Show chart" : "Show as table"}
        </button>
        </div>
      </div>

      {table ? (
        <div className="max-h-[320px] overflow-auto rounded-lg border border-line">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="sticky top-0 bg-ground text-xs text-subtle">
              <tr><th className="px-3 py-2 font-medium capitalize">{stepWord}</th>{series.map((s) => <th key={s.key} className="px-2 text-right font-medium">{s.label}</th>)}<th className="px-3 text-right font-medium">Total</th></tr>
            </thead>
            <tbody>
              {buckets.map((b, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="px-3 py-1.5 whitespace-nowrap">{b.long}</td>
                  {b.values.map((v, j) => <td key={j} className="px-2 text-right tabular">{v ? (byCount ? v : money(v)) : "–"}</td>)}
                  <td className="px-3 text-right font-semibold tabular">{byCount ? totals[i] : money(totals[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrap} className="relative" onMouseLeave={() => setHover(null)}>
          <svg width={width} height={H} role="img" aria-label={`Revenue by ${stepWord}, stacked by what it was for. Highest: ${buckets[peak]?.long ?? ""}, ${fmt(totals[peak] ?? 0)}.`} className="block">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={left} x2={width - right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#c9d6d0" : "#eef2f0"} />
                <text x={left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5e706a">{axis(t)}</text>
              </g>
            ))}
            {buckets.map((b, i) => {
              const x = left + i * slot + (slot - barW) / 2;
              let acc = 0;
              const segs = b.values.map((v, j) => ({ v, j })).filter((s) => s.v > 0);
              return (
                <g key={i} opacity={hover === null || hover === i ? 1 : 0.45}>
                  {segs.map(({ v, j }, k) => {
                    const y0 = y(acc), y1 = y(acc + v);
                    acc += v;
                    const isTop = k === segs.length - 1;
                    const h = Math.max(1, y0 - y1 - (k > 0 ? 2 : 0)); // 2px surface gap between segments
                    const r = isTop ? Math.min(4, barW / 2, h) : 0;
                    const yy = y1;
                    return isTop && r > 0
                      ? <path key={j} fill={COLORS[j]} d={`M${x},${yy + h} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + barW - r} Q${x + barW},${yy} ${x + barW},${yy + r} V${yy + h} Z`} />
                      : <rect key={j} x={x} y={yy} width={barW} height={h} fill={COLORS[j]} />;
                  })}
                  {i % every === 0 && <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#5e706a">{b.label}</text>}
                  {i === peak && totals[i] > 0 && hover === null && <text x={x + barW / 2} y={y(totals[i]) - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#10221d">{axis(totals[i])}</text>}
                  {/* A hit area the full height of the slot, bigger than the bar. */}
                  <rect x={left + i * slot} y={top} width={slot} height={plotH} fill="transparent"
                    onMouseEnter={() => setHover(i)} onClick={() => setHover(hover === i ? null : i)} />
                </g>
              );
            })}
          </svg>
          {hover !== null && buckets[hover] && (
            <div className="pointer-events-none absolute top-1 z-10 w-56 rounded-lg border border-line bg-surface p-3 text-[13px] shadow-[var(--shadow-md)]"
              style={{ left: Math.min(Math.max(0, left + hover * slot + slot / 2 - 112), width - 224) }}>
              <p className="font-semibold">{buckets[hover].long}</p>
              <p className="mb-1.5 font-display text-lg font-semibold tabular">{fmt(totals[hover])}</p>
              {series.map((s, j) => buckets[hover].values[j] > 0 && (
                <p key={s.key} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px]" style={{ background: COLORS[j] }} />{s.label}</span>
                  <span className="tabular">{byCount ? buckets[hover].values[j] : money(buckets[hover].values[j])}</span>
                </p>
              ))}
              {totals[hover] === 0 && <p className="text-muted">No payments</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
