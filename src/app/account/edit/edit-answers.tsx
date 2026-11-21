"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnswerTile } from "@/components/client";
import { Button, inputCls, Notice } from "@/components/ui";
import { SupportScreen } from "@/components/support-screen";
import { DobInput, formatDob } from "@/components/dob-input";
import { type Answers, type AnswerValue, type BpValue, type Question, isComplete, pruneAnswers, visibleQuestions } from "@/lib/questions";

function display(q: Question, v: AnswerValue | undefined): string {
  if (v === undefined) return "Not answered yet";
  if (q.kind === "choice") return q.options.find((o) => o.value === v)?.label ?? String(v);
  if (q.kind === "multi") return (v as string[]).map((x) => q.options.find((o) => o.value === x)?.label ?? x).join(", ");
  if (q.kind === "bp") return `${(v as BpValue).sbp}/${(v as BpValue).dbp} mmHg`;
  if (q.kind === "dob") return formatDob(v as string);
  return v === "unknown" ? q.skipLabel ?? "Unknown" : `${v} ${q.unit}`;
}

export function EditAnswers({ initial }: { initial: Answers }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [support, setSupport] = useState(false);
  const list = useMemo(() => visibleQuestions(answers), [answers]);
  const complete = isComplete(answers);
  const topics = [...new Set(list.map((q) => q.topic))];

  function set(id: string, v: AnswerValue | undefined) {
    const a = { ...answers };
    if (v === undefined) delete a[id];
    else a[id] = v;
    setAnswers(pruneAnswers(a));
    // Same safety rule as the questionnaire.
    if (id === "phq9" && v !== undefined && v !== "0") setSupport(true);
  }

  async function save() {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/account/answers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers }) }).catch(() => null);
    if (r?.ok) {
      router.push("/account");
      router.refresh();
    } else {
      setBusy(false);
      setError((await r?.json().catch(() => null))?.error ?? "Couldn't save. Please try again.");
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6 pb-10">
      {support && <SupportScreen onClose={() => setSupport(false)} />}
      {topics.map((t) => (
        <section key={t} aria-labelledby={`t-${t}`}>
          <h2 id={`t-${t}`} className="text-xl">{t}</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {list.filter((q) => q.topic === t).map((q) => (
              <li key={q.id} className="rounded-[var(--radius-md)] border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted">{q.title}</p>
                    <p className={`font-semibold ${answers[q.id] === undefined ? "text-check-text" : ""}`}>{display(q, answers[q.id])}</p>
                  </div>
                  <button type="button" onClick={() => setOpen(open === q.id ? null : q.id)} className="min-h-[44px] shrink-0 rounded-full bg-ground px-4 text-sm font-semibold" aria-expanded={open === q.id}>
                    {open === q.id ? "Done" : "Change"}
                  </button>
                </div>
                {open === q.id && <div className="mt-3"><Editor q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} /></div>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!complete && <Notice tone="warn">A few new questions need an answer (shown above) before we can recalculate.</Notice>}
      {error && <Notice tone="warn">{error}</Notice>}
      <Button disabled={!complete || busy} onClick={save} iconRight="arrowRight">{busy ? "Recalculating…" : "Recalculate my scores"}</Button>
    </div>
  );
}

function Editor({ q, value, onChange }: { q: Question; value: AnswerValue | undefined; onChange: (v: AnswerValue | undefined) => void }) {
  const [text, setText] = useState(typeof value === "number" ? String(value) : "");
  const [bp, setBp] = useState(value && typeof value === "object" && !Array.isArray(value) ? value : { sbp: 0, dbp: 0 });
  if (q.kind === "choice") {
    return (
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={q.title}>
        {q.options.map((o) => <AnswerTile key={o.value} layout="rows" label={o.label} icon={o.icon} selected={value === o.value} onClick={() => onChange(o.value)} />)}
      </div>
    );
  }
  if (q.kind === "multi") {
    const cur = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-col gap-2" role="group" aria-label={q.title}>
        {q.options.map((o) => {
          const on = cur.includes(o.value);
          return <AnswerTile key={o.value} multi layout="rows" label={o.label} icon={o.icon} selected={on} onClick={() => {
            const next = o.value === q.noneValue ? (on ? [] : [o.value]) : on ? cur.filter((x) => x !== o.value) : [...cur.filter((x) => x !== q.noneValue), o.value];
            onChange(next.length ? next : undefined);
          }} />;
        })}
      </div>
    );
  }
  if (q.kind === "dob") return <DobInput idPrefix={`e-${q.id}`} value={typeof value === "string" ? value : undefined} minAge={q.minAge} maxAge={q.maxAge} onChange={onChange} />;
  if (q.kind === "bp") {
    const commit = (n: BpValue) => {
      setBp(n);
      onChange(n.sbp >= 70 && n.sbp <= 260 && n.dbp >= 40 && n.dbp <= 160 && n.sbp > n.dbp ? n : undefined);
    };
    return (
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`e-sbp`}>Top number</label>
        <input id="e-sbp" inputMode="numeric" className={inputCls} placeholder="120" defaultValue={bp.sbp || ""} onChange={(e) => commit({ ...bp, sbp: Number(e.target.value) })} />
        <span className="font-semibold">/</span>
        <label className="sr-only" htmlFor={`e-dbp`}>Bottom number</label>
        <input id="e-dbp" inputMode="numeric" className={inputCls} placeholder="80" defaultValue={bp.dbp || ""} onChange={(e) => commit({ ...bp, dbp: Number(e.target.value) })} />
        <span className="text-sm font-semibold">mmHg</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`e-${q.id}`}>{q.title}</label>
        <input id={`e-${q.id}`} inputMode="decimal" className={inputCls} value={text} placeholder={q.placeholder} onChange={(e) => {
          setText(e.target.value);
          const v = Number(e.target.value);
          onChange(e.target.value !== "" && v >= q.min && v <= q.max ? v : undefined);
        }} />
        <span className="font-semibold">{q.unit}</span>
      </div>
      {q.skipLabel && <AnswerTile multi layout="rows" label={q.skipLabel} selected={value === "unknown"} onClick={() => { setText(""); onChange(value === "unknown" ? undefined : "unknown"); }} />}
    </div>
  );
}
