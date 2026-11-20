"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Icon } from "./icons";

const NUMBER = "31-1033";
/** Timeline in ticks of 120 ms: find the number, type it, press Verify, see the result, pause, repeat. */
const T = { find: 0, type: 14, press: 14 + NUMBER.length * 3 + 4, result: 14 + NUMBER.length * 3 + 10, end: 14 + NUMBER.length * 3 + 40 };

const CAPTIONS = [
  "Find the NAFDAC number on the pack, for example 31-1033.",
  "Type it into the box on the NAFDAC website.",
  "Tap Verify.",
  "Check the product name and maker match your pack. No match? Don't use it.",
];

/**
 * A looping, illustrated walkthrough of checking a medicine on the NAFDAC portal.
 * It's our own drawing of the steps (not NAFDAC's site), and it stops on the finished state for reduced motion.
 */
export function NafdacDemo() {
  const reduce = useReducedMotion();
  const [t, setT] = useState(T.result + 1);

  useEffect(() => {
    if (reduce) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the loop from the beginning
    setT(0);
    const id = setInterval(() => setT((x) => (x + 1) % T.end), 120);
    return () => clearInterval(id);
  }, [reduce]);

  const typed = t < T.type ? "" : NUMBER.slice(0, Math.min(NUMBER.length, Math.floor((t - T.type) / 3) + 1));
  const step = t < T.type ? 0 : t < T.press ? 1 : t < T.result ? 2 : 3;
  const pressing = t >= T.press && t < T.press + 3;
  const showResult = t >= T.result;

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface">
      <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
        {/* The pack */}
        <div className="relative flex items-center justify-center bg-sun-soft p-6">
          <div className={`relative w-[200px] rounded-[14px] bg-surface p-4 shadow-[var(--shadow-md)] transition-transform duration-500 ${step === 0 ? "scale-105" : ""}`}>
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-coral" />
              <div><p className="text-sm font-bold">Amlodipine 5 mg</p><p className="text-[11px] text-muted">30 tablets</p></div>
            </div>
            <div className="mt-3 h-1.5 w-3/4 rounded-full bg-line" />
            <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-line" />
            <p className={`mt-3 inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[12px] font-semibold transition-colors duration-300 ${step === 0 ? "bg-sun text-ink" : "bg-surface-2 text-muted"}`}>
              NAFDAC Reg. No: <span className="whitespace-nowrap">{NUMBER}</span>
            </p>
            {step === 0 && !reduce && <span className="pulse-dot absolute -right-2 bottom-3 h-4 w-4 rounded-full bg-coral" aria-hidden="true" />}
          </div>
        </div>

        {/* The verify screen (our own drawing of it) */}
        <div className="bg-[#0B5E2E] p-6 text-white" aria-hidden="true">
          <p className="text-center font-display text-xl font-bold tracking-wide uppercase">Verify products</p>
          <p className="mt-1 text-center text-[13px] text-white/85">Enter the NAFDAC number of the product</p>
          <div className={`mx-auto mt-4 flex h-12 max-w-[280px] items-center rounded-xl bg-white px-4 text-lg font-semibold text-ink tabular ring-4 transition-shadow ${step === 1 ? "ring-sun/80" : "ring-transparent"}`}>
            {typed}
            {step === 1 && <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-ink" />}
          </div>
          <div className="mt-4 flex justify-center">
            <span className={`inline-flex h-10 items-center rounded-lg bg-white px-6 text-sm font-bold tracking-wide text-[#0B5E2E] uppercase transition-transform duration-150 ${pressing ? "scale-90" : ""} ${step === 2 ? "ring-4 ring-sun/80" : ""}`}>Verify</span>
          </div>
          <div className={`mx-auto mt-4 max-w-[280px] rounded-xl bg-white/12 p-3 transition-all duration-500 ${showResult ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
            <p className="flex items-center gap-2 text-sm font-semibold"><Icon name="check" size={16} strokeWidth={2.6} /> Product details shown</p>
            <p className="mt-1 text-[12px] text-white/80">Name: Amlodipine 5 mg · Maker: matches your pack</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <ol className="grid gap-2 p-5 md:grid-cols-4">
        {CAPTIONS.map((c, i) => {
          const on = reduce || i === step;
          return (
            <li key={c} className={`flex gap-2.5 rounded-[var(--radius-md)] p-2 text-[14px] leading-snug transition-colors ${on && !reduce ? "bg-primary-soft text-ink" : "text-muted"}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${on ? "bg-primary text-white" : "bg-surface-2"}`}>{i + 1}</span>
              {c}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
