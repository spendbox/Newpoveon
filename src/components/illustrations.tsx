import { SVGS } from "./illustrations.generated";

/** Friendly names used by the questionnaire → the SVG file + the topic tint behind it (DESIGN.md). */
const MAP = {
  aboutYou: { svg: "aboutYou", bg: "bg-leaf-tint" },
  scale: { svg: "scale", bg: "bg-sun-tint" },
  tape: { svg: "tape", bg: "bg-coral-tint" },
  heartHistory: { svg: "heartHistory", bg: "bg-coral-tint" },
  lungs: { svg: "smokingLungs", bg: "bg-coral-tint" },
  bp: { svg: "bloodPressureGauge", bg: "bg-leaf-tint" },
  sugar: { svg: "sugar", bg: "bg-lavender-tint" },
  family: { svg: "family", bg: "bg-lavender-tint" },
  veg: { svg: "veg", bg: "bg-leaf-tint" },
  moving: { svg: "moving", bg: "bg-sun-tint" },
  sleep: { svg: "sleep", bg: "bg-night" },
  drink: { svg: "drink", bg: "bg-sun-tint" },
  mood: { svg: "mood", bg: "bg-lavender-tint" },
  calm: { svg: "calm", bg: "bg-leaf-tint" },
  checklist: { svg: "checklist", bg: "bg-sun-tint" },
  support: { svg: "support", bg: "bg-lavender-tint" },
  doctor: { svg: "doctor", bg: "bg-leaf-tint" },
  homeTest: { svg: "homeTest", bg: "bg-sun-tint" },
  delivery: { svg: "delivery", bg: "bg-coral-tint" },
  welcome: { svg: "welcomeCharacter", bg: "" },
} as const satisfies Record<string, { svg: keyof typeof SVGS; bg: string }>;

export type IllustrationName = keyof typeof MAP;

/** An illustration card: 196px tall on phones, radius-lg, on its topic tint. */
export function IllustrationCard({ name, happy = false, className = "" }: { name: IllustrationName; happy?: boolean; className?: string }) {
  const m = MAP[name];
  return (
    <div
      className={`ill ${happy ? "happy" : ""} ${m.bg} h-[196px] w-full overflow-hidden rounded-[var(--radius-lg)] [&:not(.happy)_.sparkles]:hidden ${className}`}
      // Static, trusted SVG from our own design files.
      dangerouslySetInnerHTML={{ __html: SVGS[m.svg] }}
    />
  );
}

export function Illustration({ name, className = "" }: { name: IllustrationName; className?: string }) {
  return <div className={`ill ${className}`} dangerouslySetInnerHTML={{ __html: SVGS[MAP[name].svg] }} />;
}
