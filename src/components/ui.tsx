import Link from "next/link";
import type { ReactNode } from "react";
import { helpLabel } from "@/lib/help";
import { Icon, type IconName } from "./icons";
import { PoveonMark } from "./poveon-mark";
import { site } from "@/config/site";
import type { ResultCard as ResultCardData, Status } from "@/lib/scoring/results";
import { displayValue, STATUS_LABEL } from "@/lib/scoring/results";

export { Button, ButtonLink, SubmitButton, Spinner } from "./buttons";

export function Logo({ animate = false }: { animate?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label={`${site.appName} home`}>
      <PoveonMark size={32} animate={animate} />
      <span className={`font-display text-[19px] font-bold tracking-tight ${animate ? "pv-word" : ""}`}>{site.appName}</span>
    </Link>
  );
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[13px] font-medium text-muted ${className}`}>{children}</span>;
}

/* ---------------- Status: always a word + an icon, never colour alone ---------------- */
export const STATUS_STYLE: Record<Status, { bg: string; text: string; dot: string; icon: IconName }> = {
  good: { bg: "bg-good-bg", text: "text-good-text", dot: "bg-good-text", icon: "check" },
  check: { bg: "bg-check-bg", text: "text-check-text", dot: "bg-check-text", icon: "warning" },
  act: { bg: "bg-act-bg", text: "text-act-text", dot: "bg-act-text", icon: "alert" },
};
export function StatusLabel({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${s.bg} px-2 py-0.5 text-xs font-semibold ${s.text}`}>
      <Icon name={s.icon} size={13} strokeWidth={2.4} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Result cards open the "Get help" page with the most fitting concern already chosen. */
const CARD_TO_CONSULT: Record<string, string> = {
  wellbeing: "mental-health", heart: "lower-my-risk", bp: "condition-review", diabetes: "lower-my-risk", body: "weight", sleep: "sleep",
  mood: "mental-health", anxiety: "mental-health", alcohol: "alcohol", smoking: "stop-smoking", activity: "lower-my-risk",
};
export function nextStepHref(next: ResultCardData["next"], cardId?: string): string | null {
  if (next.kind === "doctor") return cardId && CARD_TO_CONSULT[cardId] ? `/doctor?type=${CARD_TO_CONSULT[cardId]}` : "/doctor";
  if (next.kind === "test") return `/home-tests?test=${encodeURIComponent(next.testCode)}`;
  return null;
}

export function ResultCard({ card }: { card: ResultCardData }) {
  const href = nextStepHref(card.next, card.id);
  return (
    <article className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-body text-sm font-medium tracking-normal text-muted">{card.topic}</h3>
        <StatusLabel status={card.status} />
      </div>
      <p className="font-display text-xl leading-6 font-semibold">{displayValue(card)}</p>
      <p className="text-[15px] leading-6 text-ink/90">{card.summary}</p>
      <p className="text-xs leading-5 text-subtle">{card.basis} An estimate, not a diagnosis.</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
        {href ? (
          <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            {helpLabel(card.next.label)} <Icon name="arrowRight" size={16} strokeWidth={2} />
          </Link>
        ) : (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
            <Icon name="clock" size={16} strokeWidth={2} /> {card.next.label}
          </p>
        )}
        <Link href={`/learn/${card.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-ink/70 hover:text-ink hover:underline">
          How to improve it <Icon name="arrowRight" size={14} strokeWidth={2} />
        </Link>
      </div>
    </article>
  );
}

export function Overline({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">{children}</p>;
}

export function Field({ label, hint, children, id }: { label: string; hint?: string; id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      {children}
      {hint && <p className="text-xs text-subtle">{hint}</p>}
    </div>
  );
}
export const inputCls =
  "min-h-[50px] w-full rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 text-base text-ink placeholder:text-subtle/70 transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_4px_var(--color-primary-soft)] focus:outline-none";

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "good"; children: ReactNode }) {
  const map = { info: "bg-surface-2 text-ink", warn: "bg-check-bg text-check-text", good: "bg-good-bg text-good-text" };
  return <div className={`rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium ${map[tone]}`} role={tone === "warn" ? "alert" : undefined}>{children}</div>;
}

/** Page wrapper for simple phone-width pages. */
export function Narrow({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <main className={`mx-auto w-full px-5 pt-6 ${wide ? "max-w-[460px] md:max-w-3xl" : "max-w-[460px]"}`}>{children}</main>;
}
