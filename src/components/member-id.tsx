"use client";
import { useState } from "react";
import { whatsappLink } from "@/lib/whatsapp";
import { Icon } from "./icons";

/**
 * The person's Poveon member ID, with Copy and "Send on WhatsApp". The team uses it to find the right
 * account when someone messages, and to check every lab result goes to the right person.
 */
export function MemberId({ code, compact = false }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const wa = whatsappLink(`Hello, my Poveon ID is ${code}.`);
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the code is on screen to copy by hand */ }
  }
  const btn = "inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold whitespace-nowrap";
  return (
    <section className={`flex flex-col gap-3 rounded-[var(--radius-xl)] border border-line bg-surface sm:flex-row sm:items-center sm:justify-between ${compact ? "p-4" : "p-5"}`} aria-label="Your member ID">
      <div>
        <p className="text-[13px] font-medium text-muted">Your Poveon ID</p>
        <p className="font-mono text-[22px] font-bold tracking-wider text-ink select-all">{code}</p>
        {!compact && <p className="mt-0.5 text-[13px] text-muted">Share it when you message us, so we can find your account and send results to the right place.</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={copy} className={`${btn} border border-line bg-surface hover:bg-surface-2`} aria-live="polite">
          <Icon name={copied ? "check" : "clipboard"} size={16} strokeWidth={2.2} />{copied ? "Copied" : "Copy"}
        </button>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#1FA855] text-white hover:bg-[#178F47]`}>
            <Icon name="whatsapp" size={16} strokeWidth={2} />Send on WhatsApp
          </a>
        )}
      </div>
    </section>
  );
}
