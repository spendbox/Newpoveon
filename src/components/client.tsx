"use client";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentProps } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon, type IconName } from "./icons";

/* ---------------- Answer tile: a calm card that springs a little when chosen ---------------- */
export function AnswerTile({
  label, icon, selected, onClick, layout = "grid", multi = false,
}: { label: string; icon?: IconName; selected: boolean; onClick: () => void; layout?: "grid" | "rows"; multi?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      animate={selected && !reduce ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className={`relative flex rounded-[var(--radius-lg)] border text-[15px] leading-5 font-medium text-ink transition-[background,border-color,box-shadow] ${
        selected ? "border-primary bg-primary-soft shadow-[0_0_0_1px_var(--color-primary)]" : "border-line bg-surface hover:border-line-strong hover:shadow-[var(--shadow-sm)]"
      } ${layout === "grid" ? "min-h-[104px] flex-col items-center justify-center gap-2.5 px-2 py-3 text-center" : "min-h-[58px] items-center gap-3 px-4 py-3 text-left"}`}
    >
      {icon && (
        <span className={`flex shrink-0 items-center justify-center rounded-full ${selected ? "bg-surface text-primary" : "bg-surface-2 text-ink"} ${layout === "grid" ? "h-11 w-11" : "h-9 w-9"}`}>
          <Icon name={icon} size={layout === "grid" ? 22 : 18} strokeWidth={2} />
        </span>
      )}
      <span className="flex-1">{label}</span>
      {layout === "rows" && (
        <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center ${multi ? "rounded-md" : "rounded-full"} border ${selected ? "border-primary bg-primary text-white" : "border-line-strong"}`}>
          {selected && <Icon name="check" size={12} strokeWidth={3} />}
        </span>
      )}
      {layout === "grid" && selected && (
        <motion.span
          initial={reduce ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
          aria-hidden="true"
        >
          <Icon name="check" size={12} strokeWidth={3} />
        </motion.span>
      )}
    </motion.button>
  );
}

/* ---------------- Progress: a slim bar with a glowing marker and a word of encouragement ---------------- */
export function ProgressWalker({ fraction, cheer }: { fraction: number; cheer: string }) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className="mt-4">
      <div className="relative h-1.5 rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Your progress">
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
        <span className="pulse-dot absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-[3px] border-surface bg-coral transition-[left] duration-500" style={{ left: `calc(${pct}% - 7px)` }} />
      </div>
      <p className="mt-2 text-[13px] font-medium text-primary" aria-live="polite">{cheer}</p>
    </div>
  );
}

/* ---------------- Floating "Get help" button ---------------- */
/** Inside the link: swaps the icon for a spinner and says "Opening…" while the page loads. */
function HelpLabel() {
  const { pending } = useLinkStatus();
  return (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
        {pending ? <span className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-white/35 border-t-white" aria-hidden="true" /> : <Icon name="stethoscope" size={22} strokeWidth={2} />}
      </span>
      <span aria-live="polite">{pending ? "Opening…" : "Get help"}</span>
    </>
  );
}
export function FloatingDoctor() {
  const path = usePathname();
  // On question screens the doctor link sits in the top bar instead, so it never covers "Continue".
  if (path.startsWith("/doctor") || path.startsWith("/admin") || path.startsWith("/check") || path.startsWith("/account") || path.startsWith("/results")) return null;
  return (
    <Link
      href="/doctor"
      className="fixed right-4 bottom-4 z-40 inline-flex min-h-[60px] items-center gap-2.5 rounded-full border border-line bg-surface/95 py-2 pr-5 pl-2 text-[16px] font-semibold text-ink shadow-[var(--shadow-lg)] backdrop-blur transition-transform hover:-translate-y-0.5 active:scale-95"
      aria-label="Get help from a doctor"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <HelpLabel />
    </Link>
  );
}

/* ---------------- Password field with a show / hide eye ---------------- */
export function PasswordInput({ className = "", ...rest }: Omit<ComponentProps<"input">, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...rest} type={show ? "text" : "password"} className={`${className} pr-12`} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute top-1/2 right-1.5 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-2 hover:text-ink"
      >
        <Icon name={show ? "eyeOff" : "eye"} size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
