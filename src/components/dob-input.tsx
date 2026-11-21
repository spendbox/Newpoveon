"use client";
import { useState } from "react";
import { ageFromDob } from "@/lib/questions";
import { inputCls } from "./ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n: string | number) => String(n).padStart(2, "0");

/**
 * Date of birth as three simple boxes (day, month, year): quicker on a phone than scrolling a calendar back decades.
 * Shows the age it works out, so people can check it at a glance.
 */
export function DobInput({ value, onChange, minAge = 18, maxAge = 100, idPrefix = "dob" }: {
  value: string | undefined; onChange: (v: string | undefined) => void; minAge?: number; maxAge?: number; idPrefix?: string;
}) {
  const [y0, m0, d0] = value ? value.split("-") : ["", "", ""];
  const [d, setD] = useState(d0 ? String(Number(d0)) : "");
  const [m, setM] = useState(m0 ? String(Number(m0)) : "");
  const [y, setY] = useState(y0 ?? "");

  const iso = d && m && y.length === 4 ? `${y}-${pad(m)}-${pad(d)}` : null;
  const age = iso ? ageFromDob(iso) : null;
  const problem = iso === null ? null : age === null ? "That date doesn't exist. Please check the day and month." : age < minAge ? `This check is for adults aged ${minAge} and over.` : age > maxAge ? "Please check the year." : null;

  function commit(nd: string, nm: string, ny: string) {
    setD(nd); setM(nm); setY(ny);
    const v = nd && nm && ny.length === 4 ? `${ny}-${pad(nm)}-${pad(nd)}` : null;
    const a = v ? ageFromDob(v) : null;
    onChange(v && a !== null && a >= minAge && a <= maxAge ? v : undefined);
  }

  return (
    <div>
      <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
        <div>
          <label htmlFor={`${idPrefix}-d`} className="mb-1 block text-sm font-semibold">Day</label>
          <input id={`${idPrefix}-d`} inputMode="numeric" autoComplete="bday-day" maxLength={2} placeholder="DD" className={`${inputCls} text-lg tabular`} value={d}
            onChange={(e) => commit(e.target.value.replace(/\D/g, "").slice(0, 2), m, y)} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-m`} className="mb-1 block text-sm font-semibold">Month</label>
          <select id={`${idPrefix}-m`} autoComplete="bday-month" className={`${inputCls} text-lg`} value={m} onChange={(e) => commit(d, e.target.value, y)}>
            <option value="">Month</option>
            {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-y`} className="mb-1 block text-sm font-semibold">Year</label>
          <input id={`${idPrefix}-y`} inputMode="numeric" autoComplete="bday-year" maxLength={4} placeholder="YYYY" className={`${inputCls} text-lg tabular`} value={y}
            onChange={(e) => commit(d, m, e.target.value.replace(/\D/g, "").slice(0, 4))} />
        </div>
      </div>
      <p className="mt-2 min-h-[20px] text-sm font-medium" aria-live="polite">
        {problem ? <span className="text-check-text" role="alert">{problem}</span> : age !== null ? <span className="text-primary">You&apos;re {age}.</span> : null}
      </p>
    </div>
  );
}

/** "12 March 1990 (age 36)" for summaries. */
export function formatDob(v: string): string {
  const [y, m, d] = v.split("-").map(Number);
  const age = ageFromDob(v);
  return `${d} ${MONTHS[m - 1]} ${y}${age !== null ? ` (age ${age})` : ""}`;
}
