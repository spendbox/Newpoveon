"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { labRequestText } from "@/lib/bioage/phenoage";
import { aBtnQuiet } from "../../ui";

/** The tests to request from the lab, with a Copy button for pasting into WhatsApp or email. */
export function LabRequest({ memberCode }: { memberCode?: string | null }) {
  const text = labRequestText(memberCode);
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the text is selectable below */ }
  }
  return (
    <details className="group mb-5 rounded-xl border border-line bg-surface" open={!memberCode}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <span>
          <span className="block font-semibold">Tests to request from the lab</span>
          <span className="block text-sm text-muted">{memberCode ? `Includes ${memberCode}. ` : ""}Copy and paste into WhatsApp or email.</span>
        </span>
        <Icon name="arrowRight" size={16} strokeWidth={2} className="shrink-0 text-subtle transition-transform group-open:rotate-90" />
      </summary>
      <div className="border-t border-line p-4">
        <pre className="max-h-80 overflow-auto rounded-lg bg-ground p-3 font-body text-[13px] leading-relaxed whitespace-pre-wrap select-all">{text}</pre>
        <button type="button" onClick={copy} className={`${aBtnQuiet} mt-3 inline-flex items-center gap-1.5`} aria-live="polite">
          <Icon name={copied ? "check" : "clipboard"} size={16} strokeWidth={2.2} />{copied ? "Copied" : "Copy list"}
        </button>
      </div>
    </details>
  );
}
