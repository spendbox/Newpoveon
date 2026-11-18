"use client";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui";
import { loadProgress } from "@/lib/storage";

/** "Start my free check", or "Carry on" if there's saved progress in this browser. */
export function StartButton({ compact = false }: { compact?: boolean }) {
  const [resume, setResume] = useState<"none" | "progress" | "finished">("none");
  useEffect(() => {
    const p = loadProgress();
    // Reading browser storage has to happen after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (p) setResume(p.finished ? "finished" : Object.keys(p.answers).length ? "progress" : "none");
  }, []);
  return (
    <div className={`flex gap-3 ${compact ? "flex-col" : "flex-col sm:flex-row"}`}>
      <ButtonLink href="/check" iconRight="arrowRight" className="flex-1">
        {resume === "progress" ? "Carry on" : "Start my free check"}
      </ButtonLink>
      {resume === "finished" && !compact && (
        <ButtonLink href="/results" variant="secondary" className="flex-1">My last results</ButtonLink>
      )}
    </div>
  );
}
