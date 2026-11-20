"use client";
import { useId } from "react";
import type { BodyArea } from "@/content/learn";

type P = [number, number];
type Seg = [P, P, P]; // cubic: control 1, control 2, end

/* The right half of the body outline, from the top of the head to the crotch. The left half is its mirror. */
const START: P = [150, 14];
const RIGHT: Seg[] = [
  [[167, 14], [179, 29], [179, 48]], // crown → temple
  [[179, 66], [172, 80], [163, 87]], // cheek → jaw
  [[161, 93], [162, 101], [165, 106]], // neck
  [[171, 112], [183, 115], [194, 119]], // trapezius
  [[207, 124], [214, 134], [215, 150]], // shoulder
  [[217, 172], [219, 198], [221, 222]], // upper arm, outer
  [[223, 250], [227, 280], [230, 302]], // forearm, outer
  [[232, 314], [238, 326], [238, 340]], // wrist → palm
  [[238, 352], [231, 358], [225, 355]], // fingertips
  [[219, 352], [217, 340], [216, 328]], // palm, inner
  [[214, 312], [210, 290], [206, 266]], // forearm, inner
  [[203, 246], [200, 222], [199, 200]], // elbow → upper arm, inner
  [[198, 184], [196, 170], [192, 160]], // armpit
  [[193, 186], [186, 210], [184, 232]], // ribs → waist
  [[183, 252], [193, 276], [196, 300]], // hip
  [[199, 334], [193, 380], [188, 410]], // thigh, outer
  [[185, 428], [184, 444], [185, 458]], // knee
  [[187, 484], [184, 508], [178, 528]], // calf
  [[177, 536], [186, 544], [189, 550]], // ankle → foot
  [[191, 557], [176, 559], [164, 556]], // toes
  [[160, 552], [161, 542], [161, 532]], // inner ankle
  [[159, 506], [157, 476], [159, 452]], // inner calf
  [[160, 432], [160, 404], [158, 380]], // inner knee → thigh
  [[156, 356], [154, 340], [150, 332]], // inner thigh → crotch
];

const f = (p: P) => `${p[0]} ${p[1]}`;
const m = (p: P): P => [300 - p[0], p[1]];
const startOf = (i: number): P => (i === 0 ? START : RIGHT[i - 1][2]);
const fwd = (from: number, to: number) => RIGHT.slice(from, to + 1).map(([c1, c2, e]) => ` C${f(c1)} ${f(c2)} ${f(e)}`).join("");
/** Walk segments from..to backwards on the mirrored (left) side. */
const back = (from: number, to: number) => {
  let d = "";
  for (let i = to; i >= from; i--) d += ` C${f(m(RIGHT[i][1]))} ${f(m(RIGHT[i][0]))} ${f(m(startOf(i)))}`;
  return d;
};
const LAST = RIGHT.length - 1;
const ARM_FROM = 5, ARM_TO = 12; // the person's left arm (viewer's right) moves on its own

/** Head, drawn separately so it can turn gently. */
const HEAD = `M${f(START)}${fwd(0, 1)} C158 95 142 95 137 87${back(0, 1)}Z`;
/** Neck to feet, without the moving arm (a soft edge runs from shoulder to armpit, hidden under the arm). */
const BODY = `M${f(startOf(2))}${fwd(2, 4)} C212 154 200 158 ${f(RIGHT[ARM_TO][2])}${fwd(ARM_TO + 1, LAST)}${back(2, LAST)}Z`;
/** The moving arm: its top tucks inside the shoulder. */
const ARM = `M${f(startOf(ARM_FROM))}${fwd(ARM_FROM, ARM_TO)} C196 150 204 140 209 136 C213 139 215 144 ${f(startOf(ARM_FROM))}Z`;
const ARM_EDGE = `M${f(startOf(ARM_FROM))}${fwd(ARM_FROM, ARM_TO)}`;

/**
 * A soft, gender-neutral body figure with gently glowing organs. `highlight` brings one area forward.
 * `crop="upper"` shows head to hips (for small hero spaces). `animate` adds gentle life: breathing, a slow
 * sway, the head turning a little and one arm easing out and back (still for people who reduce motion).
 */
