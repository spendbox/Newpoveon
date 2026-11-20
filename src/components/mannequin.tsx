import type { BodyArea } from "@/content/learn";

/** Where each body area sits on the figure (viewBox 0 0 300 560). Front view: the person's left is on the right. */
export const AREA_POINTS: Record<BodyArea, { x: number; y: number; label: string }> = {
  mind: { x: 150, y: 50, label: "Mind" },
  sleep: { x: 150, y: 116, label: "Sleep and breathing" },
  lungs: { x: 126, y: 172, label: "Lungs" },
  heart: { x: 168, y: 182, label: "Heart" },
  bp: { x: 87, y: 210, label: "Blood pressure" },
  liver: { x: 130, y: 236, label: "Liver" },
  sugar: { x: 168, y: 256, label: "Blood sugar" },
  waist: { x: 150, y: 298, label: "Weight and waist" },
  legs: { x: 178, y: 440, label: "Movement" },
};

const SKIN = "#F3F7F5";
const SHADE = "#DCE8E2";
const EDGE = "var(--color-line-strong)";

/**
 * A calm, gender-neutral mannequin with soft organ hints. `highlight` brings one area forward.
 * `crop="upper"` shows head to hips (for small hero spaces).
 */
export function Mannequin({ highlight, crop = "full", className = "" }: { highlight?: BodyArea | null; crop?: "full" | "upper"; className?: string }) {
  const dim = (a: BodyArea) => (highlight && highlight !== a ? 0.28 : 1);
  const limb = (d: string, w: number) => (
    <>
      <path d={d} stroke={EDGE} strokeWidth={w + 3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={d} stroke={SKIN} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
  return (
    <svg viewBox={crop === "upper" ? "40 0 220 350" : "0 0 300 560"} className={className} role="img" aria-label="A body figure showing the parts of your health we check">
      <defs>
        <linearGradient id="mq-body" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={SHADE} />
          <stop offset=".45" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={SHADE} />
        </linearGradient>
        <linearGradient id="mq-limb" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={SHADE} />
          <stop offset=".5" stopColor={SKIN} />
          <stop offset="1" stopColor={SHADE} />
        </linearGradient>
        <radialGradient id="mq-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="var(--color-primary)" stopOpacity=".18" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {crop === "full" && <ellipse cx="150" cy="300" rx="150" ry="260" fill="url(#mq-glow)" />}
      <ellipse cx="150" cy="552" rx="70" ry="7" fill="var(--color-ink)" opacity=".08" />

      {/* Legs */}
      {limb("M130 330 L124 440 L121 528", 34)}
      {limb("M170 330 L176 440 L179 528", 34)}
      <ellipse cx="116" cy="540" rx="20" ry="10" fill={SHADE} stroke={EDGE} strokeWidth="1.5" />
      <ellipse cx="184" cy="540" rx="20" ry="10" fill={SHADE} stroke={EDGE} strokeWidth="1.5" />

      {/* Arms */}
      {limb("M104 146 L84 236 L78 318", 26)}
      {limb("M196 146 L216 236 L222 318", 26)}
      <ellipse cx="77" cy="334" rx="12" ry="16" fill={SKIN} stroke={EDGE} strokeWidth="1.5" />
      <ellipse cx="223" cy="334" rx="12" ry="16" fill={SKIN} stroke={EDGE} strokeWidth="1.5" />

      {/* Torso and hips */}
      <path d="M102 130C122 118 178 118 198 130C214 140 214 166 210 194C206 226 196 252 194 282C193 300 198 316 198 332C198 350 176 356 150 356C124 356 102 350 102 332C102 316 107 300 106 282C104 252 94 226 90 194C86 166 86 140 102 130Z" fill="url(#mq-body)" stroke={EDGE} strokeWidth="1.5" />

      {/* Neck and head */}
      <rect x="136" y="96" width="28" height="34" rx="12" fill={SKIN} stroke={EDGE} strokeWidth="1.5" />
      <ellipse cx="150" cy="58" rx="36" ry="44" fill="url(#mq-body)" stroke={EDGE} strokeWidth="1.5" />

      {/* Joints: the mannequin look */}
      {[[104, 146], [196, 146], [84, 236], [216, 236], [124, 440], [176, 440]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="none" stroke={EDGE} strokeWidth="1.5" opacity=".7" />
      ))}

      {/* Organ hints */}
      <g opacity={dim("mind")}><circle className="mq-pulse-soft" cx="150" cy="50" r="20" fill="var(--color-lavender)" opacity=".18" /><path d="M138 50c0-8 6-12 12-12s12 4 12 12M144 44c2 2 2 6 0 8M156 44c-2 2-2 6 0 8" stroke="var(--color-lavender)" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" /></g>
      <g opacity={dim("sleep")}><path d="M144 104v24M156 104v24" stroke="var(--color-lavender)" strokeWidth="3" strokeLinecap="round" opacity=".4" /></g>
      <g opacity={dim("lungs")}>
        <path d="M144 150c-10-6-30 2-32 30-2 22 6 34 16 32 10-2 16-12 16-28z" fill="var(--color-lavender)" opacity=".22" />
        <path d="M156 150c10-6 30 2 32 30 2 22-6 34-16 32-10-2-16-12-16-28z" fill="var(--color-lavender)" opacity=".22" />
      </g>
      <g opacity={dim("liver")}><path d="M108 226c10-8 36-10 50-4 2 10-8 22-28 24-14 2-24-8-22-20z" fill="var(--color-coral)" opacity=".2" /></g>
      <g opacity={dim("sugar")}><ellipse cx="168" cy="254" rx="20" ry="8" transform="rotate(-12 168 254)" fill="var(--color-sun)" opacity=".45" /></g>
      <g opacity={dim("waist")}><path d="M104 298c30 10 62 10 92 0" stroke="var(--color-sun)" strokeWidth="5" strokeDasharray="2 6" strokeLinecap="round" fill="none" /></g>
      <g opacity={dim("bp")}><path d="M74 196l26 6-4 24-26-6z" fill="var(--color-lavender)" opacity=".7" /><path d="M88 222c-4 12 0 22 10 26" stroke="var(--color-ink)" strokeWidth="1.5" fill="none" opacity=".5" /></g>
      <g opacity={dim("heart")}>
        <path className="mq-beat" d="M168 192s-16-9-16-20a8 8 0 0 1 16-3 8 8 0 0 1 16 3c0 11-16 20-16 20z" fill="var(--color-coral)" />
      </g>
      <g opacity={dim("legs")}><path d="M176 400v80" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" opacity=".25" /></g>
    </svg>
  );
}
