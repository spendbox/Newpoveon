/**
 * The Poveon mark: three pieces that make a cross and an arrow moving forward.
 * Redrawn as vector paths (viewBox 0 0 400 400). The editable file is public/brand/poveon-mark.svg.
 * With `animate`, the pieces glide together on a visitor's first visit to the home page
 * (see the intro script in app/layout.tsx and .pv-anim in globals.css).
 */
export const POVEON_PATHS = {
  top: "M160 136 L160 12 Q160 5 164.9 9.9 L233 78 Q250 95 250 119 L250 136 Q250 140 246 140 L164 140 Q160 140 160 136Z",
  left: "M12 160 L136 160 Q140 160 140 164 L140 246 Q140 250 136 250 L119 250 Q95 250 78 233 L9.9 164.9 Q5 160 12 160Z",
  big: "M168 160 L279 160 Q305 160 323.4 178.4 L390.1 245.1 Q395 250 388 250 L266 250 Q250 250 250 266 L250 388 Q250 395 245.1 390.1 L178.4 323.4 Q160 305 160 279 L160 168 Q160 160 168 160Z",
} as const;

/** Brand colours, matched to the site's greens. */
export const POVEON_COLORS = { top: "#8FD3BF", left: "#3FA88A", big: "var(--color-primary)" } as const;

export function PoveonMark({ size = 32, animate = false, className = "" }: { size?: number; animate?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" className={`${animate ? "pv-anim" : ""} ${className}`} aria-hidden="true" focusable="false">
      <path className="pv-top" fill={POVEON_COLORS.top} d={POVEON_PATHS.top} />
      <path className="pv-left" fill={POVEON_COLORS.left} d={POVEON_PATHS.left} />
      <path className="pv-big" fill={POVEON_COLORS.big} d={POVEON_PATHS.big} />
    </svg>
  );
}
