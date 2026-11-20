import type { BodyArea } from "@/content/learn";
import { AREA_POINTS } from "@/content/body-points";
import { Mannequin } from "./mannequin";

type Chip = { area: BodyArea; side: "left" | "right"; label: string; value: string; note?: string; d: number };

const CHIPS: Chip[] = [
  { area: "mind", side: "left", label: "Wellbeing", value: "72", note: "/ 100", d: 0.9 },
  { area: "heart", side: "right", label: "Heart age", value: "38", note: "4 yrs younger", d: 1.2 },
  { area: "bp", side: "left", label: "Blood pressure", value: "118/76", note: "✓", d: 1.5 },
  { area: "sugar", side: "right", label: "Diabetes risk", value: "Low", d: 1.8 },
];

/** Landing hero: the mannequin with live-looking result chips pinned to the body. Example numbers only. */
export function MannequinHero({ compact = false }: { compact?: boolean }) {
  // Upper crop for phones: viewBox 40 0 220 350.
  const pos = (a: BodyArea) => {
    const p = AREA_POINTS[a];
    return compact ? { left: ((p.x - 40) / 220) * 100, top: (p.y / 350) * 100 } : { left: (p.x / 300) * 100, top: (p.y / 560) * 100 };
  };
  const chips = compact ? CHIPS.filter((c) => c.area === "mind" || c.area === "heart") : CHIPS;
  return (
    <div className={`relative mx-auto ${compact ? "w-[190px]" : "w-full max-w-[300px]"}`} aria-hidden="true">
      <div style={compact ? { maskImage: "linear-gradient(to bottom, black 75%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black 75%, transparent)" } : undefined}><Mannequin animate crop={compact ? "upper" : "full"} className="h-auto w-full" /></div>
      {chips.map((c) => {
        const p = pos(c.area);
        return (
          <div key={c.area}>
            <span className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-coral pulse-dot shadow-[var(--shadow-sm)]" style={{ left: `${p.left}%`, top: `${p.top}%` }} />
            <span
              className="hc-chip absolute h-px bg-ink/25"
              style={{ top: `${p.top}%`, ...(c.side === "left" ? { right: `${100 - p.left + 2}%`, width: compact ? "26%" : "30%" } : { left: `${p.left + 2}%`, width: compact ? "26%" : "30%" }), ["--d" as string]: `${c.d}s` }}
            />
            <div
              className={`hc-chip absolute w-max -translate-y-1/2 whitespace-nowrap rounded-[14px] border border-line bg-surface/95 shadow-[var(--shadow-md)] backdrop-blur ${compact ? "px-2.5 py-1.5" : "px-3 py-2"}`}
              style={{ top: `${p.top}%`, ...(c.side === "left" ? { right: `${100 - p.left + (compact ? 26 : 30)}%` } : { left: `${p.left + (compact ? 26 : 30)}%` }), ["--d" as string]: `${c.d}s` }}
            >
              <div className={`font-medium text-muted ${compact ? "text-[10px]" : "text-[11px]"}`}>{c.label}</div>
              <div className={`font-display font-bold tabular ${compact ? "text-[15px]" : "text-lg"}`}>
                {c.value}{c.note && <span className="ml-1 font-body text-[11px] font-semibold text-primary">{c.note}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
