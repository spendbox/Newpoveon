"use client";
import { useEffect, useState } from "react";
import { AnswerTile } from "./client";
import { Icon } from "./icons";
import { ButtonLink, Field, inputCls, Notice } from "./ui";
import { Steps, type Step } from "./steps";
import { loadSaved } from "@/lib/storage";
import { whatsappLink } from "@/lib/whatsapp";

type Test = { id: string; code: string; name: string; description: string | null; price_naira: number | null; is_bundle: boolean; includes: string[] };

const price = (t: Test) => (t.price_naira != null ? `₦${t.price_naira.toLocaleString("en-NG")}` : "price confirmed when we call");

/** Lab test and medication requests, one short step at a time. */
export function RequestForm({ kind, tests, preselect, hideTestPicker = false }: { kind: "home_test" | "medication"; tests: Test[]; preselect: string | null; hideTestPicker?: boolean }) {
  const [testId, setTestId] = useState<string | null>(tests.find((t) => t.code === preselect)?.id ?? null);
  // Free-text need when the test list is empty.
  const [need, setNeed] = useState("");
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

  const test = tests.find((t) => t.id === testId) ?? null;
  const needsConsult = kind === "medication" && (rx === "yes" || rx === "unsure") && consultRef.trim().length < 4;

  async function submit() {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, testId, name, phone, email: email || null, address, preferredTime: when, need, medicines, prescription: rx, consultReference: consultRef }),
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
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[#25D366] font-semibold text-ink">
            <Icon name="whatsapp" size={22} /> Chat on WhatsApp
          </a>
        )}
        <ButtonLink href="/" variant="secondary">Back to home</ButtonLink>
      </div>
    );
  }

  const steps: Step[] = [];

  if (kind === "home_test" && !hideTestPicker) {
    steps.push(
      tests.length === 0
        ? {
            key: "need", title: "Which test do you need?", hint: "Our test list is being updated. Tell us and we'll call you.", valid: need.trim().length > 2,
            content: <Field id="r-need" label="Test"><textarea id="r-need" rows={2} className={`${inputCls} py-3`} value={need} onChange={(e) => setNeed(e.target.value)} maxLength={500} /></Field>,
          }
        : {
            key: "test", title: "Choose a test", valid: !!testId,
            content: (
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Test">
                {tests.map((t) => <AnswerTile key={t.id} layout="rows" icon={t.is_bundle ? "sparkle" : "flask"} selected={testId === t.id} onClick={() => setTestId(t.id)} label={`${t.name} · ${price(t)}`} />)}
              </div>
            ),
          },
    );
  }

  if (kind === "medication") {
    steps.push(
      {
        key: "meds", title: "Which medicines do you need?", hint: "Name, strength and how many, if you know.", valid: medicines.trim().length > 2,
        content: <Field id="r-meds" label="Medicines"><textarea id="r-meds" rows={4} className={`${inputCls} py-3`} value={medicines} onChange={(e) => setMedicines(e.target.value)} maxLength={1500} placeholder="e.g. Amlodipine 10 mg, 30 tablets" /></Field>,
      },
      {
        key: "rx", title: "Are any of these prescription medicines?", valid: rx !== null && !needsConsult,
        content: (
          <>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Prescription medicines">
              {(["yes", "no", "unsure"] as const).map((x) => (
                <AnswerTile key={x} layout="rows" label={x === "yes" ? "Yes" : x === "no" ? "No" : "Not sure"} selected={rx === x} onClick={() => setRx(x)} />
              ))}
            </div>
            {(rx === "yes" || rx === "unsure") && (
              <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-check-bg p-4">
                <p className="text-sm font-medium text-check-text">We can only supply prescription medicines after a consult with one of our doctors.</p>
                <ButtonLink href="/doctor" icon="stethoscope">Book a doctor first</ButtonLink>
                <Field id="r-ref" label="Already had a consult with us? Enter your booking reference">
                  <input id="r-ref" className={inputCls} value={consultRef} onChange={(e) => setConsultRef(e.target.value)} placeholder="HC-…" />
                </Field>
              </div>
            )}
          </>
        ),
      },
    );
  }

  steps.push(
    {
      key: "where", title: kind === "home_test" ? "Where should we collect your sample?" : "Where should we deliver?", hint: "Include your area and a landmark.", valid: address.trim().length > 5,
      content: (
        <>
          <Field id="r-addr" label="Address"><textarea id="r-addr" rows={3} autoComplete="street-address" className={`${inputCls} py-3`} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} /></Field>
          <Field id="r-when" label="Preferred day and time (optional)" hint="For example: Saturday morning."><input id="r-when" className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} maxLength={120} /></Field>
        </>
      ),
    },
    {
      key: "you", title: "Your details", hint: "So we can confirm with you.", valid: name.trim().length > 1 && phone.trim().length > 6,
      content: (
        <>
          <Field id="r-name" label="Your name"><input id="r-name" autoComplete="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field id="r-phone" label="Phone or WhatsApp number"><input id="r-phone" type="tel" autoComplete="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field id="r-email" label="Email (optional)"><input id="r-email" type="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        </>
      ),
    },
    {
      key: "send", title: "Check and send", hint: "Nothing is charged now. We confirm the price and time with you first.", valid: true,
      content: (
        <dl className="grid gap-2 rounded-[var(--radius-lg)] bg-surface-2 p-4 text-sm">
          {kind === "home_test" && <div className="flex justify-between gap-4"><dt className="text-muted">Test</dt><dd className="text-right font-medium">{test ? `${test.name} · ${price(test)}` : need}</dd></div>}
          {kind === "medication" && <div className="flex justify-between gap-4"><dt className="text-muted">Medicines</dt><dd className="text-right font-medium">{medicines}</dd></div>}
          <div className="flex justify-between gap-4"><dt className="text-muted">{kind === "home_test" ? "Collection" : "Delivery"}</dt><dd className="text-right font-medium">{address}{when ? ` · ${when}` : ""}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Contact</dt><dd className="text-right font-medium">{name} · {phone}</dd></div>
        </dl>
      ),
    },
  );

  return <Steps className="mt-6" steps={steps} onSubmit={submit} submitLabel="Send my request" busy={busy} error={error} />;
}
