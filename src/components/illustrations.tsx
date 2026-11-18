import { Icon, type IconName } from "./icons";

/**
 * Topic art (design v2): a soft colour field, two quiet shapes and one refined icon.
 * Replaces the v1 cartoon illustrations: friendly, but calm and professional.
 */
const MAP = {
  aboutYou: { icon: "user", bg: "bg-primary-soft", a: "bg-primary/15", b: "bg-sun/40" },
  scale: { icon: "scale", bg: "bg-sun-soft", a: "bg-sun/45", b: "bg-coral/20" },
  tape: { icon: "ruler", bg: "bg-coral-soft", a: "bg-coral/25", b: "bg-sun/40" },
  heartHistory: { icon: "heart", bg: "bg-coral-soft", a: "bg-coral/25", b: "bg-lavender/20" },
  lungs: { icon: "lungs", bg: "bg-coral-soft", a: "bg-coral/20", b: "bg-primary/15" },
  bp: { icon: "gauge", bg: "bg-primary-soft", a: "bg-primary/15", b: "bg-coral/20" },
  sugar: { icon: "drop", bg: "bg-lavender-soft", a: "bg-lavender/25", b: "bg-coral/20" },
  family: { icon: "family", bg: "bg-lavender-soft", a: "bg-lavender/25", b: "bg-sun/40" },
  veg: { icon: "veg", bg: "bg-primary-soft", a: "bg-primary/20", b: "bg-coral/25" },
  moving: { icon: "run", bg: "bg-sun-soft", a: "bg-sun/50", b: "bg-primary/15" },
  sleep: { icon: "moon", bg: "bg-lavender-soft", a: "bg-lavender/30", b: "bg-night/10" },
  drink: { icon: "glass", bg: "bg-sun-soft", a: "bg-sun/45", b: "bg-lavender/20" },
  mood: { icon: "sun", bg: "bg-sun-soft", a: "bg-sun/50", b: "bg-coral/20" },
  calm: { icon: "mind", bg: "bg-primary-soft", a: "bg-primary/15", b: "bg-lavender/20" },
  checklist: { icon: "clipboard", bg: "bg-primary-soft", a: "bg-primary/15", b: "bg-sun/40" },
  support: { icon: "heart", bg: "bg-lavender-soft", a: "bg-lavender/25", b: "bg-coral/20" },
  doctor: { icon: "stethoscope", bg: "bg-primary-soft", a: "bg-primary/20", b: "bg-coral/20" },
  homeTest: { icon: "flask", bg: "bg-lavender-soft", a: "bg-lavender/25", b: "bg-primary/15" },
  delivery: { icon: "box", bg: "bg-sun-soft", a: "bg-sun/45", b: "bg-coral/20" },
  welcome: { icon: "heart", bg: "bg-primary-soft", a: "bg-primary/15", b: "bg-coral/20" },
} as const satisfies Record<string, { icon: IconName; bg: string; a: string; b: string }>;

export type IllustrationName = keyof typeof MAP;

export function IllustrationCard({ name, className = "", compact = false }: { name: IllustrationName; happy?: boolean; className?: string; compact?: boolean }) {
  const m = MAP[name];
  return (
    <div aria-hidden="true" className={`relative w-full overflow-hidden rounded-[var(--radius-xl)] ${m.bg} ${compact ? "h-[104px]" : "h-[136px]"} ${className}`}>
      <span className={`drift absolute -top-10 -right-8 h-36 w-36 rounded-full ${m.a}`} />
      <span className={`absolute -bottom-12 -left-6 h-32 w-32 rounded-[40px] rotate-12 ${m.b}`} />
      <span className="absolute top-5 left-[22%] h-2 w-2 rounded-full bg-surface/90" />
      <span className="absolute right-[24%] bottom-6 h-1.5 w-1.5 rounded-full bg-ink/20" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`float flex items-center justify-center rounded-[18px] bg-surface text-ink shadow-[var(--shadow-md)] ${compact ? "h-14 w-14" : "h-[72px] w-[72px]"}`}>
          <Icon name={m.icon} size={compact ? 28 : 34} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}
