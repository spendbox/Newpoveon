import { Icon } from "./icons";

/**
 * The landing page's animated illustration: three health rings drawing in (heart, activity,
 * sleep), a beating heart with a pulse running through it, and live-looking result chips.
 * Pure SVG + CSS (no images, no JavaScript), crisp at any size. With reduced motion it shows
 * the finished picture, still.
 */
const RINGS = [
  { r: 150, p: 82, color: "var(--color-coral)", track: "var(--color-coral-soft)", d: "0.1s", label: "Heart" },
  { r: 122, p: 68, color: "var(--color-primary)", track: "var(--color-primary-soft)", d: "0.3s", label: "Activity" },
  { r: 94, p: 74, color: "var(--color-lavender)", track: "var(--color-lavender-soft)", d: "0.5s", label: "Sleep" },
];

export function HeroAnimation({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative mx-auto aspect-square w-full ${compact ? "max-w-[240px]" : "max-w-[440px]"}`} role="img" aria-label="Your health at a glance: heart age 38, blood pressure 118 over 76, 7 hours of sleep">
      <svg viewBox="0 0 420 420" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="hc-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-surface)" stopOpacity="1" />
            <stop offset="70%" stopColor="var(--color-primary-soft)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-primary-soft)" stopOpacity="0" />
          </radialGradient>
          <clipPath id="hc-inner"><circle cx="210" cy="210" r="76" /></clipPath>
        </defs>

        <g className="hc-breathe"><circle cx="210" cy="210" r="200" fill="url(#hc-glow)" /></g>

        {/* Orbiting dots */}
        <g className="hc-orbit">
          <circle cx="210" cy="22" r="6" fill="var(--color-sun)" />
          <circle cx="398" cy="210" r="4" fill="var(--color-coral)" opacity="0.7" />
        </g>
        <g className="hc-orbit-rev">
          <circle cx="60" cy="330" r="5" fill="var(--color-lavender)" opacity="0.8" />
        </g>

        {/* Rings: a soft track, then the progress drawing in from the top */}
        <g transform="rotate(-90 210 210)" fill="none" strokeLinecap="round">
          {RINGS.map((ring) => (
            <g key={ring.r}>
              <circle cx="210" cy="210" r={ring.r} stroke={ring.track} strokeWidth="18" />
              <circle
                cx="210" cy="210" r={ring.r} stroke={ring.color} strokeWidth="18" pathLength={100}
                className="hc-ring" style={{ ["--off" as string]: 100 - ring.p, ["--d" as string]: ring.d }}
              />
            </g>
          ))}
        </g>

        {/* Centre: white disc, a pulse running through, and the heart */}
        <circle cx="210" cy="210" r="76" fill="var(--color-surface)" />
        <g clipPath="url(#hc-inner)">
          <path d="M120 214h40l8-14 10 30 10-42 10 46 8-20h22l6-8 8 16 6-8h92" fill="none" stroke="var(--color-coral)" strokeOpacity="0.18" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M120 214h40l8-14 10 30 10-42 10 46 8-20h22l6-8 8 16 6-8h92" fill="none" stroke="var(--color-coral)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" pathLength={520} className="hc-ecg" />
        </g>
        <path
          className="hc-heart"
          d="M210 248c-26-17-37-31-34-45 3-13 19-19 34-5 15-14 31-8 34 5 3 14-8 28-34 45z"
          fill="var(--color-coral)"
        />
      </svg>

      {/* Result chips, as real text so they stay sharp */}
      <div className={`hc-chip absolute rounded-[16px] border border-line bg-surface/95 px-3 py-2 shadow-[var(--shadow-md)] backdrop-blur ${compact ? "top-[2%] -left-[4%] scale-90" : "top-[6%] -left-[2%] md:-left-[8%]"}`} style={{ ["--d" as string]: "1.2s" }}>
        <p className="text-[11px] font-medium text-muted">Heart age</p>
        <p className="font-display text-lg leading-tight font-semibold tabular">38 <span className="text-xs font-medium text-good-text">· 4 yrs younger</span></p>
      </div>
      {!compact && (
        <>
          <div className="hc-chip absolute top-[44%] -right-[2%] rounded-[16px] border border-line bg-surface/95 px-3 py-2 shadow-[var(--shadow-md)] backdrop-blur md:-right-[8%]" style={{ ["--d" as string]: "1.5s" }}>
            <p className="text-[11px] font-medium text-muted">Blood pressure</p>
            <p className="flex items-center gap-1.5 font-display text-lg leading-tight font-semibold tabular">118/76 <span className="flex h-4 w-4 items-center justify-center rounded-full bg-good-bg text-good-text"><Icon name="check" size={10} strokeWidth={3} /></span></p>
          </div>
          <div className="hc-chip absolute bottom-[6%] left-[4%] rounded-[16px] border border-line bg-surface/95 px-3 py-2 shadow-[var(--shadow-md)] backdrop-blur md:left-0" style={{ ["--d" as string]: "1.8s" }}>
            <p className="text-[11px] font-medium text-muted">Sleep</p>
            <p className="font-display text-lg leading-tight font-semibold tabular">7h 20m</p>
          </div>
        </>
      )}
    </div>
  );
}
