"use client";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { AnswerTile } from "@/components/client";
import { Field, inputCls, Notice } from "@/components/ui";
import { Steps, type Step } from "@/components/steps";
import { loadSaved } from "@/lib/storage";
import { whatsappLink } from "@/lib/whatsapp";

type Type = { id: string; code: string; name: string; description: string | null; grp: string; doctor_type: string; duration_min: number; price_naira: number | null; urgent_check: boolean; credit_to_plan: boolean };
type Slot = { startsAt: string };

const TZ = "Africa/Lagos";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const wk = new Intl.DateTimeFormat("en-NG", { weekday: "short", timeZone: TZ });
const dnum = new Intl.DateTimeFormat("en-NG", { day: "numeric", timeZone: TZ });
const mon = new Intl.DateTimeFormat("en-NG", { month: "short", timeZone: TZ });
const time = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", timeZone: TZ });
const hour = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: TZ });
const longDay = new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
const ngn = (n: number) => `₦${n.toLocaleString("en-NG")}`;

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

export function BookingForm({ types, preselect, defaultReason }: { types: Type[]; preselect: string | null; defaultReason: string }) {
  const [typeId, setTypeId] = useState<string | null>(types.find((t) => t.code === preselect)?.id ?? null);
  const [danger, setDanger] = useState<"yes" | "no" | null>(null);
  const [reason, setReason] = useState(defaultReason);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [day, setDay] = useState<string | null>(null);
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
  const groups = useMemo(() => [...new Set(types.map((t) => t.grp))], [types]);
  const byDay = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots ?? []) {
      const k = dayKey.format(new Date(s.startsAt));
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [slots]);
  const days = [...byDay.keys()];
  const activeDay = day ?? days[0] ?? null;
  const mine = myTz ? new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", timeZone: myTz }) : null;
  const wa = whatsappLink("Hello, I'd like to talk to a doctor.");

  async function submit() {
    if (!type) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ consultTypeId: type.id, startsAt: callMe ? null : startsAt, name, phone, email, reason, shareResults: share, screeningId: saved?.screeningId, ownerToken: saved?.ownerToken }),
    }).catch(() => null);
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

  const steps: Step[] = [
    {
      key: "what", title: "What do you need help with?", valid: !!type,
      content: (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g}>
              <p className="mb-2 text-xs font-semibold tracking-[0.06em] text-subtle uppercase">{g}</p>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label={g}>
                {types.filter((t) => t.grp === g).map((t) => (
                  <AnswerTile key={t.id} layout="rows" label={t.name} selected={typeId === t.id} onClick={() => { setTypeId(t.id); setDanger(null); }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  if (type?.urgent_check) {
    steps.push({
      key: "safety", title: "First, a quick safety check", hint: "Do you have any of these right now?", valid: danger === "no",
      content: (
        <>
          <ul className="grid gap-1.5 rounded-[var(--radius-lg)] bg-surface-2 p-4 text-[15px]">
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
      key: "more", title: "Tell us a little more", hint: "A sentence or two. Only your doctor sees this.", valid: reason.trim().length > 2,
      content: <Field id="b-reason" label="What's going on?"><textarea id="b-reason" rows={4} autoFocus className={`${inputCls} py-3`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="e.g. Fever and headache for 3 days, worse at night" /></Field>,
    },
    {
      key: "match", title: "Here's who you'll see", valid: true,
      content: type && (
        <div className="rounded-[var(--radius-lg)] border border-line p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"><Icon name="stethoscope" size={22} strokeWidth={2} /></span>
            <div className="flex-1">
              <p className="text-lg font-semibold">A {type.doctor_type.toLowerCase()}</p>
              <p className="text-sm text-muted">For: &ldquo;{type.name}&rdquo;</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[var(--radius-md)] bg-surface-2 p-3"><dt className="text-muted">Consult</dt><dd className="font-semibold">About {type.duration_min} minutes</dd></div>
            <div className="rounded-[var(--radius-md)] bg-surface-2 p-3"><dt className="text-muted">Your fee</dt><dd className="font-semibold tabular">{type.price_naira != null ? ngn(type.price_naira) : "—"}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-subtle">By phone or video. If you need tests or medicines, your doctor will arrange them{type.credit_to_plan ? ", and this fee is credited if you join a care plan within 30 days" : ""}.</p>
        </div>
      ),
    },
    {
      key: "time", title: "Pick a time", hint: myTz ? "Times are Nigeria time (WAT). Your local time is shown underneath." : "Times are Nigeria time (WAT).", valid: Boolean(startsAt || callMe || (slots && slots.length === 0)),
      content: slots === null ? (
        <p className="text-sm text-muted">Finding times…</p>
      ) : slots.length === 0 ? (
        <Notice>No times are open online right now. Carry on and we&apos;ll call you to agree a time.</Notice>
      ) : (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Day">
            {days.map((d) => {
              const first = new Date(byDay.get(d)![0].startsAt);
              const on = d === activeDay;
              return (
                <button key={d} type="button" role="tab" aria-selected={on} onClick={() => { setDay(d); setStartsAt(null); }}
                  className={`flex min-w-[64px] shrink-0 flex-col items-center rounded-[var(--radius-md)] border px-3 py-2 transition-colors ${on ? "border-primary bg-primary text-white" : "border-line bg-surface hover:border-line-strong"}`}>
                  <span className={`text-xs ${on ? "text-white/80" : "text-muted"}`}>{wk.format(first)}</span>
                  <span className="font-display text-xl font-semibold tabular">{dnum.format(first)}</span>
                  <span className={`text-[11px] ${on ? "text-white/80" : "text-muted"}`}>{mon.format(first)}</span>
                </button>
              );
            })}
          </div>
          {activeDay && parts(byDay.get(activeDay) ?? []).map((p) => (
            <div key={p.label}>
              <p className="mb-2 text-xs font-semibold tracking-[0.06em] text-subtle uppercase">{p.label}</p>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={`${p.label} times`}>
                {p.items.map((s) => {
                  const on = startsAt === s.startsAt;
                  return (
                    <button key={s.startsAt} type="button" role="radio" aria-checked={on} onClick={() => { setStartsAt(s.startsAt); setCallMe(false); }}
                      className={`flex min-h-[46px] flex-col items-center justify-center rounded-[var(--radius-md)] border text-[15px] font-medium tabular ${on ? "border-primary bg-primary-soft shadow-[0_0_0_1px_var(--color-primary)]" : "border-line bg-surface hover:border-line-strong"}`}>
                      {time.format(new Date(s.startsAt))}
                      {mine && <span className="text-[11px] font-normal text-muted">{mine.format(new Date(s.startsAt))} yours</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
          <dl className="grid gap-2 rounded-[var(--radius-lg)] bg-surface-2 p-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Help with</dt><dd className="text-right font-medium">{type.name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">You&apos;ll see</dt><dd className="text-right font-medium">A {type.doctor_type.toLowerCase()}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">When</dt><dd className="text-right font-medium">{startsAt ? `${longDay.format(new Date(startsAt))}, ${time.format(new Date(startsAt))}` : "We'll call to agree a time"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Fee</dt><dd className="text-right font-semibold tabular">{type.price_naira != null ? ngn(type.price_naira) : "—"}</dd></div>
          </dl>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#136F58]" checked={share} onChange={(e) => setShare(e.target.checked)} />
            <span className="text-sm">Share my HealthCheck results with the doctor.<span className="block text-xs text-subtle">{saved ? "Your latest saved results will be attached." : "If you've saved results with us, they'll be attached."}</span></span>
          </label>
          <p className="flex items-center gap-1.5 text-xs text-subtle"><Icon name="shield" size={14} /> Secure payment by Paystack. Card, bank transfer or USSD.</p>
        </>
      ),
    },
  );

  return <Steps className="mt-6" steps={steps} onSubmit={submit} submitLabel={type?.price_naira != null ? `Pay ${ngn(type.price_naira)} and book` : "Book"} busy={busy} error={error} />;
}
