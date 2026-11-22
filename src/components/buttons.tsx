"use client";
import Link, { useLinkStatus } from "next/link";
import { useEffect, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Icon, type IconName } from "./icons";

const base = "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background,box-shadow,transform,border-color,opacity] duration-150 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 aria-busy:cursor-wait";
const primary = `${base} min-h-[54px] rounded-[var(--radius-md)] bg-primary px-6 text-[17px] text-white shadow-[var(--shadow-sm)] hover:bg-primary-hover hover:shadow-[var(--shadow-md)]`;
const secondary = `${base} min-h-[50px] rounded-[var(--radius-md)] border border-line-strong bg-surface px-5 text-[16px] text-ink hover:border-ink/40 hover:bg-surface-2`;
const quiet = `${base} min-h-[44px] rounded-[var(--radius-sm)] bg-surface-2 px-4 text-[15px] text-ink hover:bg-line`;

export type Variant = "primary" | "secondary" | "quiet";
export const buttonCls = (v: Variant) => (v === "primary" ? primary : v === "secondary" ? secondary : quiet);

/** A small spinner that inherits the text colour. */
export function Spinner({ size = 18 }: { size?: number }) {
  return <span aria-hidden="true" className="inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ width: size, height: size }} />;
}

/** Icon, or a spinner while busy. Keeps the button the same size. */
function Inner({ busy, icon, iconRight, children }: { busy: boolean; icon?: IconName; iconRight?: IconName; children: ReactNode }) {
  return (
    <>
      {busy ? <Spinner /> : icon && <Icon name={icon} size={20} strokeWidth={2} />}
      {children}
      {!busy && iconRight && <Icon name={iconRight} size={20} strokeWidth={2} />}
    </>
  );
}

/**
 * Button. Shows a spinner while `loading` is true, or by itself while an async onClick is still running,
 * so every tap gets an answer.
 */
export function Button({ variant = "primary", icon, iconRight, children, className = "", loading, onClick, disabled, ...rest }: { variant?: Variant; icon?: IconName; iconRight?: IconName; loading?: boolean } & ComponentProps<"button">) {
  const [running, setRunning] = useState(false);
  const busy = !!loading || running;
  async function handle(e: MouseEvent<HTMLButtonElement>) {
    const r = onClick?.(e) as unknown;
    if (r && typeof (r as Promise<unknown>).then === "function") {
      setRunning(true);
      try { await r; } finally { setRunning(false); }
    }
  }
  return (
    <button type="button" className={`${buttonCls(variant)} ${className}`} onClick={handle} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>
      <Inner busy={busy} icon={icon} iconRight={iconRight}>{children}</Inner>
    </button>
  );
}

function LinkInner(props: { icon?: IconName; iconRight?: IconName; children: ReactNode }) {
  const { pending } = useLinkStatus();
  return <Inner busy={pending} {...props} />;
}

/** A link that looks like a button, with a spinner while the next page loads. */
export function ButtonLink({ variant = "primary", icon, iconRight, children, className = "", ...rest }: { variant?: Variant; icon?: IconName; iconRight?: IconName } & ComponentProps<typeof Link>) {
  return (
    <Link className={`${buttonCls(variant)} ${className}`} {...rest}>
      <LinkInner icon={icon} iconRight={iconRight}>{children}</LinkInner>
    </Link>
  );
}

/**
 * Submit button for forms: spins and disables itself while the form is sending.
 * Works for server actions (via the form status) and for plain HTML form posts (from the tap itself).
 */
export function SubmitButton({ children, className = "", pendingText, onClick, ...rest }: { pendingText?: string } & ComponentProps<"button">) {
  const { pending } = useFormStatus();
  const [tapped, setTapped] = useState(false);
  useEffect(() => {
    if (!tapped) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the form status has taken over
    if (pending) setTapped(false);
    const t = setTimeout(() => setTapped(false), 10000);
    return () => clearTimeout(t);
  }, [tapped, pending]);
  const busy = pending || tapped;
  return (
    <button type="submit" {...rest}
      onClick={(e) => { onClick?.(e); const f = e.currentTarget.form; if (!e.defaultPrevented && (!f || f.checkValidity())) setTimeout(() => setTapped(true), 0); }}
      className={`relative inline-flex items-center justify-center gap-2 whitespace-nowrap transition-transform active:scale-[.98] disabled:opacity-60 ${className}`}
      disabled={busy || rest.disabled} aria-busy={busy || undefined}>
      {busy && <Spinner size={16} />}
      {busy && pendingText ? pendingText : children}
    </button>
  );
}
