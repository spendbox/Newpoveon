"use client";
import { useEffect, useMemo, useState } from "react";
import { site } from "@/config/site";
import { Icon } from "@/components/icons";
import { Field, inputCls, Notice } from "@/components/ui";
import { Steps, type Step } from "@/components/steps";
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

  const timeChosen = Boolean(slotId || callMe || (slots && slots.length === 0));
  const wa = whatsappLink("Hello, I'd like to book a doctor consult.");
  const chosen = slots?.find((x) => x.id === slotId);
  const price = `₦${site.consultPriceNaira.toLocaleString("en-NG")}`;

  async function submit() {
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

  if (!configured) {
    return (
      <div className="mt-6 md:mt-0">
        <Notice tone="warn">Online booking is being set up. {wa ? <a className="underline" href={wa}>Message us on WhatsApp</a> : "Please check back soon"} to book in the meantime.</Notice>
      </div>
    );
  }

  const steps: Step[] = [
    {
      key: "reason", title: "What would you like to talk about?", hint: "A sentence or two is enough. Only the doctor sees this.", valid: reason.trim().length > 2,
      content: <Field id="b-reason" label="Reason"><textarea id="b-reason" rows={4} className={`${inputCls} py-3`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="e.g. My blood pressure was high at a pharmacy" /></Field>,
    },
    {
      key: "time", title: "When suits you?", hint: "Times are Lagos time.", valid: timeChosen,
      content: slots === null ? (
        <p className="text-sm text-muted">Loading times…</p>
      ) : slots.length === 0 ? (
        <Notice>No times are open online right now. Carry on and we&apos;ll call you to agree a time.</Notice>
      ) : (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Day">
            {days.map((d) => (
              <button key={d} type="button" role="tab" aria-selected={d === activeDay} onClick={() => { setDay(d); setSlotId(null); }}
                className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-medium ${d === activeDay ? "border-ink bg-ink text-white" : "border-line bg-surface"}`}>
                {d}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Time">
            {(activeDay ? byDay.get(activeDay) ?? [] : []).map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={slotId === x.id} onClick={() => { setSlotId(x.id); setCallMe(false); }}
                className={`min-h-[46px] rounded-[var(--radius-md)] border text-[15px] font-medium ${slotId === x.id ? "border-primary bg-primary-soft shadow-[0_0_0_1px_var(--color-primary)]" : "border-line bg-surface hover:border-line-strong"}`}>
                {timeFmt.format(new Date(x.starts_at))}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-[#136F58]" checked={callMe} onChange={(e) => { setCallMe(e.target.checked); if (e.target.checked) setSlotId(null); }} />
            None of these suit me. Call me to agree a time.
          </label>
        </>
      ),
    },
    {
      key: "you", title: "Your details", hint: "The doctor will call the number you give.", valid: name.trim().length > 1 && phone.trim().length > 6 && /\S+@\S+\.\S+/.test(email),
      content: (
        <>
          <Field id="b-name" label="Your name"><input id="b-name" autoComplete="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field id="b-phone" label="Phone number"><input id="b-phone" type="tel" autoComplete="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" /></Field>
          <Field id="b-email" label="Email (for your receipt)"><input id="b-email" type="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        </>
      ),
    },
    {
      key: "pay", title: "Check and pay", valid: true,
      content: (
        <>
          <dl className="grid gap-2 rounded-[var(--radius-lg)] bg-surface-2 p-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">When</dt><dd className="text-right font-medium">{chosen ? `${dayFmt.format(new Date(chosen.starts_at))}, ${timeFmt.format(new Date(chosen.starts_at))}` : "We'll call to agree a time"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Doctor calls</dt><dd className="text-right font-medium">{phone}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Price</dt><dd className="text-right font-medium">{price}</dd></div>
          </dl>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#136F58]" checked={share} onChange={(e) => setShare(e.target.checked)} />
            <span className="text-sm">Share my results with the doctor.<span className="block text-xs text-subtle">{saved ? "Your latest saved results will be attached." : "If you've saved results with us, they'll be attached."}</span></span>
          </label>
          <p className="flex items-center gap-1.5 text-xs text-subtle"><Icon name="shield" size={14} /> Secure payment by Paystack. Card, bank transfer or USSD.</p>
        </>
      ),
    },
  ];

  return (
    <div className="mt-6 md:mt-0">
      <Steps steps={steps} onSubmit={submit} submitLabel={busy ? "Opening payment…" : `Pay ${price} and book`} busy={busy} error={error} />
    </div>
  );
}
