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
 */
export function Steps({
  steps, onSubmit, submitLabel, busy = false, error, className = "",
}: { steps: Step[]; onSubmit: () => void; submitLabel: string; busy?: boolean; error?: string | null; className?: string }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  const idx = Math.min(i, steps.length - 1);
  const step = steps[idx];
  const last = idx === steps.length - 1;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [idx]);

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
    setDir(-1);
    setI(Math.max(0, idx - 1));
  }

  return (
    <form onSubmit={next} noValidate className={`rounded-[var(--radius-xl)] border border-line bg-surface p-5 md:p-7 ${className}`}>
      <div className="flex items-center justify-between text-[13px] font-medium text-muted">
        <span className="tabular">Step {idx + 1} of {steps.length}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={idx + 1} aria-label="Form progress">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${((idx + 1) / steps.length) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={step.key}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 20 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16 * dir }}
          transition={{ duration: reduce ? 0.1 : 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-5"
        >
          <h3 ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none md:text-2xl">{step.title}</h3>
          {step.hint && <p className="mt-1 text-sm text-muted">{step.hint}</p>}
          <div className="mt-4 flex flex-col gap-4">{step.content}</div>
        </motion.div>
      </AnimatePresence>
      {error && <div className="mt-4"><Notice tone="warn">{error}</Notice></div>}
      <div className="mt-6 flex gap-3">
        {idx > 0 && <Button variant="secondary" onClick={back} className="w-28" icon="arrowLeft">Back</Button>}
        <Button type="submit" disabled={!step.valid || busy} iconRight={last ? undefined : "arrowRight"} className="flex-1">
          {busy ? "Sending…" : last ? submitLabel : "Continue"}
        </Button>
      </div>
    </form>
  );
}
