"use client";
import { useEffect, useState } from "react";
import { AnswerTile } from "./client";
import { Icon } from "./icons";
import { Button, ButtonLink, Field, inputCls, Notice } from "./ui";
import { loadSaved } from "@/lib/storage";
import { whatsappLink } from "@/lib/whatsapp";

type Test = { id: string; code: string; name: string; description: string | null; price_naira: number | null; is_bundle: boolean; includes: string[] };

export function RequestForm({ kind, tests, preselect }: { kind: "home_test" | "medication"; tests: Test[]; preselect: string | null }) {
  const [testId, setTestId] = useState<string | null>(tests.find((t) => t.code === preselect)?.id ?? null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [when, setWhen] = useState("");
  const [medicines, setMedicines] = useState("");
  const [rx, setRx] = useState<"yes" | "no" | "unsure" | null>(null);
  const [consultRef, setConsultRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSaved();
    /* eslint-disable react-hooks/set-state-in-effect -- prefill from this browser */
    if (s) {
      setEmail(s.email);
      if (s.phone) setPhone(s.phone);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const needsConsult = kind === "medication" && (rx === "yes" || rx === "unsure") && consultRef.trim().length < 4;
  const ready =
    name.trim().length > 1 && phone.trim().length > 6 && address.trim().length > 5 &&
    (kind === "home_test" ? !!testId || tests.length === 0 : medicines.trim().length > 2 && rx !== null && !needsConsult);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    const r = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, testId, name, phone, email: email || null, address, preferredTime: when, medicines, prescription: rx, consultReference: consultRef }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (r?.ok) setDone(true);
    else setError(d.error ?? "Something went wrong. Please try again.");
  }

  const wa = whatsappLink(kind === "home_test" ? "Hello, I've just requested a home test." : "Hello, I've just requested a medication delivery.");
  if (done) {
    return (
      <div className="mt-6 flex flex-col gap-3">
        <Notice tone="good">Thank you, {name.split(" ")[0]}! We&apos;ve got your request and will contact you on {phone} soon.</Notice>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-[var(--radius-md)] border-[2.5px] border-ink bg-[#25D366] text-[19px] font-extrabold btn-press">
            <Icon name="whatsapp" size={24} /> Chat on WhatsApp
          </a>
        )}
        <ButtonLink href="/" variant="secondary">Back to home</ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
      {kind === "home_test" && (
        <fieldset>
          <legend className="text-lg font-extrabold">Choose a test</legend>
          {tests.length === 0 ? (
            <p className="mt-2 text-sm font-bold text-muted">Our test list is being updated. Tell us what you need below and we&apos;ll call you.</p>
          ) : (
            <div className="mt-2 flex flex-col gap-2.5" role="radiogroup" aria-label="Test">
              {tests.map((t) => (
                <AnswerTile key={t.id} layout="rows" icon={t.is_bundle ? "sparkle" : "flask"} selected={testId === t.id} onClick={() => setTestId(t.id)}
                  label={`${t.name} · ${t.price_naira != null ? `₦${t.price_naira.toLocaleString("en-NG")}` : "price confirmed when we call"}${t.includes.length ? ` (${t.includes.join(", ")})` : ""}`} />
              ))}
            </div>
          )}
        </fieldset>
      )}

      {kind === "medication" && (
        <>
          <Field id="r-meds" label="Which medicines do you need?" hint="Name, strength and how many, if you know.">
            <textarea id="r-meds" rows={3} className={`${inputCls} py-3`} value={medicines} onChange={(e) => setMedicines(e.target.value)} maxLength={1500} />
          </Field>
          <fieldset>
            <legend className="text-sm font-extrabold">Are any of these prescription medicines?</legend>
            <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup">
              {(["yes", "no", "unsure"] as const).map((v) => (
                <AnswerTile key={v} label={v === "yes" ? "Yes" : v === "no" ? "No" : "Not sure"} selected={rx === v} onClick={() => setRx(v)} layout="rows" />
              ))}
            </div>
          </fieldset>
          {(rx === "yes" || rx === "unsure") && (
            <div className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-caution-bg p-4">
              <p className="text-sm font-bold text-caution-text">We can only supply prescription medicines after a consult with one of our doctors.</p>
              <ButtonLink href="/doctor" icon="chat">Book a doctor first</ButtonLink>
              <Field id="r-ref" label="Already had a consult with us? Enter your booking reference">
                <input id="r-ref" className={inputCls} value={consultRef} onChange={(e) => setConsultRef(e.target.value)} placeholder="HC-…" />
              </Field>
            </div>
          )}
        </>
      )}

      <Field id="r-name" label="Your name"><input id="r-name" autoComplete="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field id="r-phone" label="Phone or WhatsApp number"><input id="r-phone" type="tel" autoComplete="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      <Field id="r-email" label="Email (optional)"><input id="r-email" type="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field id="r-addr" label="Address" hint="Include your area and a landmark.">
        <textarea id="r-addr" rows={2} autoComplete="street-address" className={`${inputCls} py-3`} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} />
      </Field>
      <Field id="r-when" label="Preferred day and time" hint="For example: Saturday morning.">
        <input id="r-when" className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} maxLength={120} />
      </Field>
      {error && <Notice tone="warn">{error}</Notice>}
      <Button type="submit" disabled={!ready || busy} iconRight="arrowRight">{busy ? "Sending…" : "Send my request"}</Button>
    </form>
  );
}
