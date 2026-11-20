"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button, Notice } from "./ui";

export interface Step {
  key: string;
  title: string;
  hint?: string;
  /** Can the person move on from this step? */
  valid: boolean;
  content: ReactNode;
}

/**
 * One short step at a time: a title, a few fields, Back / Continue.
 * Enter moves on when the step is filled in; the last step submits.
 * variant "full" takes the whole screen like an app flow: progress at the top,
 * room for the step, and the buttons pinned to the bottom.
 */
export function Steps({
  steps, onSubmit, submitLabel, busy = false, error, className = "", variant = "card", onExit,
}: {
  steps: Step[]; onSubmit: () => void; submitLabel: string; busy?: boolean; error?: string | null; className?: string;
  variant?: "card" | "full"; onExit?: () => void;
}) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  const idx = Math.min(i, steps.length - 1);
  const step = steps[idx];
  const last = idx === steps.length - 1;
  const full = variant === "full";

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
    if (full) window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [idx, full, reduce]);

  function next(e?: React.FormEvent) {
    e?.preventDefault();
    if (!step.valid || busy) return;
    if (last) onSubmit();
    else {
      setDir(1);
      setI(idx + 1);
    }
  }
  function back() {
    if (idx === 0) return onExit?.();
    setDir(-1);
    setI(idx - 1);
  }

  const progress = (
    <>
      <div className="flex items-center justify-between text-[13px] font-medium text-muted">
        <span className="tabular">Step {idx + 1} of {steps.length}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={idx + 1} aria-label="Progress">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${((idx + 1) / steps.length) * 100}%` }} />
      </div>
    </>
  );

  const body = (
    <AnimatePresence mode="wait" initial={false} custom={dir}>
      <motion.div
        key={step.key}
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 * dir }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, x: -18 * dir }}
        transition={{ duration: reduce ? 0.1 : 0.26, ease: [0.2, 0.8, 0.2, 1] }}
        className={full ? "pt-7" : "mt-5"}
      >
        <h2 ref={heading} tabIndex={-1} className={`font-semibold outline-none ${full ? "text-[28px] leading-[1.1] md:text-4xl" : "text-xl md:text-2xl"}`}>{step.title}</h2>
        {step.hint && <p className={`mt-2 text-muted ${full ? "text-[16px]" : "text-sm"}`}>{step.hint}</p>}
        <div className={`flex flex-col gap-4 ${full ? "mt-6" : "mt-4"}`}>{step.content}</div>
        {error && <div className="mt-4"><Notice tone="warn">{error}</Notice></div>}
      </motion.div>
    </AnimatePresence>
  );

  const buttons = (
    <div className="flex gap-3">
      {(idx > 0 || (full && onExit)) && <Button variant="secondary" onClick={back} className="w-28" icon="arrowLeft">Back</Button>}
      <Button type="submit" disabled={!step.valid || busy} iconRight={last ? undefined : "arrowRight"} className="flex-1">
        {busy ? "Please wait…" : last ? submitLabel : "Continue"}
      </Button>
    </div>
  );

  if (full) {
    return (
      <form onSubmit={next} noValidate className={`flex min-h-[calc(100dvh-72px)] min-w-0 flex-col ${className}`}>
        <div className="sticky top-0 z-10 -mx-5 bg-ground/95 px-5 pt-3 pb-3 backdrop-blur">{progress}</div>
        <div className="min-w-0 flex-1 pb-6">{body}</div>
        <div className="sticky bottom-0 z-10 -mx-5 border-t border-line bg-ground/95 px-5 pt-3 backdrop-blur" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          {buttons}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={next} noValidate className={`min-w-0 overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface p-5 md:p-7 ${className}`}>
      {progress}
      {body}
      <div className="mt-6">{buttons}</div>
    </form>
  );
}
