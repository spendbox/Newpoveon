"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AnswerTile, ProgressWalker } from "@/components/client";
import { IllustrationCard } from "@/components/illustrations";
import { Icon } from "@/components/icons";
import { Button, inputCls } from "@/components/ui";
import { SupportScreen } from "@/components/support-screen";
import { type Answers, type AnswerValue, type BpValue, type Question, pruneAnswers, visibleQuestions } from "@/lib/questions";
import { loadProgress, saveProgress, type Progress } from "@/lib/storage";
import { track } from "@/lib/track";

function cheerFor(i: number, total: number) {
  if (i >= total - 1) return "Last one!";
  const f = i / total;
  if (f < 0.12) return "Easy start";
  if (f < 0.42) return "Nice, keep going";
  if (f < 0.58) return "Halfway there!";
  if (f < 0.85) return "You're doing great";
  return "Almost done";
}

export function Questionnaire() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [dir, setDir] = useState(1);
  const [support, setSupport] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved progress (after first render: browser storage isn't available on the server).
  useEffect(() => {
    const p = loadProgress();
    const now = new Date().toISOString();
    // A finished check re-opens with the old answers filled in, so people can change just one thing.
    // Reading browser storage has to happen after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(p ? (p.finished ? { ...p, finished: false, currentId: null, startedAt: now } : p) : { answers: {}, currentId: null, startedAt: now, finished: false });
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const answers = useMemo(() => progress?.answers ?? {}, [progress]);
  const list = useMemo(() => visibleQuestions(answers), [answers]);
  const index = Math.max(0, progress?.currentId ? list.findIndex((q) => q.id === progress.currentId) : 0);
  const q = list[index];

  function update(next: Partial<Progress>) {
    setProgress((prev) => {
      const merged = { ...(prev as Progress), ...next };
      saveProgress(merged);
      return merged;
    });
  }

  function setAnswer(id: string, v: AnswerValue | undefined) {
    const a: Answers = { ...answers };
    if (v === undefined) delete a[id];
    else a[id] = v;
    if (Object.keys(answers).length === 0) track("started");
    update({ answers: pruneAnswers(a), currentId: id });
  }

  function goTo(i: number, a: Answers = answers) {
    const l = visibleQuestions(a);
    if (i >= l.length) {
      update({ finished: true });
      track("completed");
      router.push("/results");
      return;
    }
    setDir(i > index ? 1 : -1);
    update({ currentId: l[Math.max(0, i)].id });
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function choose(question: Question, value: string) {
    const a = pruneAnswers({ ...answers, [question.id]: value });
    if (Object.keys(answers).length === 0) track("started");
    update({ answers: a, currentId: question.id });
    // SAFETY RULE: PHQ-9 item 9 above "Not at all" → support screen straight away.
    if (question.id === "phq9" && value !== "0") {
      setSupport(true);
      return;
    }
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      const l = visibleQuestions(a);
      const i = l.findIndex((x) => x.id === question.id);
      goTo(i + 1, a);
    }, reduce ? 150 : 420);
  }

  if (!progress || !q) {
    return <div className="mx-auto min-h-[70vh] w-full max-w-[430px]" aria-busy="true" />;
  }

  const value = answers[q.id];
  const answered = value !== undefined && !(Array.isArray(value) && value.length === 0);

  return (
    <div className="mx-auto w-full max-w-[430px] px-6 pt-6 pb-8 md:my-8 md:rounded-[40px] md:bg-ground md:shadow-[0_0_0_2.5px_#0E2A24,0_14px_0_#0E2A24]">
      {support && <SupportScreen onClose={() => { setSupport(false); goTo(index + 1); }} />}
      <div className="flex h-11 items-center justify-between">
        {index === 0 ? (
          <button type="button" onClick={() => router.push("/")} aria-label="Back to start" className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-surface">
            <Icon name="close" size={20} />
          </button>
        ) : (
          <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous question" className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-surface">
            <Icon name="arrowLeft" size={20} />
          </button>
        )}
        <span className="text-[15px] font-extrabold text-muted">
          Question {index + 1} of {list.length}
          <span className="block text-center text-xs text-muted-soft">{q.topic}</span>
        </span>
        <Link href="/doctor" aria-label="Talk to a doctor" className="flex h-11 items-center gap-1.5 rounded-[var(--radius-sm)] bg-surface px-3 text-xs font-extrabold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral"><Icon name="chat" size={14} /></span>Doctor
        </Link>
      </div>

      <ProgressWalker fraction={index / Math.max(1, list.length - 1)} cheer={cheerFor(index, list.length)} />

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.section
          key={q.id}
          custom={dir}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40 * dir, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -30 * dir }}
          transition={{ duration: reduce ? 0.1 : 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          aria-labelledby={`q-${q.id}`}
          className="mt-3"
        >
          <IllustrationCard name={q.illustration} happy={q.id === "smoking" && (value === "never" || value === "former")} />
          {q.help && (q.topic === "Mood" || q.topic === "Worry") && <p className="mt-4 text-[15px] font-bold text-muted">{q.help}</p>}
          <h1 id={`q-${q.id}`} className="mt-3 text-[27px] leading-[30px]">{q.title}</h1>
          {q.help && q.topic !== "Mood" && q.topic !== "Worry" && <p className="mt-2 text-[15px] leading-snug text-muted">{q.help}</p>}

          <div className="mt-4">
            {q.kind === "choice" && (
              <div role="radiogroup" aria-labelledby={`q-${q.id}`} className={q.layout === "rows" || q.options.length > 4 ? "flex flex-col gap-2.5" : `grid gap-3 ${q.options.length === 2 || q.options.length === 4 ? "grid-cols-2" : "grid-cols-3"}`}>
                {q.options.map((o) => (
                  <AnswerTile key={o.value} label={o.label} icon={o.icon} selected={value === o.value} layout={q.layout === "rows" || q.options.length > 4 ? "rows" : "grid"} onClick={() => choose(q, o.value)} />
                ))}
              </div>
            )}

            {q.kind === "multi" && (
              <div role="group" aria-labelledby={`q-${q.id}`} className="flex flex-col gap-2.5">
                {q.options.map((o) => {
                  const cur = Array.isArray(value) ? value : [];
                  const on = cur.includes(o.value);
                  return (
                    <AnswerTile
                      key={o.value} multi layout="rows" label={o.label} icon={o.icon} selected={on}
                      onClick={() => {
                        let nextV: string[];
                        if (o.value === q.noneValue) nextV = on ? [] : [o.value];
                        else nextV = on ? cur.filter((x) => x !== o.value) : [...cur.filter((x) => x !== q.noneValue), o.value];
                        setAnswer(q.id, nextV.length ? nextV : undefined);
                      }}
                    />
                  );
                })}
              </div>
            )}

            {q.kind === "number" && <NumberInput key={q.id} q={q} value={value} onChange={(v) => setAnswer(q.id, v)} />}
            {q.kind === "bp" && <BpInput key={q.id} value={value as BpValue | undefined} onChange={(v) => setAnswer(q.id, v)} />}
          </div>

          {(q.kind !== "choice" || answered) && (
            <Button className="mt-6 w-full" disabled={!answered} onClick={() => goTo(index + 1)} iconRight="arrowRight">
              {index === list.length - 1 ? "See my results" : "Continue"}
            </Button>
          )}
        </motion.section>
      </AnimatePresence>
      <p className="mt-5 text-center text-xs font-bold text-muted-soft">Your answers are saved on this phone as you go.</p>
    </div>
  );
}

function NumberInput({ q, value, onChange }: { q: Extract<Question, { kind: "number" }>; value: AnswerValue | undefined; onChange: (v: AnswerValue | undefined) => void }) {
  const [unit, setUnit] = useState<"cm" | "ft">("cm");
  const [text, setText] = useState(typeof value === "number" ? String(value) : "");
  const [ft, setFt] = useState("");
  const [inch, setInch] = useState("");
  const unknown = value === "unknown";
  const n = Number(text);
  const outOfRange = text !== "" && (!Number.isFinite(n) || n < q.min || n > q.max);

  function commit(raw: string) {
    setText(raw);
    const v = Number(raw);
    onChange(raw !== "" && Number.isFinite(v) && v >= q.min && v <= q.max ? Math.round(v * 10) / 10 : undefined);
  }
  function commitFeet(f: string, i: string) {
    setFt(f);
    setInch(i);
    const cm = (Number(f) * 12 + Number(i || 0)) * 2.54;
    onChange(f !== "" && cm >= q.min && cm <= q.max ? Math.round(cm) : undefined);
  }

  return (
    <div className="flex flex-col gap-3">
      {q.feetInches && (
        <div className="flex gap-2" role="group" aria-label="Units">
          {(["cm", "ft"] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} onClick={() => { setUnit(u); onChange(undefined); setText(""); setFt(""); setInch(""); }}
              className={`min-h-[44px] rounded-full border-[2.5px] px-4 text-sm font-extrabold ${unit === u ? "border-ink bg-coral-tint" : "border-border bg-surface"}`}>
              {u === "cm" ? "Centimetres" : "Feet and inches"}
            </button>
          ))}
        </div>
      )}
      {unit === "cm" || !q.feetInches ? (
        <div className="flex items-center gap-3">
          <label htmlFor={`in-${q.id}`} className="sr-only">{q.title} ({q.unit})</label>
          <input id={`in-${q.id}`} inputMode="decimal" autoComplete="off" className={`${inputCls} font-display text-2xl`} placeholder={q.placeholder} value={unknown ? "" : text} disabled={unknown} onChange={(e) => commit(e.target.value.replace(/[^\d.]/g, ""))} aria-invalid={outOfRange} />
          <span className="text-lg font-extrabold">{q.unit}</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor={`ft-${q.id}`}>Feet</label>
          <input id={`ft-${q.id}`} inputMode="numeric" className={`${inputCls} font-display text-2xl`} placeholder="5" value={ft} onChange={(e) => commitFeet(e.target.value.replace(/\D/g, ""), inch)} />
          <span className="font-extrabold">ft</span>
          <label className="sr-only" htmlFor={`inch-${q.id}`}>Inches</label>
          <input id={`inch-${q.id}`} inputMode="numeric" className={`${inputCls} font-display text-2xl`} placeholder="8" value={inch} onChange={(e) => commitFeet(ft, e.target.value.replace(/\D/g, ""))} />
          <span className="font-extrabold">in</span>
        </div>
      )}
      {outOfRange && <p className="text-sm font-bold text-caution-text" role="alert">Please enter a number between {q.min} and {q.max}.</p>}
      {q.skipLabel && (
        <AnswerTile layout="rows" label={q.skipLabel} icon="question" selected={unknown} multi onClick={() => { setText(""); onChange(unknown ? undefined : "unknown"); }} />
      )}
    </div>
  );
}

