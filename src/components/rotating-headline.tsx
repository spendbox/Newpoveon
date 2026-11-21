"use client";
import { useEffect, useState } from "react";

/** Three questions people actually wonder about, each tied to a score we give. */
const LINES: { lead: string; hi: string; tail?: string }[] = [
  { lead: "How old is your ", hi: "heart", tail: "?" },
  { lead: "How are you, ", hi: "really", tail: "?" },
  { lead: "How well do you ", hi: "sleep", tail: "?" },
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
      <span className="sr-only">How old is your heart, how are you really, and how well do you sleep? Find out in 10 minutes.</span>
      <span aria-hidden="true" className="relative block min-h-[2.1em] overflow-hidden">
        <span key={i} className="rh-line block">
          {LINES[i].lead}<span className="text-primary">{LINES[i].hi}</span>{LINES[i].tail}
        </span>
      </span>
    </h1>
  );
}
