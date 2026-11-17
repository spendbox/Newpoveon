"use client";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui";
import { loadProgress } from "@/lib/storage";

/** "Let's start", or "Carry on" if there's saved progress in this browser. */
export function StartButton() {
  const [resume, setResume] = useState<"none" | "progress" | "finished">("none");
  useEffect(() => {
    const p = loadProgress();
    // Reading browser storage has to happen after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (p) setResume(p.finished ? "finished" : Object.keys(p.answers).length ? "progress" : "none");
  }, []);
  return (
    <div className="flex flex-col gap-3">
      <ButtonLink href="/check" iconRight="arrowRight" className="w-full">
        {resume === "progress" ? "Carry on where I left off" : "Let's start"}
      </ButtonLink>
      {resume === "finished" && (
        <ButtonLink href="/results" variant="secondary" className="w-full">See my last results</ButtonLink>
      )}
    </div>
  );
}
