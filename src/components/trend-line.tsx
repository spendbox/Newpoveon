/**
 * Single-series trend line (one hue, 2px line, 8px markers, latest value labelled, recessive grid).
 * Each point has a native tooltip; the history list on the page doubles as the table view.
 */
export function TrendLine({ points, max = 100, min = 0, label, unit = "" }: { points: { date: string; value: number }[]; max?: number; min?: number; label: string; unit?: string }) {
  if (points.length < 2) return null;
  const W = 320, H = 120, px = 14, top = 18, bottom = 22;
  const x = (i: number) => px + (i * (W - px * 2)) / (points.length - 1);
  const y = (v: number) => top + (1 - (v - min) / (max - min || 1)) * (H - top - bottom);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${label}: ${points.map((p) => `${p.date} ${p.value}${unit}`).join(", ")}`}>
        {[min, Math.round((min + max) / 2), max].map((g) => (
          <g key={g}>
            <line x1={px} x2={W - px} y1={y(g)} y2={y(g)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={px} y={y(g) - 3} fontSize="9" fill="var(--color-subtle)">{g}</text>
          </g>
        ))}
        <path d={d} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.value)} r="12" fill="transparent"><title>{`${p.date}: ${p.value}${unit}`}</title></circle>
            <circle cx={x(i)} cy={y(p.value)} r="4" fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth="2" pointerEvents="none" />
          </g>
        ))}
        <text x={x(points.length - 1)} y={y(last.value) - 9} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--color-ink)">{last.value}{unit}</text>
        <text x={px} y={H - 6} fontSize="9" fill="var(--color-subtle)">{points[0].date}</text>
        <text x={W - px} y={H - 6} textAnchor="end" fontSize="9" fill="var(--color-subtle)">{last.date}</text>
      </svg>
    </figure>
  );
}
