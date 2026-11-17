"use client";
import { useEffect, useMemo, useState } from "react";
import { site } from "@/config/site";
import { Icon } from "@/components/icons";
import { Button, Field, inputCls, Notice } from "@/components/ui";
import { loadSaved } from "@/lib/storage";
import { whatsappLink } from "@/lib/whatsapp";

type Slot = { id: string; starts_at: string; duration_min: number };
const dayFmt = new Intl.DateTimeFormat("en-NG", { weekday: "short", day: "numeric", month: "short", timeZone: site.timeZone });
const timeFmt = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", timeZone: site.timeZone });

export function BookingForm({ defaultReason }: { defaultReason: string }) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState(defaultReason);
  const [day, setDay] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [callMe, setCallMe] = useState(false);
  const [share, setShare] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<ReturnType<typeof loadSaved>>(null);

  useEffect(() => {
    const s = loadSaved();
    /* eslint-disable react-hooks/set-state-in-effect -- prefill from this browser */
    setSaved(s);
    if (s) {
      setEmail(s.email);
      if (s.phone) setPhone(s.phone);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/api/slots")
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.slots ?? []);
        setConfigured(d.configured !== false);
      })
      .catch(() => setSlots([]));
  }, []);

  const byDay = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots ?? []) {
      const k = dayFmt.format(new Date(s.starts_at));
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [slots]);
  const days = [...byDay.keys()];
  const activeDay = day ?? days[0] ?? null;

  const ready = name.trim().length > 1 && phone.trim().length > 6 && /\S+@\S+\.\S+/.test(email) && reason.trim().length > 2 && (slotId || callMe || (slots && slots.length === 0));
  const wa = whatsappLink("Hello, I'd like to book a doctor consult.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, phone, email, reason, slotId: callMe ? null : slotId, shareResults: share, screeningId: saved?.screeningId, ownerToken: saved?.ownerToken }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && d.authorizationUrl) {
      window.location.href = d.authorizationUrl; // Paystack's secure payment page
      return;
    }
    setBusy(false);
    setError(d.error || "Something went wrong. Please try again.");
    if (res?.status === 409) {
      setSlotId(null);
      fetch("/api/slots").then((r) => r.json()).then((x) => setSlots(x.slots ?? []));
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4 rounded-[var(--radius-lg)] bg-surface p-5 md:mt-0" noValidate>
      <h2 className="text-2xl">Book your consult</h2>
      {!configured && (
        <Notice tone="warn">
          Online booking is being set up. {wa ? <a className="underline" href={wa}>Message us on WhatsApp</a> : "Please check back soon"} to book in the meantime.
        </Notice>
      )}
      <Field id="b-name" label="Your name"><input id="b-name" autoComplete="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field id="b-phone" label="Phone number (the doctor will call this)"><input id="b-phone" type="tel" autoComplete="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" /></Field>
      <Field id="b-email" label="Email (for your receipt)"><input id="b-email" type="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field id="b-reason" label="What would you like to talk about?">
        <textarea id="b-reason" rows={3} className={`${inputCls} py-3`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      </Field>

      <fieldset>
        <legend className="text-sm font-extrabold">Preferred date and time</legend>
        {slots === null ? (
          <p className="mt-2 text-sm text-muted">Loading times…</p>
        ) : slots.length === 0 ? (
          <p className="mt-2 text-sm font-bold text-muted">No times are open online right now. Book and we&apos;ll call you to agree a time.</p>
        ) : (
          <>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Day">
              {days.map((d) => (
                <button key={d} type="button" role="tab" aria-selected={d === activeDay} onClick={() => { setDay(d); setSlotId(null); }}
                  className={`min-h-[44px] shrink-0 rounded-full border-[2.5px] px-4 text-sm font-extrabold ${d === activeDay ? "border-ink bg-coral-tint" : "border-border bg-surface"}`}>
                  {d}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Time">
              {(activeDay ? byDay.get(activeDay) ?? [] : []).map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={slotId === s.id} onClick={() => { setSlotId(s.id); setCallMe(false); }}
                  className={`min-h-[48px] rounded-[var(--radius-sm)] border-[2.5px] text-[15px] font-extrabold ${slotId === s.id ? "border-ink bg-coral-tint" : "border-border bg-surface"}`}>
                  {timeFmt.format(new Date(s.starts_at))}
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" className="h-5 w-5 accent-[#1F8A70]" checked={callMe} onChange={(e) => { setCallMe(e.target.checked); if (e.target.checked) setSlotId(null); }} />
              None of these suit me. Call me to agree a time.
            </label>
          </>
        )}
      </fieldset>

      <label className="flex items-start gap-3 rounded-[var(--radius-md)] bg-ground p-4">
        <input type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-[#1F8A70]" checked={share} onChange={(e) => setShare(e.target.checked)} />
        <span className="text-sm font-bold">
          Share my results with the doctor.
          <span className="block text-xs text-muted-soft">{saved ? "Your latest saved results will be attached." : "If you've saved results with us, they'll be attached."}</span>
        </span>
      </label>

      {error && <Notice tone="warn">{error}</Notice>}
      <Button type="submit" disabled={!ready || busy || !configured} icon="chat">
        {busy ? "Opening payment…" : `Pay ₦${site.consultPriceNaira.toLocaleString("en-NG")} and book`}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-muted-soft">
        <Icon name="shield" size={14} /> Secure payment by Paystack. Card, bank transfer or USSD.
      </p>
    </form>
  );
}
