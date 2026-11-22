"use client";
import { useEffect, useState } from "react";

/**
 * Three questions with the same shape, so every one breaks in the same place on every screen:
 * "How old is / your heart?", each tied to a score we give (heart age, wellbeing, sleep).
 */
const LINES: { top: string; hi: string }[] = [
  { top: "How old is", hi: "heart" },
  { top: "How happy is", hi: "mind" },
  { top: "How rested is", hi: "body" },
];

/**
 * The landing headline: one question at a time, gliding up and swapping every few seconds.
 * Screen readers get one steady sentence; reduced-motion users see the first question, still.
 */
export function RotatingHeadline({ className = "" }: { className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % LINES.length), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <h1 className={className}>
      <span className="sr-only">How old is your heart, how happy is your mind, and how rested is your body? Find out in 10 minutes.</span>
      <span aria-hidden="true" className="relative block h-[2.1em] overflow-hidden">
        <span key={i} className="rh-line block">
          <span className="block whitespace-nowrap">{LINES[i].top}</span>
          <span className="block whitespace-nowrap">your <span className="text-primary">{LINES[i].hi}</span>?</span>
        </span>
      </span>
    </h1>
  );
}