export function Mannequin({ highlight, crop = "full", className = "", animate = false }: { highlight?: BodyArea | null; crop?: "full" | "upper"; className?: string; animate?: boolean }) {
  const op = (a: BodyArea, on = 1) => (highlight && highlight !== a ? on * 0.3 : on);
  // Unique ids per figure: a page can show several, and a hidden one must not own the gradients.
  const u = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (n: string) => `${n}-${u}`;
  return (
    <svg viewBox={crop === "upper" ? "40 0 220 350" : "0 0 300 560"} className={`${animate ? "mq-anim" : ""} ${className}`} role="img" aria-label="A body figure showing the parts of your health we check">
      <defs>
        <linearGradient id={id("mq-skin")} gradientUnits="userSpaceOnUse" x1="0" x2="300" y1="0" y2="0">
          <stop offset="0" stopColor="#CFE6DD" />
          <stop offset=".22" stopColor="#E7F3EE" />
          <stop offset=".5" stopColor="#F8FCFA" />
          <stop offset=".78" stopColor="#E7F3EE" />
          <stop offset="1" stopColor="#CFE6DD" />
        </linearGradient>
        <linearGradient id={id("mq-shade")} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="560">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".55" />
          <stop offset=".4" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity=".08" />
        </linearGradient>
        <radialGradient id={id("mq-aura")} cx=".5" cy=".42" r=".55">
          <stop offset="0" stopColor="var(--color-primary)" stopOpacity=".14" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("mq-heart")} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="var(--color-coral)" stopOpacity=".5" />
          <stop offset="1" stopColor="var(--color-coral)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("mq-mind")} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="var(--color-lavender)" stopOpacity=".45" />
          <stop offset="1" stopColor="var(--color-lavender)" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id("mq-clip")}><path d={BODY} /></clipPath>
        <clipPath id={id("mq-head-clip")}><path d={HEAD} /></clipPath>
      </defs>

      {crop === "full" && <ellipse cx="150" cy="250" rx="150" ry="250" fill={`url(#${id("mq-aura")})`} />}
      <ellipse cx="150" cy="556" rx="62" ry="6" fill="var(--color-ink)" opacity=".07" />

      <g className="mq-sway"><g className="mq-breathe">
      {/* Body */}
      <path d={BODY} fill={`url(#${id("mq-skin")})`} />
      <path d={BODY} fill={`url(#${id("mq-shade")})`} />

      {/* Organs, clipped to the body so nothing spills over the outline */}
      <g clipPath={`url(#${id("mq-clip")})`}>
        <g opacity={op("sleep")}><path d="M150 92v40" stroke="var(--color-lavender)" strokeWidth="6" strokeLinecap="round" opacity=".22" /></g>
        <g opacity={op("lungs")}>
          <path d="M145 140c-9-4-26 4-29 26-3 20 3 34 13 34 9 0 16-8 16-24z" fill="var(--color-lavender)" opacity=".2" />
          <path d="M155 140c9-4 26 4 29 26 3 20-3 34-13 34-9 0-16-8-16-24z" fill="var(--color-lavender)" opacity=".2" />
          <path d="M150 128v14M150 142l-8 10M150 142l8 10" stroke="var(--color-lavender)" strokeWidth="1.6" strokeLinecap="round" opacity=".45" />
        </g>
        <g opacity={op("liver")}><path d="M118 214c8-8 34-10 44-4 1 10-8 20-26 22-12 1-20-8-18-18z" fill="var(--color-coral)" opacity=".18" /></g>
        <g opacity={op("sugar")}><ellipse cx="163" cy="236" rx="17" ry="6" transform="rotate(-14 163 236)" fill="var(--color-sun)" opacity=".5" /></g>
        <g opacity={op("waist")}><path d="M116 266c22 7 46 7 68 0" stroke="var(--color-sun)" strokeWidth="3.5" strokeDasharray="1.5 5" strokeLinecap="round" fill="none" /></g>
        <g opacity={op("legs")}><ellipse cx="172" cy="436" rx="11" ry="15" fill="var(--color-primary)" opacity={highlight === "legs" ? 0.16 : 0} /></g>
        <g opacity={op("bp")}><path d="M80 186c8-2 17-2 25 1l-1 18c-8-2-16-2-24 0z" fill="var(--color-lavender)" opacity=".55" /></g>
      </g>
      <path d={BODY} fill="none" stroke="var(--color-primary)" strokeOpacity=".22" strokeWidth="1.2" />
      <path d="M126 128c8 4 16 5 24 5s16-1 24-5M150 250v4" stroke="var(--color-primary)" strokeOpacity=".14" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Heart sits on top with a soft glow */}
      <g opacity={op("heart")}>
        <circle cx="163" cy="176" r="20" fill={`url(#${id("mq-heart")})`} />
        <path className="mq-beat" d="M163 186s-13-7.5-13-16.5a6.5 6.5 0 0 1 13-2.5 6.5 6.5 0 0 1 13 2.5c0 9-13 16.5-13 16.5z" fill="var(--color-coral)" />
      </g>

      {/* The arm that eases out and back */}
      <g className="mq-arm">
        <path d={ARM} fill={`url(#${id("mq-skin")})`} />
        <path d={ARM} fill={`url(#${id("mq-shade")})`} />
        <path d={ARM_EDGE} fill="none" stroke="var(--color-primary)" strokeOpacity=".22" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* The head that turns a little */}
      <g className="mq-head">
        <path d={HEAD} fill={`url(#${id("mq-skin")})`} />
        <path d={HEAD} fill={`url(#${id("mq-shade")})`} />
        <g clipPath={`url(#${id("mq-head-clip")})`} opacity={op("mind")}>
          <circle className="mq-pulse-soft" cx="150" cy="44" r="26" fill={`url(#${id("mq-mind")})`} />
          <path d="M138 46c-3-9 4-17 12-17s15 8 12 17c-1 5-6 8-12 8s-11-3-12-8z" fill="var(--color-lavender)" opacity=".28" />
          <path d="M150 30v23M143 38c3 1 4 4 3 7M157 38c-3 1-4 4-3 7" stroke="var(--color-lavender)" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".55" />
        </g>
        <path d={HEAD} fill="none" stroke="var(--color-primary)" strokeOpacity=".22" strokeWidth="1.2" />
      </g>
      </g></g>
    </svg>
  );
}
