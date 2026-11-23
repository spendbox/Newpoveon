/**
 * A turning DNA double helix, drawn in SVG and moved with CSS (sharper and lighter than a GIF).
 * Each rung has two dots that swing side to side in opposite directions, with a delay down the strand,
 * so it looks like a helix rotating. Still for people who ask for less motion.
 */
const RUNGS = 10;
const PERIOD = 3.2; // seconds for one full turn

export function DnaHelix({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="dna-a" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#FFD166" /><stop offset="1" stopColor="#F4A261" /></linearGradient>
        <linearGradient id="dna-b" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#7FE0B8" /><stop offset="1" stopColor="#B9A7FF" /></linearGradient>
      </defs>
      {Array.from({ length: RUNGS }, (_, i) => {
        const y = 12 + i * (176 / (RUNGS - 1));
        const delay = `${-(i * PERIOD) / 8}s`;
        return (
          <g key={i} transform={`translate(45 ${y})`}>
            <line x1="-30" x2="30" y1="0" y2="0" className="dna-rung" stroke="white" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" style={{ animationDelay: delay }} />
            <circle r="7" fill="url(#dna-a)" className="dna-dot" style={{ animationDelay: delay }} />
            <circle r="7" fill="url(#dna-b)" className="dna-dot" style={{ animationDelay: `${-(i * PERIOD) / 8 - PERIOD / 2}s` }} />
          </g>
        );
      })}
    </svg>
  );
}
