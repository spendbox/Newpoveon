"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Icon, type IconName } from "./icons";

/* ---------------- Answer tile: pop + tick badge when chosen ---------------- */
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
      animate={selected && !reduce ? { scale: [1, 1.08, 0.97, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={reduce ? undefined : { y: -2 }}
      className={`relative flex rounded-[var(--radius-md)] border-[2.5px] text-ink font-extrabold text-[15px] leading-5 transition-colors ${
        selected ? "border-ink bg-coral-tint" : "border-border bg-surface"
      } ${layout === "grid" ? "min-h-[112px] flex-col items-center justify-center gap-2 px-2 py-3 text-center" : "min-h-[62px] items-center gap-3 px-4 py-3 text-left"}`}
    >
      {icon && <Icon name={icon} size={layout === "grid" ? 40 : 28} />}
      <span>{label}</span>
      {selected && (
        <motion.span
          initial={reduce ? false : { scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="absolute -top-2 -right-1.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-leaf text-white"
          aria-hidden="true"
        >
          <Icon name="check" size={14} strokeWidth={3.5} />
        </motion.span>
      )}
    </motion.button>
  );
}

/* ---------------- Walking progress character on a dashed path to a flag ---------------- */
export function ProgressWalker({ fraction, cheer }: { fraction: number; cheer: string }) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div>
      <div className="relative mt-3 h-[46px]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Your progress">
        <div className="absolute top-[30px] right-[30px] left-1.5 border-t-[3px] border-dashed border-[#B7D6CA]" />
        <div className="absolute top-[30px] left-1.5 h-[3px] rounded bg-leaf transition-[width] duration-500" style={{ width: `calc((100% - 36px) * ${pct / 100})` }} />
        <div className="absolute top-0 transition-[left] duration-500" style={{ left: `calc((100% - 56px) * ${pct / 100})` }}>
          <svg className="walker" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
            <circle cx="15" cy="15" r="13" fill="#FF7A59" stroke="#0E2A24" strokeWidth="2.5" />
            <circle cx="11" cy="13" r="1.8" fill="#0E2A24" />
            <circle cx="19" cy="13" r="1.8" fill="#0E2A24" />
            <path d="M10.5 18 Q15 22 19.5 18" fill="none" stroke="#0E2A24" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <svg className="absolute top-1.5 right-0" width="26" height="30" viewBox="0 0 26 30" aria-hidden="true">
          <path d="M5 28V3" stroke="#0E2A24" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M6 4h15l-4 5 4 5H6z" fill="#FFC845" stroke="#0E2A24" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="mt-1 text-sm font-extrabold text-leaf" aria-live="polite">{cheer}</p>
    </div>
  );
}

/* ---------------- Small floating "Talk to a doctor" button, throughout the app ---------------- */
export function FloatingDoctor() {
  const path = usePathname();
  // On question screens the doctor link sits in the top bar instead, so it never covers "Continue".
  if (path.startsWith("/doctor") || path.startsWith("/admin") || path.startsWith("/check")) return null;
  return (
    <Link
      href="/doctor"
      className="fixed right-4 bottom-4 z-40 inline-flex min-h-[52px] items-center gap-2 rounded-full border-[2.5px] border-ink bg-surface pr-4 pl-3 text-[15px] font-extrabold text-ink shadow-[0_4px_0_#0E2A24] transition-transform hover:-translate-y-0.5"
      aria-label="Talk to a doctor for ₦5,000"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coral">
        <Icon name="chat" size={18} />
      </span>
      <span className="hidden sm:inline">Talk to a doctor</span>
      <span className="sm:hidden">Doctor</span>
    </Link>
  );
}
