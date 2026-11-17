import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { site } from "@/config/site";
import type { ResultCard as ResultCardData, Status } from "@/lib/scoring/results";
import { STATUS_LABEL } from "@/lib/scoring/results";

const primary =
  "btn-press inline-flex items-center justify-center gap-2.5 rounded-[var(--radius-md)] border-[2.5px] border-ink bg-coral px-7 font-display text-[21px] leading-6 font-extrabold text-ink disabled:opacity-45 disabled:cursor-not-allowed min-h-[58px]";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-[18px] border-[2.5px] border-ink bg-surface px-5 text-base font-extrabold text-ink transition-transform hover:-translate-y-0.5 min-h-[52px] disabled:opacity-45";
const quiet = "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-surface px-4 text-[15px] font-extrabold text-ink min-h-[44px] hover:bg-white/70";

type Variant = "primary" | "secondary" | "quiet";
const cls = (v: Variant) => (v === "primary" ? primary : v === "secondary" ? secondary : quiet);

export function Button({ variant = "primary", icon, iconRight, children, className = "", ...rest }: { variant?: Variant; icon?: IconName; iconRight?: IconName } & ComponentProps<"button">) {
  return (
    <button type="button" className={`${cls(variant)} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={22} />}
      {children}
      {iconRight && <Icon name={iconRight} size={22} />}
    </button>
  );
}

export function ButtonLink({ variant = "primary", icon, iconRight, children, className = "", ...rest }: { variant?: Variant; icon?: IconName; iconRight?: IconName } & ComponentProps<typeof Link>) {
  return (
    <Link className={`${cls(variant)} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={22} />}
      {children}
      {iconRight && <Icon name={iconRight} size={22} />}
    </Link>
  );
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label={`${site.appName} home`}>
      <span className={`flex items-center justify-center rounded-xl bg-ink ${small ? "h-8 w-8" : "h-9 w-9"}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7A59" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      </span>
      <span className="font-display text-[21px] font-extrabold">{site.appName}</span>
    </Link>
  );
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] font-bold text-muted ${className}`}>{children}</span>;
}

/* ---------------- Status (always word + icon, never colour alone) ---------------- */
const STATUS_STYLE: Record<Status, { bg: string; text: string; icon: IconName }> = {
  good: { bg: "bg-good-bg", text: "text-good-text", icon: "check" },
  check: { bg: "bg-caution-bg", text: "text-caution-text", icon: "warning" },
  act: { bg: "bg-caution-bg", text: "text-caution-text", icon: "alert" },
};
export function StatusLabel({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold ${s.text}`}>
      <Icon name={s.icon} size={14} strokeWidth={2.8} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function nextStepHref(next: ResultCardData["next"]): string | null {
  if (next.kind === "doctor") return "/doctor";
  if (next.kind === "test") return `/home-tests?test=${encodeURIComponent(next.testCode)}`;
  return null;
}

export function ResultCard({ card, expanded = true }: { card: ResultCardData; expanded?: boolean }) {
  const s = STATUS_STYLE[card.status];
  const href = nextStepHref(card.next);
  return (
    <article className={`flex flex-col gap-1 rounded-[var(--radius-md)] ${s.bg} px-3.5 py-3`}>
      <StatusLabel status={card.status} />
      <h3 className="font-body text-sm font-bold text-muted-soft">{card.topic}</h3>
      <p className="font-display text-xl leading-[22px] font-extrabold">{card.value}</p>
      {expanded && (
        <>
          <p className="mt-1 text-sm leading-5">{card.summary}</p>
          <p className="text-xs font-bold text-muted-soft">{card.basis} An estimate, not a diagnosis.</p>
          {href ? (
            <Link href={href} className="mt-1.5 inline-flex items-center gap-1 text-sm font-extrabold text-ink underline decoration-2 underline-offset-4">
              {card.next.label} <Icon name="arrowRight" size={16} />
            </Link>
          ) : (
            <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-extrabold">
              <Icon name="clock" size={16} /> {card.next.label}
            </p>
          )}
        </>
      )}
    </article>
  );
}

/* ---------------- Section heading used on the homepage and elsewhere ---------------- */
export function Overline({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-extrabold tracking-[0.08em] text-leaf uppercase">{children}</p>;
}

/* ---------------- Form field ---------------- */
export function Field({ label, hint, children, id }: { label: string; hint?: string; id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-extrabold">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs font-bold text-muted-soft">{hint}</p>}
    </div>
  );
}
export const inputCls =
  "min-h-[52px] w-full rounded-[var(--radius-sm)] border-[2.5px] border-border bg-surface px-4 text-base font-bold text-ink placeholder:text-muted-soft/70 focus:border-ink focus:outline-none";

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "good"; children: ReactNode }) {
  const map = { info: "bg-surface text-ink", warn: "bg-caution-bg text-caution-text", good: "bg-good-bg text-good-text" };
  return <div className={`rounded-[var(--radius-md)] px-4 py-3 text-sm font-bold ${map[tone]}`} role={tone === "warn" ? "alert" : undefined}>{children}</div>;
}
