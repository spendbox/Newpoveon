"use client";
import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/buttons";
import { checkValues, differenceText, exactAge, MARKER_BY_KEY, MARKERS, phenoAge, toBase, type MarkerKey, type Values } from "@/lib/bioage/phenoage";
import { saveBioAge } from "./actions";
import { aBtn, aInput } from "../../ui";

type Typed = Record<MarkerKey, { value: string; unit: string }>;

/** Type the nine results as they appear on the lab report, pick each unit, and see the age as you go. */
export function BioAgeForm({ userId, defaultDob, today }: { userId: string; defaultDob: string; today: string }) {
  const [dob, setDob] = useState(defaultDob);
  const [sample, setSample] = useState(today);
  const [typed, setTyped] = useState<Typed>(() => Object.fromEntries(MARKERS.map((m) => [m.key, { value: "", unit: m.units[0].label }])) as Typed);

  const preview = useMemo(() => {
    const values = {} as Values;
    for (const m of MARKERS) {
      const raw = typed[m.key].value.replace(",", ".");
      values[m.key] = raw === "" ? NaN : toBase(m.key, Number(raw), typed[m.key].unit);
    }
    const problems = checkValues(values);
    const age = exactAge(dob, sample);
    if (problems.length || age === null) return { problems, age, result: null };
    return { problems, age, result: phenoAge(age, values) };
  }, [typed, dob, sample]);

  const bad = new Map(preview.problems.filter((p) => typed[p.key].value !== "").map((p) => [p.key, p.problem]));
  const set = (k: MarkerKey, patch: Partial<Typed[MarkerKey]>) => setTyped((t) => ({ ...t, [k]: { ...t[k], ...patch } }));

  return (
    <form action={saveBioAge} className="flex flex-col gap-5">
      <input type="hidden" name="user_id" value={userId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Date sample was taken
          <input type="date" name="sample_date" value={sample} max={today} onChange={(e) => setSample(e.target.value)} className={`${aInput} mt-1`} required />
        </label>
        <label className="text-sm font-semibold">Date of birth
          <input type="date" name="dob" value={dob} max={today} onChange={(e) => setDob(e.target.value)} className={`${aInput} mt-1`} required />
          <span className="mt-1 block text-xs font-normal text-muted">{defaultDob ? "From their health check. Check it against the lab form." : "Not in their health check. Ask them or use the lab form."}</span>
        </label>
        <label className="text-sm font-semibold">Lab name
          <input name="lab_name" className={`${aInput} mt-1`} placeholder="e.g. Synlab Yaba" maxLength={120} />
        </label>
        <label className="text-sm font-semibold">Lab reference
          <input name="lab_ref" className={`${aInput} mt-1`} placeholder="Number on the report" maxLength={120} />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Results, as printed on the report</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {MARKERS.map((m) => (
            <div key={m.key} className={`rounded-lg border p-3 ${bad.has(m.key) ? "border-act-text bg-act-bg" : "border-line bg-surface"}`}>
              <label htmlFor={`m-${m.key}`} className="block text-sm font-semibold">{m.name}</label>
              <p className="text-xs text-muted">{m.from}</p>
              <div className="mt-2 flex gap-2">
                <input id={`m-${m.key}`} name={m.key} inputMode="decimal" autoComplete="off" value={typed[m.key].value}
                  onChange={(e) => set(m.key, { value: e.target.value })} className={`${aInput} min-w-0 flex-1`} required aria-invalid={bad.has(m.key) || undefined} />
                {m.units.length > 1 ? (
                  <select name={`${m.key}_unit`} value={typed[m.key].unit} onChange={(e) => set(m.key, { unit: e.target.value })} className={`${aInput.replace("w-full", "")} w-28 shrink-0`} aria-label={`${m.name} unit`}>
                    {m.units.map((u) => <option key={u.label}>{u.label}</option>)}
                  </select>
                ) : (
                  <span className="flex w-28 shrink-0 items-center px-1 text-sm font-semibold text-muted"><input type="hidden" name={`${m.key}_unit`} value={m.units[0].label} />{m.units[0].label}</span>
                )}
              </div>
              {bad.has(m.key) && <p className="mt-1 text-xs font-medium text-act-text">{bad.get(m.key)}</p>}
            </div>
          ))}
        </div>
      </fieldset>

      <label className="text-sm font-semibold">Note for the person (optional)
        <textarea name="notes" rows={2} maxLength={1000} className={`${aInput} mt-1 py-2`} placeholder="e.g. Your CRP was a little high. Please repeat in 3 months, when you're well." />
      </label>

      <div className="rounded-xl bg-ink p-5 text-white" aria-live="polite">
        {preview.result ? (
          <>
            <p className="text-sm text-white/70">Biological age (preview)</p>
            <p className="font-display text-4xl font-bold">{preview.result.phenoAge.toFixed(1)}</p>
            <p className="text-sm text-white/80">Real age {preview.age!.toFixed(1)} · {differenceText(preview.result.difference)}</p>
            <p className="mt-2 text-xs text-white/60">Biggest effects: {preview.result.drivers.slice(0, 3).map((d) => `${MARKER_BY_KEY[d.key].name} ${d.years > 0 ? "+" : "−"}${Math.abs(d.years).toFixed(1)}y`).join(" · ")}</p>
          </>
        ) : (
          <p className="text-sm text-white/75">The age appears here once the dates and all nine results are filled in.</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="send_email" defaultChecked className="h-4 w-4" /> Email the result to them now</label>
      <SubmitButton className={`${aBtn} self-start`} disabled={!preview.result}>Save result</SubmitButton>
      <p className="-mt-3 text-xs text-muted">Saved with your admin email, so every result can be traced.</p>
    </form>
  );
}
