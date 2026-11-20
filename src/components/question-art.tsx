import type { CSSProperties, ReactNode } from "react";
import { IllustrationCard, type IllustrationName } from "./illustrations";

/**
 * A small animated scene for each health-check question (design v2: flat shapes, brand colours, gentle motion).
 * Every scene's resting state is a finished picture, so "reduce motion" users see a still image.
 * Questions without their own scene fall back to the topic card.
 */
const P = "var(--color-primary)", C = "var(--color-coral)", S = "var(--color-sun)", L = "var(--color-lavender)",
  N = "var(--color-night)", I = "var(--color-ink)", W = "var(--color-surface)", PS = "var(--color-primary-soft)", LN = "var(--color-line-strong)";
const d = (s: number, extra?: CSSProperties): CSSProperties => ({ animationDelay: `${s}s`, ...extra });
const at = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });
const Heart = ({ x, y, s = 1, fill = C, className = "", style }: { x: number; y: number; s?: number; fill?: string; className?: string; style?: CSSProperties }) => (
  <g className={className} style={style}><path fill={fill} stroke={W} strokeWidth={2 / s} transform={`translate(${x} ${y}) scale(${s})`} d="M0 6C-3-1-12-1-12 6c0 6 12 12 12 12S12 12 12 6C12-1 3-1 0 6z" /></g>
);
const Glass = ({ x, fill = 1, delay = 0, anim = true }: { x: number; fill?: number; delay?: number; anim?: boolean }) => (
  <g>
    <path d={`M${x} 40h20l-2.5 40h-15z`} fill={W} stroke={I} strokeWidth="2.5" strokeLinejoin="round" />
    <rect className={anim ? "qs-fill" : ""} style={d(delay)} x={x + 2.5} y={40 + 38 * (1 - fill)} width="15" height={38 * fill} rx="2" fill={S} opacity=".9" />
  </g>
);
const Tick = ({ x, y, delay = 0, color = P }: { x: number; y: number; delay?: number; color?: string }) => (
  <g className="qs-pop" style={d(delay)}>
    <circle cx={x} cy={y} r="8" fill={color} />
    <path d={`M${x - 3.5} ${y}l2.5 2.5 5-5`} stroke={W} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const SCENES: Record<string, { bg: string; art: ReactNode }> = {
  age: { bg: "bg-primary-soft", art: (
    <>
      <rect x="78" y="58" width="84" height="34" rx="9" fill={C} />
      <path d="M78 66c7 6 14 6 21 0s14-6 21 0 14 6 21 0 14-6 21 0v-4a9 9 0 0 0-9-9H87a9 9 0 0 0-9 9z" fill={W} />
      {[100, 120, 140].map((x, i) => (
        <g key={x}>
          <rect x={x - 3} y="34" width="6" height="20" rx="2" fill={[L, P, S][i]} />
          <ellipse className="qs-flicker" style={{ ...d(i * 0.25), ...at(x, 30) }} cx={x} cy="27" rx="4" ry="6.5" fill={S} />
        </g>
      ))}
      {[[60, 30, S], [182, 24, L], [190, 70, P], [52, 72, C]].map(([x, y, f], i) => <circle key={i} className="qs-twinkle" style={d(i * 0.4)} cx={x as number} cy={y as number} r="4" fill={f as string} />)}
    </>
  ) },
  sex: { bg: "bg-lavender-soft", art: (
    <>
      <g className="qs-float"><circle cx="100" cy="46" r="24" fill="none" stroke={L} strokeWidth="6" /><path d="M100 70v20M90 81h20" stroke={L} strokeWidth="6" strokeLinecap="round" /></g>
      <g className="qs-float" style={d(0.8)}><circle cx="142" cy="58" r="24" fill="none" stroke={P} strokeWidth="6" /><path d="M159 41l16-16M163 25h12v12" stroke={P} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></g>
    </>
  ) },
  height: { bg: "bg-sun-soft", art: (
    <>
      <rect x="148" y="8" width="22" height="88" rx="5" fill={S} />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M148 ${16 + i * 9.5}h${i % 2 ? 6 : 11}`} stroke={I} strokeWidth="2" strokeLinecap="round" />)}
      <circle cx="112" cy="30" r="10" fill={P} />
      <rect x="99" y="43" width="26" height="53" rx="12" fill={P} />
      <path className="qs-draw" pathLength={100} d="M112 16h34" stroke={C} strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round" />
      <path className="qs-bob" d="M140 11l6 5-6 5" stroke={C} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ) },
  weight: { bg: "bg-sun-soft", art: (
    <>
      <rect x="72" y="22" width="96" height="72" rx="18" fill={W} stroke={LN} strokeWidth="2" />
      <path d="M96 52a24 24 0 0 1 48 0z" fill={PS} />
      {[-60, -30, 0, 30, 60].map((a) => <path key={a} d="M120 30v5" transform={`rotate(${a} 120 52)`} stroke={P} strokeWidth="2.5" strokeLinecap="round" />)}
      <path className="qs-needle" style={at(120, 52)} d="M120 52V33" stroke={C} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="120" cy="52" r="4.5" fill={I} />
      <rect x="92" y="66" width="56" height="16" rx="8" fill={PS} />
      <text x="120" y="78.5" textAnchor="middle" fontSize="11" fontWeight="700" fill={P}>kg</text>
    </>
  ) },
  waist: { bg: "bg-coral-soft", art: (
    <>
      <rect x="86" y="6" width="68" height="94" rx="32" fill={W} />
      <ellipse className="qs-draw" pathLength={100} cx="120" cy="58" rx="54" ry="14" fill="none" stroke={S} strokeWidth="10" />
      <ellipse cx="120" cy="58" rx="54" ry="14" fill="none" stroke={I} strokeWidth="1.5" strokeDasharray="1.5 7" opacity=".5" />
      <rect className="qs-bob" x="166" y="54" width="18" height="12" rx="3" fill={C} />
    </>
  ) },
  cvd_history: { bg: "bg-coral-soft", art: (
    <>
      <path className="qs-ecg" pathLength={100} d="M30 56h52l8-16 10 32 8-24 6 8h96" fill="none" stroke={C} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
      <Heart x={120} y={34} s={2.4} className="qs-beat" style={at(120, 52)} />
      <g className="qs-float" style={d(0.5)}><rect x="176" y="14" width="22" height="22" rx="6" fill={W} /><path d="M187 19v12M181 25h12" stroke={C} strokeWidth="3" strokeLinecap="round" /></g>
    </>
  ) },
  smoking: { bg: "bg-surface-2", art: (
    <>
      <rect x="72" y="66" width="96" height="13" rx="4" fill={W} stroke={LN} strokeWidth="1.5" />
      <rect x="146" y="66" width="22" height="13" rx="3" fill={S} />
      <rect className="qs-flicker" style={at(70, 72)} x="64" y="66" width="10" height="13" rx="3" fill={C} />
      {[0, 1, 2].map((i) => <path key={i} className="qs-rise" style={d(i * 0.9)} d="M70 60c-8-8 8-12 0-20s8-12 0-20" fill="none" stroke={LN} strokeWidth="4" strokeLinecap="round" />)}
    </>
  ) },
  bp_known: { bg: "bg-primary-soft", art: (
    <>
      <rect x="58" y="38" width="76" height="32" rx="12" fill={L} />
      <rect x="64" y="44" width="64" height="20" rx="8" fill="none" stroke={W} strokeWidth="2" strokeDasharray="4 4" opacity=".7" />
      <path d="M134 54c22 0 18 26 40 26" fill="none" stroke={I} strokeWidth="3" strokeLinecap="round" />
      <ellipse className="qs-squeeze" style={at(184, 80)} cx="184" cy="80" rx="13" ry="10" fill={C} />
      <circle cx="170" cy="30" r="16" fill={W} stroke={LN} strokeWidth="2" />
      <path className="qs-needle" style={at(170, 30)} d="M170 30v-10" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ) },
  bp: { bg: "bg-primary-soft", art: (
    <>
      <rect x="70" y="12" width="100" height="82" rx="16" fill={N} />
      <rect x="80" y="22" width="80" height="54" rx="8" fill="#22335F" />
      <text x="112" y="45" textAnchor="middle" fontSize="20" fontWeight="700" fill={W}>120</text>
      <text x="112" y="68" textAnchor="middle" fontSize="16" fontWeight="600" fill={W} opacity=".75">80</text>
      <Heart x={146} y={38} s={0.7} className="qs-beat" style={at(146, 44)} />
      <circle cx="104" cy="85" r="3" fill={P} /><circle cx="120" cy="85" r="3" fill={S} /><circle cx="136" cy="85" r="3" fill={C} />
    </>
  ) },
  told_high_bp: { bg: "bg-coral-soft", art: (
    <>
      <path d="M72 78a48 48 0 0 1 32-45" fill="none" stroke={P} strokeWidth="12" strokeLinecap="round" />
      <path d="M112 30.7a48 48 0 0 1 24 4" fill="none" stroke={S} strokeWidth="12" strokeLinecap="round" />
      <path d="M144 39a48 48 0 0 1 24 39" fill="none" stroke={C} strokeWidth="12" strokeLinecap="round" />
      <path className="qs-needle-wide" style={at(120, 78)} d="M120 78V42" stroke={I} strokeWidth="4" strokeLinecap="round" />
      <circle cx="120" cy="78" r="7" fill={I} />
    </>
  ) },
  bp_meds: { bg: "bg-sun-soft", art: (
    <>
      <rect x="84" y="34" width="52" height="60" rx="10" fill={C} />
      <rect x="80" y="22" width="60" height="16" rx="5" fill={W} stroke={LN} strokeWidth="1.5" />
      <rect x="92" y="52" width="36" height="24" rx="4" fill={W} />
      <path d="M102 64h16M110 56v16" stroke={C} strokeWidth="3" strokeLinecap="round" />
      {[[156, 40, P, 0], [172, 64, L, 0.3], [150, 80, S, 0.6]].map(([x, y, f, t], i) => (
        <g key={i} className="qs-pop" style={d(t as number)}><rect x={(x as number) - 12} y={(y as number) - 6} width="24" height="12" rx="6" fill={f as string} transform={`rotate(${-30 + i * 25} ${x} ${y})`} /></g>
      ))}
    </>
  ) },
  diabetes_dx: { bg: "bg-lavender-soft", art: (
    <>
      <rect x="66" y="24" width="64" height="70" rx="14" fill={W} stroke={LN} strokeWidth="2" />
      <rect x="74" y="32" width="48" height="28" rx="6" fill={PS} />
      <text x="98" y="52" textAnchor="middle" fontSize="15" fontWeight="700" fill={P}>5.4</text>
      <rect x="126" y="70" width="40" height="8" rx="2" fill={S} />
      <path className="qs-drip" d="M172 30s9 10 9 16a9 9 0 0 1-18 0c0-6 9-16 9-16z" fill={C} />
    </>
  ) },
  high_sugar: { bg: "bg-lavender-soft", art: (
    <>
      {[[84, 58], [116, 58], [100, 28]].map(([x, y], i) => (
        <g key={i} className="qs-pop" style={d(i * 0.2)}><rect x={x} y={y} width="30" height="30" rx="5" fill={W} stroke={LN} strokeWidth="2" /><path d={`M${x + 7} ${y + 7}h7`} stroke={LN} strokeWidth="2" strokeLinecap="round" /></g>
      ))}
      <path className="qs-bob" d="M164 74V36M152 48l12-12 12 12" fill="none" stroke={C} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path className="qs-twinkle" d="M70 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={S} />
    </>
  ) },
  family_diabetes: { bg: "bg-lavender-soft", art: (
    <>
      <path className="qs-draw" pathLength={100} d="M92 32h56M120 32v22M92 54h56M92 54v14M148 54v14" fill="none" stroke={I} strokeWidth="2.5" strokeLinecap="round" opacity=".55" />
      {[[92, 28, P], [148, 28, C], [92, 76, L], [148, 76, S]].map(([x, y, f], i) => (
        <g key={i} className="qs-pop" style={d(0.15 * i)}><circle cx={x as number} cy={y as number} r="13" fill={f as string} /><circle cx={x as number} cy={(y as number) - 3} r="4.5" fill={W} /><path d={`M${(x as number) - 7} ${(y as number) + 8}a7 6 0 0 1 14 0`} fill={W} /></g>
      ))}
      <path className="qs-drip" d="M188 30s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z" fill={C} />
    </>
  ) },
  veg_daily: { bg: "bg-primary-soft", art: (
    <>
      <ellipse cx="120" cy="60" rx="62" ry="32" fill={W} />
      <ellipse cx="120" cy="60" rx="46" ry="22" fill="none" stroke={LN} strokeWidth="1.5" />
      <g className="qs-pop"><circle cx="100" cy="56" r="13" fill={C} /><path d="M96 44l4 4 4-4" stroke={P} strokeWidth="2.5" fill="none" strokeLinecap="round" /></g>
      <g className="qs-pop" style={d(0.2)}><path d="M126 70c0-16 12-26 26-26 0 16-12 26-26 26z" fill={P} /><path d="M128 68l20-20" stroke={W} strokeWidth="2" strokeLinecap="round" /></g>
      <g className="qs-pop" style={d(0.4)}><path d="M112 74l26-8-24-6z" fill={S} transform="rotate(-10 120 68)" /></g>
      <circle className="qs-pop" style={d(0.6)} cx="138" cy="48" r="5" fill={L} />
    </>
  ) },
  active_daily: { bg: "bg-sun-soft", art: (
    <>
      <rect x="114" y="8" width="12" height="8" rx="2" fill={I} />
      <circle cx="120" cy="56" r="38" fill={W} />
      <circle className="qs-draw" pathLength={100} cx="120" cy="56" r="30" fill="none" stroke={S} strokeWidth="8" strokeDasharray="50 100" strokeLinecap="round" transform="rotate(-90 120 56)" />
      <text x="120" y="60" textAnchor="middle" fontSize="18" fontWeight="700" fill={I}>30</text>
      <text x="120" y="74" textAnchor="middle" fontSize="9" fontWeight="600" fill={I} opacity=".6">min</text>
    </>
  ) },
  active_days: { bg: "bg-sun-soft", art: (
    <>
      {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
        <g key={i}>
          <rect x={34 + i * 25} y="34" width="22" height="36" rx="8" fill={W} />
          <text x={45 + i * 25} y="50" textAnchor="middle" fontSize="10" fontWeight="700" fill={I} opacity=".6">{l}</text>
          {i < 5 && <Tick x={45 + i * 25} y={60} delay={0.15 * i} color={i % 2 ? S : P} />}
        </g>
      ))}
    </>
  ) },
  sleep_hours: { bg: "bg-lavender-soft", art: (
    <>
      <path className="qs-float" d="M136 18a32 32 0 1 0 30 42 26 26 0 0 1-30-42z" fill={N} />
      {[[78, 30, 5], [96, 70, 3.5], [186, 26, 4], [192, 74, 3]].map(([x, y, r], i) => (
        <path key={i} className="qs-twinkle" style={d(i * 0.5)} d={`M${x} ${y - r * 2}l${r * 0.5} ${r * 1.5} ${r * 1.5} ${r * 0.5}-${r * 1.5} ${r * 0.5}-${r * 0.5} ${r * 1.5}-${r * 0.5}-${r * 1.5}-${r * 1.5}-${r * 0.5} ${r * 1.5}-${r * 0.5}z`} fill={S} />
      ))}
    </>
  ) },
  snore: { bg: "bg-lavender-soft", art: (
    <>
      <circle cx="88" cy="58" r="26" fill={W} />
      <path d="M76 54q4 4 8 0M92 54q4 4 8 0" stroke={I} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="88" cy="68" rx="5" ry="4" fill={I} />
      {[[124, 56, 12], [144, 40, 16], [168, 22, 20]].map(([x, y, s], i) => (
        <text key={i} className="qs-zz" style={d(i * 0.45)} x={x} y={y} fontSize={s} fontWeight="800" fill={L}>z</text>
      ))}
      {[0, 1].map((i) => <path key={i} className="qs-wave" style={d(i * 0.6)} d={`M${118 + i * 10} 62q6 6 0 12`} stroke={P} strokeWidth="3" fill="none" strokeLinecap="round" />)}
    </>
  ) },
  tired: { bg: "bg-lavender-soft", art: (
    <>
      <rect x="74" y="34" width="84" height="40" rx="10" fill={W} stroke={I} strokeWidth="3" />
      <rect x="158" y="46" width="8" height="16" rx="3" fill={I} />
      <rect className="qs-drain" style={at(80, 54)} x="80" y="40" width="72" height="28" rx="6" fill={C} />
      <path d="M112 42l-8 14h10l-6 12" stroke={W} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ) },
  observed: { bg: "bg-lavender-soft", art: (
    <>
      <rect x="54" y="62" width="132" height="22" rx="8" fill={L} />
      <rect x="54" y="84" width="8" height="12" rx="2" fill={I} /><rect x="178" y="84" width="8" height="12" rx="2" fill={I} />
      <rect x="62" y="52" width="34" height="14" rx="7" fill={W} />
      <circle cx="80" cy="46" r="10" fill={P} />
      <path className="qs-ecg" pathLength={100} d="M100 34q6-10 12 0t12 0h28q6-10 12 0t12 0" fill="none" stroke={P} strokeWidth="3" strokeLinecap="round" />
      <path d="M124 34h28" stroke={C} strokeWidth="3" strokeDasharray="3 5" strokeLinecap="round" />
    </>
  ) },
  neck: { bg: "bg-coral-soft", art: (
    <>
      <rect x="102" y="8" width="36" height="46" rx="14" fill={W} />
      <path d="M60 100c4-30 26-44 60-44s56 14 60 44z" fill={P} />
      <path d="M100 56l20 18 20-18" fill={W} stroke={P} strokeWidth="2" />
      <path className="qs-draw" pathLength={100} d="M98 40c14 6 30 6 44 0" fill="none" stroke={S} strokeWidth="7" strokeLinecap="round" />
      <text x="158" y="34" fontSize="12" fontWeight="700" fill={C}>40 cm</text>
    </>
  ) },
  drinks: { bg: "bg-sun-soft", art: (
    <>
      <path d="M92 18h56l-8 76h-40z" fill={W} stroke={LN} strokeWidth="2" strokeLinejoin="round" />
      <path d="M97 40h46l-5.6 50h-34.8z" fill={S} />
      {[[110, 0], [126, 0.6], [118, 1.2]].map(([x, t], i) => <circle key={i} className="qs-bubble" style={d(t)} cx={x} cy="84" r="3" fill={W} opacity=".9" />)}
      <path d="M99 40c8 4 16-4 24 0s16-4 22 0" stroke={W} strokeWidth="3" fill="none" opacity=".6" />
    </>
  ) },
  audit1: { bg: "bg-sun-soft", art: (
    <>
      <rect x="62" y="14" width="116" height="80" rx="12" fill={W} />
      <rect x="62" y="14" width="116" height="18" rx="12" fill={C} /><rect x="62" y="24" width="116" height="8" fill={C} />
      {Array.from({ length: 14 }, (_, i) => {
        const x = 74 + (i % 7) * 15, y = 46 + Math.floor(i / 7) * 22, on = [1, 4, 5, 11, 12].includes(i);
        return on ? <path key={i} className="qs-pop" style={d(i * 0.06)} d={`M${x - 4} ${y - 6}h8l-1.2 12h-5.6z`} fill={S} stroke={I} strokeWidth="1.2" /> : <circle key={i} cx={x} cy={y} r="2" fill={LN} />;
      })}
    </>
  ) },
  audit2: { bg: "bg-sun-soft", art: <>{[0, 1, 2, 3].map((i) => <Glass key={i} x={66 + i * 30} delay={i * 0.35} />)}<text x="66" y="24" fontSize="12" fontWeight="700" fill={I} opacity=".6">1 · 2 · 3 · 4 …</text></> },
  audit3: { bg: "bg-sun-soft", art: (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => <Glass key={i} x={42 + i * 27} delay={i * 0.12} />)}
      <path className="qs-draw" pathLength={100} d="M42 90v6h157v-6" fill="none" stroke={C} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect className="qs-pop" style={d(0.8)} x="104" y="10" width="34" height="20" rx="10" fill={C} />
      <text className="qs-pop" style={d(0.8)} x="121" y="24" textAnchor="middle" fontSize="12" fontWeight="800" fill={W}>6+</text>
    </>
  ) },
  who1: { bg: "bg-sun-soft", art: (
    <>
      <g className="qs-spin-slow" style={at(120, 52)}>{Array.from({ length: 12 }, (_, i) => <path key={i} d="M120 8v9" transform={`rotate(${i * 30} 120 52)`} stroke={S} strokeWidth="4" strokeLinecap="round" />)}</g>
      <circle className="qs-beat" style={at(120, 52)} cx="120" cy="52" r="28" fill={S} />
      <circle cx="110" cy="47" r="3" fill={I} /><circle cx="130" cy="47" r="3" fill={I} />
      <path d="M108 58q12 11 24 0" stroke={I} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="102" cy="57" r="4" fill={C} opacity=".5" /><circle cx="138" cy="57" r="4" fill={C} opacity=".5" />
    </>
  ) },
  who2: { bg: "bg-primary-soft", art: (
    <>
      {[0, 1, 2].map((i) => <ellipse key={i} className="qs-breathe-big" style={{ ...at(120, 70), ...d(i * 0.6) }} cx="120" cy="70" rx={30 + i * 22} ry={7 + i * 5} fill="none" stroke={P} strokeWidth="2" opacity={0.5 - i * 0.12} />)}
      <g className="qs-float"><path d="M120 66c-20-6-26-26-18-44 18 6 26 24 18 44z" fill={P} /><path d="M120 66c-3-14-8-26-16-38" stroke={W} strokeWidth="2" fill="none" strokeLinecap="round" /></g>
    </>
  ) },
  who3: { bg: "bg-coral-soft", art: (
    <>
      <path className="qs-beat" style={at(120, 52)} d="M128 10L96 58h22l-8 36 34-50h-22z" fill={S} stroke={I} strokeWidth="2.5" strokeLinejoin="round" />
      {[0, 1, 2].map((i) => <path key={i} className="qs-wave" style={d(i * 0.3)} d={`M${62 + i * 4} ${34 + i * 18}h${22 - i * 4}`} stroke={C} strokeWidth="4" strokeLinecap="round" />)}
      {[0, 1, 2].map((i) => <path key={i} className="qs-wave" style={d(0.15 + i * 0.3)} d={`M${156 - i * 4} ${34 + i * 18}h${22 - i * 4}`} stroke={C} strokeWidth="4" strokeLinecap="round" />)}
    </>
  ) },
  who4: { bg: "bg-lavender-soft", art: (
    <>
      <g className="qs-rise-sun"><circle cx="120" cy="72" r="26" fill={S} />{[-60, -30, 0, 30, 60].map((r) => <path key={r} d="M120 36v-8" transform={`rotate(${r} 120 72)`} stroke={S} strokeWidth="4" strokeLinecap="round" />)}</g>
      <rect x="40" y="70" width="160" height="34" fill="var(--color-lavender-soft)" />
      <rect x="56" y="70" width="128" height="18" rx="8" fill={L} />
      <rect x="64" y="60" width="38" height="14" rx="7" fill={W} />
      <path d="M40 70h160" stroke={L} strokeWidth="2" opacity=".5" />
    </>
  ) },
  who5: { bg: "bg-primary-soft", art: (
    <>
      <path className="qs-twinkle" d="M120 18l7 20 20 7-20 7-7 20-7-20-20-7 20-7z" fill={S} />
      {[[74, 30, L, 0.3], [170, 34, C, 0.6], [86, 78, P, 0.9], [160, 80, S, 1.2]].map(([x, y, f, t], i) => (
        <g key={i} className="qs-pop" style={d(t as number)}><circle cx={x as number} cy={y as number} r="10" fill={f as string} /><circle cx={x as number} cy={y as number} r="4" fill={W} /></g>
      ))}
      <path className="qs-draw" pathLength={100} d="M84 78Q120 96 160 80M74 30Q100 18 113 38M170 34Q150 20 128 38" fill="none" stroke={I} strokeWidth="2" strokeDasharray="3 5" opacity=".35" />
    </>
  ) },
  mood: { bg: "bg-sun-soft", art: (
    <>
      <g className="qs-spin-slow" style={at(110, 50)}>{Array.from({ length: 8 }, (_, i) => <path key={i} d="M110 14v8" transform={`rotate(${i * 45} 110 50)`} stroke={S} strokeWidth="4" strokeLinecap="round" />)}</g>
      <circle cx="110" cy="50" r="20" fill={S} />
      <path className="qs-cloud" d="M120 80h50a14 14 0 0 0 0-28 20 20 0 0 0-38-2 13 13 0 0 0-12 30z" fill={W} />
    </>
  ) },
  calm: { bg: "bg-primary-soft", art: (
    <>
      <circle className="qs-breathe-big" style={at(120, 52)} cx="120" cy="52" r="42" fill={P} opacity=".12" />
      <circle className="qs-breathe-big" style={{ ...at(120, 52), ...d(0.4) }} cx="120" cy="52" r="30" fill={P} opacity=".2" />
      <circle cx="120" cy="52" r="18" fill={P} />
      <path d="M112 54q8 6 16 0" stroke={W} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="114" cy="47" r="2" fill={W} /><circle cx="126" cy="47" r="2" fill={W} />
    </>
  ) },
  checks: { bg: "bg-primary-soft", art: (
    <>
      <rect x="80" y="14" width="80" height="84" rx="12" fill={W} />
      <rect x="104" y="8" width="32" height="14" rx="5" fill={P} />
      {[0, 1, 2].map((i) => <g key={i}><Tick x={98} y={40 + i * 20} delay={i * 0.3} color={[P, S, C][i]} /><rect x="112" y={37 + i * 20} width="34" height="6" rx="3" fill={LN} /></g>)}
    </>
  ) },
  checks_women: { bg: "bg-coral-soft", art: (
    <>
      <rect x="66" y="14" width="74" height="84" rx="12" fill={W} />
      {[0, 1, 2].map((i) => <g key={i}><Tick x={82} y={36 + i * 22} delay={i * 0.3} color={[C, L, P][i]} /><rect x="96" y={33 + i * 22} width="32" height="6" rx="3" fill={LN} /></g>)}
      <path className="qs-float" d="M172 22c-10 0-14 10-9 20l-13 30 8 3 12-24 12 24 8-3-13-30c5-10 1-20-5-20z" fill={C} />
    </>
  ) },
};

const PHQ_GAD = (id: string) => (/^phq\d$/.test(id) ? "mood" : /^gad\d$/.test(id) ? "calm" : id);

export function QuestionArt({ id, fallback }: { id: string; fallback: IllustrationName }) {
  const scene = SCENES[PHQ_GAD(id)];
  if (!scene) return <IllustrationCard name={fallback} compact />;
  return (
    <div aria-hidden="true" className={`qs relative h-[120px] w-full overflow-hidden rounded-[var(--radius-xl)] ${scene.bg}`}>
      <span className="absolute -top-12 -right-10 h-36 w-36 rounded-full bg-surface/35" />
      <span className="absolute -bottom-14 -left-8 h-32 w-32 rotate-12 rounded-[40px] bg-surface/25" />
      <svg key={id} viewBox="0 0 240 104" className="absolute inset-0 m-auto h-full w-full max-w-[340px]" role="presentation">
        {scene.art}
      </svg>
    </div>
  );
}
