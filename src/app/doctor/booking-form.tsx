"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { AnswerTile } from "@/components/client";
import { Field, inputCls, Notice } from "@/components/ui";
import { Steps, type Step } from "@/components/steps";
import { VoiceNote } from "@/components/voice-note";
import { loadSaved } from "@/lib/storage";
import { whatsappLink } from "@/lib/whatsapp";

type Type = { id: string; code: string; name: string; description: string | null; grp: string; doctor_type: string; duration_min: number; price_naira: number | null; urgent_check: boolean; credit_to_plan: boolean };
type Slot = { startsAt: string };

const TZ = "Africa/Lagos";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const time = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", timeZone: TZ });
const clock = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: TZ });
const hour = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: TZ });
const longDay = new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
const shortDay = new Intl.DateTimeFormat("en-NG", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const monthTitle = new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric", timeZone: "UTC" });
const ngn = (n: number) => `₦${n.toLocaleString("en-NG")}`;
/** "YYYY-MM-DD" → a Date at noon UTC on that calendar day (for labels only). */
const keyDate = (k: string) => new Date(`${k}T12:00:00Z`);
const addDays = (k: string, n: number) => new Date(keyDate(k).getTime() + n * 86400000).toISOString().slice(0, 10);

const DANGER = [
  "Chest pain or pressure",
  "Trouble breathing",
  "Fainting, a fit, or very drowsy",
  "Weakness on one side, face drooping or trouble speaking",
  "Very heavy bleeding",
  "A sudden, severe headache",
  "Pregnant with bleeding, a bad headache or the baby moving less",
  "Thoughts of harming yourself",
];

/** Live clock, updated every second. */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the clock after mount
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function BookingForm({ types, preselect, defaultReason }: { types: Type[]; preselect: string | null; defaultReason: string }) {
  const router = useRouter();
  const [typeId, setTypeId] = useState<string | null>(types.find((t) => t.code === preselect)?.id ?? null);
  const [danger, setDanger] = useState<"yes" | "no" | null>(null);
  const [reason, setReason] = useState(defaultReason);
  const [other, setOther] = useState("");
  const [voice, setVoice] = useState<Blob | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [calMonth, setCalMonth] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [callMe, setCallMe] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [share, setShare] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<ReturnType<typeof loadSaved>>(null);
  const [myTz, setMyTz] = useState<string | null>(null);
  const now = useNow();

  useEffect(() => {
    const s = loadSaved();
    /* eslint-disable react-hooks/set-state-in-effect -- prefill from this browser */
    setSaved(s);
    if (s) {
      setEmail(s.email);
      if (s.phone) setPhone(s.phone);
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== TZ && new Date().toLocaleString("en-GB", { timeZone: tz }) !== new Date().toLocaleString("en-GB", { timeZone: TZ })) setMyTz(tz);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/api/slots").then((r) => r.json()).then((d) => setSlots(d.slots ?? [])).catch(() => setSlots([]));
  }, []);

  const type = types.find((t) => t.id === typeId) ?? null;
  const isOther = type?.code === "something-else";
  const typeLabel = isOther && other.trim() ? other.trim() : type?.name ?? "";
  const groups = useMemo(() => [...new Set(types.map((t) => t.grp))], [types]);
  const byDay = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots ?? []) {
      const k = dayKey.format(new Date(s.startsAt));
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [slots]);
  const days = [...byDay.keys()].sort();
  const today = now ? dayKey.format(now) : days[0] ?? null;
  const tomorrow = today ? addDays(today, 1) : null;
  const activeDay = day ?? (today && byDay.has(today) ? today : days[0] ?? null);
  const mine = myTz ? new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", timeZone: myTz }) : null;
  const wa = whatsappLink("Hello, I'd like to talk to a doctor.");

  async function submit() {
    if (!type) return;
    setBusy(true);
    setError(null);
    const data = { consultTypeId: type.id, otherTopic: isOther ? other.trim() : undefined, startsAt: callMe ? null : startsAt, name, phone, email, reason, shareResults: share, screeningId: saved?.screeningId, ownerToken: saved?.ownerToken };
    const form = new FormData();
    form.set("data", JSON.stringify(data));
    if (voice) form.set("voice", voice, `voice.${voice.type.includes("mp4") ? "m4a" : voice.type.includes("ogg") ? "ogg" : "webm"}`);
    const res = await fetch("/api/bookings", { method: "POST", body: form }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && d.authorizationUrl) {
      window.location.assign(d.authorizationUrl); // Paystack's secure payment page
      return;
    }
    setBusy(false);
    setError(d.error || "Something went wrong. Please try again.");
    if (res?.status === 409) {
      setStartsAt(null);
      fetch("/api/slots").then((r) => r.json()).then((x) => setSlots(x.slots ?? []));
    }
  }

  if (types.length === 0) {
    return (
      <div className="mt-6">
        <Notice tone="warn">Online booking is being set up. {wa ? <a className="underline" href={wa}>Message us on WhatsApp</a> : "Please check back soon"} and we&apos;ll help you straight away.</Notice>
      </div>
    );
  }

  const parts = (list: Slot[]) => [
    { label: "Morning", items: list.filter((s) => Number(hour.format(new Date(s.startsAt))) < 12) },
    { label: "Afternoon", items: list.filter((s) => { const h = Number(hour.format(new Date(s.startsAt))); return h >= 12 && h < 17; }) },
    { label: "Evening", items: list.filter((s) => Number(hour.format(new Date(s.startsAt))) >= 17) },
  ].filter((p) => p.items.length);

  const pickDay = (k: string) => { setDay(k); setStartsAt(null); setCallMe(false); };
  const quick = (k: string | null, label: string) => {
    if (!k) return null;
    const has = byDay.has(k);
    const on = activeDay === k && !showCal;
    return (
      <button type="button" disabled={!has} aria-pressed={on} onClick={() => { pickDay(k); setShowCal(false); }}
        className={`flex min-h-[64px] flex-1 flex-col items-center justify-center rounded-[var(--radius-lg)] border px-3 transition-colors disabled:opacity-45 ${on ? "border-primary bg-primary text-white" : "border-line bg-surface hover:border-line-strong"}`}>
        <span className="font-semibold">{label}</span>
        <span className={`text-xs ${on ? "text-white/80" : "text-muted"}`}>{has ? shortDay.format(keyDate(k)) : "Fully booked"}</span>
      </button>
    );
  };

  // Month calendar for "Choose a date"
  const month = calMonth ?? (activeDay ?? today ?? "").slice(0, 7);
  const cal = (() => {
    if (!month) return [];
    const first = `${month}-01`;
    const lead = (keyDate(first).getUTCDay() + 6) % 7; // Monday first
    const len = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: len }, (_, i) => addDays(first, i))];
  })();
  const monthShift = (n: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    setCalMonth(d.toISOString().slice(0, 7));
  };
  const firstMonth = (days[0] ?? today ?? "").slice(0, 7);
  const lastMonth = (days.at(-1) ?? today ?? "").slice(0, 7);

  const steps: Step[] = [
    {
      key: "what", title: "What can we help you with?", hint: "We'll match you with the right doctor for your concern and show you the fee before you pay.", valid: !!type && (!isOther || other.trim().length >= 3),
      content: (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g}>
              <p className="mb-2 text-xs font-semibold tracking-[0.06em] text-subtle uppercase">{g === "Something else" ? "Not on the list?" : g}</p>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label={g}>
                {types.filter((t) => t.grp === g).map((t) => (
                  <AnswerTile key={t.id} layout="rows" label={t.name} selected={typeId === t.id} onClick={() => { setTypeId(t.id); setDanger(null); }} />
                ))}
              </div>
            </div>
          ))}
          {isOther && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="other-topic" className="text-sm font-semibold">What do you need help with?</label>
              <input id="other-topic" autoFocus maxLength={80} value={other} onChange={(e) => setOther(e.target.value)} placeholder="e.g. A lump on my neck, or my child's cough" className={inputCls} />
              <p className="text-xs text-subtle">A few words is enough. You can explain more in the next step.</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (type?.urgent_check) {
    steps.push({
      key: "safety", title: "First, a quick safety check", hint: "Do you have any of these right now?", valid: danger === "no",
      content: (
        <>
          <ul className="grid gap-2 rounded-[var(--radius-lg)] bg-surface-2 p-4 text-[15px]">
            {DANGER.map((d) => <li key={d} className="flex gap-2"><Icon name="alert" size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-act-text" />{d}</li>)}
          </ul>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Any of these now?">
            <AnswerTile layout="rows" label="Yes, one of these" selected={danger === "yes"} onClick={() => setDanger("yes")} />
            <AnswerTile layout="rows" label="No, none of these" selected={danger === "no"} onClick={() => setDanger("no")} />
          </div>
          {danger === "yes" && (
            <div className="rounded-[var(--radius-lg)] bg-act-bg p-4 text-act-text" role="alert">
              <p className="font-semibold">Please get urgent help now. Don&apos;t wait for a booked consult.</p>
              <p className="mt-1 text-sm">Call <a href="tel:112" className="font-semibold underline">112</a> or go to the nearest hospital emergency department. If you&apos;re having thoughts of harming yourself, please tell someone you trust and call 112.</p>
            </div>
          )}
        </>
      ),
    });
  }

  steps.push(
    {
      key: "more", title: "Tell us a little more", hint: "Record a voice note or type, whichever is easier. Only your doctor hears or reads it.", valid: reason.trim().length > 2 || !!voice,
      content: (
        <>
          <VoiceNote value={voice} onChange={setVoice} />
          <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.06em] text-subtle uppercase"><span className="h-px flex-1 bg-line" />or type<span className="h-px flex-1 bg-line" /></div>
          <Field id="b-reason" label="What's going on?"><textarea id="b-reason" rows={4} className={`${inputCls} py-3`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="e.g. Fever and headache for 3 days, worse at night" /></Field>
        </>
      ),
    },
    {
      key: "match", title: "Here's who you'll see", valid: true,
      content: type && (
        <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"><Icon name="stethoscope" size={24} strokeWidth={2} /></span>
            <div className="flex-1">
              <p className="text-xl font-semibold">A {type.doctor_type.toLowerCase()}</p>
              <p className="text-sm text-muted">For: &ldquo;{typeLabel}&rdquo;</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[var(--radius-md)] bg-surface-2 p-3"><dt className="text-muted">Consult</dt><dd className="text-base font-semibold">About {type.duration_min} min</dd></div>
            <div className="rounded-[var(--radius-md)] bg-surface-2 p-3"><dt className="text-muted">Your fee</dt><dd className="text-base font-semibold tabular">{type.price_naira != null ? ngn(type.price_naira) : "—"}</dd></div>
          </dl>
          <p className="mt-4 text-sm text-muted">By phone or video. If you need tests or medicines, your doctor will arrange them.</p>
        </div>
      ),
    },
    {
      key: "time", title: "When suits you?", valid: Boolean(startsAt || callMe || (slots && slots.length === 0)),
      content: slots === null ? (
        <p className="text-muted">Finding times…</p>
      ) : slots.length === 0 ? (
        <Notice>No times are open online right now. Carry on and we&apos;ll call you to agree a time.</Notice>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-surface-2 px-4 py-3">
            <div>
              <p className="text-xs text-muted">Time now in Nigeria</p>
              <p className="font-display text-2xl font-semibold tabular" aria-live="off">{now ? clock.format(now) : "…"}</p>
            </div>
            {mine && now && (
              <div className="text-right">
                <p className="text-xs text-muted">Your time</p>
                <p className="font-display text-lg font-semibold tabular">{mine.format(now)}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {quick(today, "Today")}
            {quick(tomorrow, "Tomorrow")}
            <button type="button" aria-expanded={showCal} onClick={() => setShowCal(!showCal)}
              className={`flex min-h-[64px] flex-1 flex-col items-center justify-center rounded-[var(--radius-lg)] border px-3 transition-colors ${showCal || (activeDay && activeDay !== today && activeDay !== tomorrow) ? "border-primary bg-primary-soft" : "border-line bg-surface hover:border-line-strong"}`}>
              <span className="flex items-center gap-1 font-semibold"><Icon name="calendar" size={16} strokeWidth={2} /> Other day</span>
              <span className="text-xs text-muted">{activeDay && activeDay !== today && activeDay !== tomorrow ? shortDay.format(keyDate(activeDay)) : "Pick a date"}</span>
            </button>
          </div>

          {showCal && (
            <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => monthShift(-1)} disabled={month <= firstMonth} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-2 disabled:opacity-30"><Icon name="arrowLeft" size={18} strokeWidth={2} /></button>
                <p className="font-semibold">{monthTitle.format(keyDate(`${month}-01`))}</p>
                <button type="button" onClick={() => monthShift(1)} disabled={month >= lastMonth} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-2 disabled:opacity-30"><Icon name="arrowRight" size={18} strokeWidth={2} /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {cal.map((k, i) => k === null ? <span key={`b${i}`} /> : (
                  <button key={k} type="button" disabled={!byDay.has(k)} onClick={() => { pickDay(k); setShowCal(false); }}
                    aria-label={`${shortDay.format(keyDate(k))}${byDay.has(k) ? "" : ", no times"}`} aria-pressed={activeDay === k}
                    className={`flex aspect-square items-center justify-center rounded-full text-sm tabular transition-colors disabled:text-subtle/40 ${activeDay === k ? "bg-primary font-semibold text-white" : byDay.has(k) ? "font-semibold hover:bg-primary-soft" : ""} ${k === today && activeDay !== k ? "ring-1 ring-primary" : ""}`}>
                    {Number(k.slice(8))}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeDay && !showCal && (
            <>
              <p className="font-semibold">{longDay.format(new Date(byDay.get(activeDay)?.[0]?.startsAt ?? keyDate(activeDay)))}</p>
              {parts(byDay.get(activeDay) ?? []).map((p) => (
                <div key={p.label}>
                  <p className="mb-2 text-xs font-semibold tracking-[0.06em] text-subtle uppercase">{p.label}</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={`${p.label} times`}>
                    {p.items.map((s) => {
                      const on = startsAt === s.startsAt;
                      return (
                        <button key={s.startsAt} type="button" role="radio" aria-checked={on} onClick={() => { setStartsAt(s.startsAt); setCallMe(false); }}
                          className={`flex min-h-[52px] flex-col items-center justify-center rounded-[var(--radius-md)] border text-[15px] font-medium tabular ${on ? "border-primary bg-primary text-white" : "border-line bg-surface hover:border-line-strong"}`}>
                          {time.format(new Date(s.startsAt))}
                          {mine && <span className={`text-[11px] font-normal ${on ? "text-white/80" : "text-muted"}`}>{mine.format(new Date(s.startsAt))} yours</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {startsAt && (
            <p className="flex items-center gap-2 rounded-[var(--radius-md)] bg-primary-soft px-4 py-3 text-sm font-medium text-primary"><Icon name="check" size={16} strokeWidth={2.6} /> {longDay.format(new Date(startsAt))} at {time.format(new Date(startsAt))}</p>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-[#136F58]" checked={callMe} onChange={(e) => { setCallMe(e.target.checked); if (e.target.checked) setStartsAt(null); }} />
            None of these suit me. Call me to agree a time.
          </label>
        </>
      ),
    },
    {
      key: "you", title: "Your details", hint: "Your doctor will call the number you give.", valid: name.trim().length > 1 && phone.trim().length > 6 && /\S+@\S+\.\S+/.test(email),
      content: (
        <>
          <Field id="b-name" label="Your name"><input id="b-name" autoComplete="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field id="b-phone" label="Phone or WhatsApp number"><input id="b-phone" type="tel" autoComplete="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" /></Field>
          <Field id="b-email" label="Email (for your receipt)"><input id="b-email" type="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        </>
      ),
    },
    {
      key: "pay", title: "Check and pay", valid: !!type,
      content: type && (
        <>
          <dl className="grid gap-2.5 rounded-[var(--radius-lg)] bg-surface-2 p-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Help with</dt><dd className="text-right font-medium">{typeLabel}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">You&apos;ll see</dt><dd className="text-right font-medium">A {type.doctor_type.toLowerCase()}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">When</dt><dd className="text-right font-medium">{startsAt ? `${longDay.format(new Date(startsAt))}, ${time.format(new Date(startsAt))}` : "We'll call to agree a time"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Your message</dt><dd className="text-right font-medium">{voice ? "Voice note" : ""}{voice && reason.trim() ? " + text" : reason.trim() ? "Text" : ""}</dd></div>
            <div className="flex justify-between gap-4 border-t border-line pt-2.5"><dt className="text-muted">Fee</dt><dd className="text-right text-base font-semibold tabular">{type.price_naira != null ? ngn(type.price_naira) : "—"}</dd></div>
          </dl>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#136F58]" checked={share} onChange={(e) => setShare(e.target.checked)} />
            <span className="text-sm">Share my Poveon results with the doctor.<span className="block text-xs text-subtle">{saved ? "Your latest saved results will be attached." : "If you've saved results with us, they'll be attached."}</span></span>
          </label>
          <p className="flex items-center gap-1.5 text-xs text-subtle"><Icon name="shield" size={14} /> Secure payment by Paystack. Card, bank transfer or USSD.</p>
        </>
      ),
    },
  );

  return <Steps variant="full" steps={steps} onSubmit={submit} onExit={() => router.push("/")} submitLabel={type?.price_naira != null ? `Pay ${ngn(type.price_naira)} and book` : "Book"} busy={busy} error={error} />;
}
