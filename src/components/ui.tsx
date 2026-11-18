import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { site } from "@/config/site";
import type { ResultCard as ResultCardData, Status } from "@/lib/scoring/results";
import { STATUS_LABEL } from "@/lib/scoring/results";

const base = "inline-flex items-center justify-center gap-2 font-semibold transition-[background,box-shadow,transform,border-color] duration-150 disabled:cursor-not-allowed disabled:opacity-40";
const primary = `${base} min-h-[54px] rounded-[var(--radius-md)] bg-primary px-6 text-[17px] text-white shadow-[var(--shadow-sm)] hover:bg-primary-hover hover:shadow-[var(--shadow-md)] active:translate-y-px`;
const secondary = `${base} min-h-[50px] rounded-[var(--radius-md)] border border-line-strong bg-surface px-5 text-[16px] text-ink hover:border-ink/40 hover:bg-surface-2`;
const quiet = `${base} min-h-[44px] rounded-[var(--radius-sm)] bg-surface-2 px-4 text-[15px] text-ink hover:bg-line`;

type Variant = "primary" | "secondary" | "quiet";
const cls = (v: Variant) => (v === "primary" ? primary : v === "secondary" ? secondary : quiet);

export function Button({ variant = "primary", icon, iconRight, children, className = "", ...rest }: { variant?: Variant; icon?: IconName; iconRight?: IconName } & ComponentProps<"button">) {
  return (
    <button type="button" className={`${cls(variant)} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={20} strokeWidth={2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={20} strokeWidth={2} />}
    </button>
  );
}

export function ButtonLink({ variant = "primary", icon, iconRight, children, className = "", ...rest }: { variant?: Variant; icon?: IconName; iconRight?: IconName } & ComponentProps<typeof Link>) {
  return (
    <Link className={`${cls(variant)} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={20} strokeWidth={2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={20} strokeWidth={2} />}
    </Link>
  );
}

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label={`${site.appName} home`}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ground bg-coral" />
      </span>
      <span className="font-display text-[19px] font-bold tracking-tight">{site.appName}</span>
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

export function nextStepHref(next: ResultCardData["next"]): string | null {
  if (next.kind === "doctor") return "/doctor";
  if (next.kind === "test") return `/home-tests?test=${encodeURIComponent(next.testCode)}`;
  return null;
}

export function ResultCard({ card }: { card: ResultCardData }) {
  const href = nextStepHref(card.next);
  return (
    <article className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-body text-sm font-medium tracking-normal text-muted">{card.topic}</h3>
        <StatusLabel status={card.status} />
      </div>
      <p className="font-display text-xl leading-6 font-semibold">{card.value}</p>
      <p className="text-[15px] leading-6 text-ink/90">{card.summary}</p>
      <p className="text-xs leading-5 text-subtle">{card.basis} An estimate, not a diagnosis.</p>
      {href ? (
        <Link href={href} className="mt-1 inline-flex items-center gap-1 self-start text-sm font-semibold text-primary hover:underline">
          {card.next.label} <Icon name="arrowRight" size={16} strokeWidth={2} />
        </Link>
      ) : (
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-muted">
          <Icon name="clock" size={16} strokeWidth={2} /> {card.next.label}
        </p>
      )}
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