function BpInput({ value, onChange }: { value: BpValue | undefined; onChange: (v: BpValue | undefined) => void }) {
  const [s, setS] = useState(value ? String(value.sbp) : "");
  const [d, setD] = useState(value ? String(value.dbp) : "");
  function commit(ns: string, nd: string) {
    setS(ns);
    setD(nd);
    const a = Number(ns), b = Number(nd);
    onChange(ns && nd && a >= 70 && a <= 260 && b >= 40 && b <= 160 && a > b ? { sbp: a, dbp: b } : undefined);
  }
  const bad = s !== "" && d !== "" && !(Number(s) > Number(d) && Number(s) >= 70 && Number(s) <= 260 && Number(d) >= 40 && Number(d) <= 160);
  return (
    <div>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="sbp" className="mb-1 block text-sm font-extrabold">Top number</label>
          <input id="sbp" inputMode="numeric" className={`${inputCls} font-display text-2xl`} placeholder="120" value={s} onChange={(e) => commit(e.target.value.replace(/\D/g, ""), d)} />
        </div>
        <span className="pb-3 font-display text-3xl font-extrabold" aria-hidden="true">/</span>
        <div className="flex-1">
          <label htmlFor="dbp" className="mb-1 block text-sm font-extrabold">Bottom number</label>
          <input id="dbp" inputMode="numeric" className={`${inputCls} font-display text-2xl`} placeholder="80" value={d} onChange={(e) => commit(s, e.target.value.replace(/\D/g, ""))} />
        </div>
        <span className="pb-3 text-sm font-extrabold">mmHg</span>
      </div>
      {bad && <p className="mt-2 text-sm font-bold text-caution-text" role="alert">That reading doesn&apos;t look right. The top number is usually 90–200 and the bottom 50–120.</p>}
    </div>
  );
}
