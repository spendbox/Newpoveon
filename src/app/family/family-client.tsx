"use client";
import { useState } from "react";
import { AnswerTile } from "@/components/client";
import { Icon } from "@/components/icons";
import { Field, inputCls, Notice } from "@/components/ui";
import { Steps, type Step } from "@/components/steps";
import type { Fx, PublicPlan } from "@/lib/care-plans";
import { whatsappLink } from "@/lib/whatsapp";

const ngn = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const fmt = (n: number, f: Fx[number]) => `${f.symbol}${Math.round(n / f.rate).toLocaleString("en-GB")}`;

export function FamilyPlans({ plans, fx, offered }: { plans: PublicPlan[]; fx: Fx; offered: boolean }) {
  const [cur, setCur] = useState<string>(fx[0]?.code ?? "NGN");
  const f = fx.find((x) => x.code === cur);
  if (plans.length === 0) {
    return <p className="mt-6 text-muted">Plans are being finalised. Tell us about your parent below and we&apos;ll send you options.</p>;
  }
  return (
    <>
      {fx.length > 0 && offered && (
        <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Show prices in">
          <span className="text-sm text-muted">Show prices in</span>
          {[...fx.map((x) => x.code), "NGN"].map((c) => (
            <button key={c} type="button" aria-pressed={cur === c} onClick={() => setCur(c)} className={`min-h-[36px] rounded-full border px-3 text-sm font-medium ${cur === c ? "border-ink bg-ink text-white" : "border-line bg-surface"}`}>{c}</button>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => (
          <article key={p.id} className={`flex flex-col rounded-[var(--radius-xl)] border p-5 ${p.tier === "plus" ? "border-primary bg-surface shadow-[0_0_0_1px_var(--color-primary)]" : "border-line bg-surface"}`}>
            {p.tier === "plus" && <span className="mb-2 self-start rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">Most chosen</span>}
            <h3 className="text-xl font-semibold">{p.name.replace(/^Parent care · /, "")}</h3>
            <p className="mt-1 text-sm text-muted">{p.summary}</p>
            <div className="mt-4">
              {p.annual ? (
                <>
                  <p className="font-display text-3xl font-bold tabular">{f ? fmt(p.annual, f) : ngn(p.annual)}<span className="text-base font-medium text-muted"> /year</span></p>
                  <p className="text-xs text-muted">{f ? `${ngn(p.annual)} a year · ` : ""}or {f ? fmt(p.monthly!, f) : ngn(p.monthly!)} a month</p>
                </>
              ) : (
                <p className="font-display text-xl font-semibold">Ask us for a price</p>
              )}
            </div>
            <ul className="mt-4 flex flex-col gap-1.5 text-sm">
              {p.includes.map((x) => <li key={x} className="flex gap-2"><Icon name="check" size={16} strokeWidth={2.4} className="mt-0.5 shrink-0 text-primary" />{x}</li>)}
            </ul>
            <a href="#enquire" className={`mt-auto pt-5`}>
              <span className={`flex min-h-[46px] items-center justify-center rounded-[var(--radius-md)] font-semibold ${p.tier === "plus" ? "bg-primary text-white hover:bg-primary-hover" : "border border-line-strong hover:bg-surface-2"}`}>Choose {p.name.replace(/^Parent care · /, "")}</span>
            </a>
          </article>
        ))}
      </div>
      {f && offered && <p className="mt-3 text-xs text-subtle">Prices in {f.code} are a guide at our current rate (₦{f.rate.toLocaleString("en-NG")} = 1 {f.code}). Plans are charged in naira.</p>}
    </>
  );
}

const CONCERNS = ["High blood pressure", "Diabetes", "Heart problems", "Had a stroke", "Memory or confusion", "Walking or falls", "Eyesight", "Not sure, just want them checked"];
const WHO = ["My mother", "My father", "Both my parents", "Another relative"];

export function FamilyForm({ plans }: { plans: string[] }) {
  const [v, setV] = useState({ name: "", email: "", phone: "", country: "", parentName: "", relationship: "", parentAge: "", location: "", plan: "", notes: "" });
  const [concerns, setConcerns] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const them = v.relationship === "Both my parents" ? "your parents" : v.parentName.trim() || (v.relationship === "My mother" ? "your mum" : v.relationship === "My father" ? "your dad" : "them");

  async function submit() {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "family_care", ...v, concerns, consent }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (r?.ok) setDone(true);
    else setError(d.error ?? "Something went wrong. Please try again.");
  }

  const wa = whatsappLink("Hello, I'd like to talk about care for my parent in Nigeria.");
  if (done) {
    return (
      <div className="mt-6 flex flex-col gap-3">
        <Notice tone="good">Thank you, {v.name.split(" ")[0]}. We&apos;ll be in touch within one working day to talk about care for {them}.</Notice>
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[#25D366] font-semibold text-ink"><Icon name="whatsapp" size={22} /> Chat with us on WhatsApp</a>}
      </div>
    );
  }

  const steps: Step[] = [
    {
      key: "who", title: "Who is the care for?", valid: !!v.relationship,
      content: (
        <>
          <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Who is the care for?">
            {WHO.map((w) => <AnswerTile key={w} label={w} icon={w === "Both my parents" ? "family" : "user"} selected={v.relationship === w} onClick={() => setV({ ...v, relationship: w })} />)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="f-pname" label="Their first name (optional)"><input id="f-pname" className={inputCls} value={v.parentName} onChange={set("parentName")} /></Field>
            <Field id="f-age" label="Their age (optional)"><input id="f-age" inputMode="numeric" className={inputCls} value={v.parentAge} onChange={(e) => setV({ ...v, parentAge: e.target.value.replace(/\D/g, "").slice(0, 3) })} /></Field>
          </div>
        </>
      ),
    },
    {
      key: "where", title: `Where does ${them === "them" ? "the person" : them} live?`, hint: "So we can check we can visit at home.", valid: v.location.trim().length > 1,
      content: <Field id="f-loc" label="Town or city, and state"><input id="f-loc" autoFocus className={inputCls} value={v.location} onChange={set("location")} placeholder="e.g. Ibadan, Oyo" /></Field>,
    },
    {
      key: "health", title: "Any health concerns?", hint: "Tap all that apply. You can skip this.", valid: true,
      content: (
        <div className="grid gap-2 sm:grid-cols-2">
          {CONCERNS.map((c) => <AnswerTile key={c} multi layout="rows" label={c} selected={concerns.includes(c)} onClick={() => setConcerns(concerns.includes(c) ? concerns.filter((x) => x !== c) : [...concerns, c])} />)}
        </div>
      ),
    },
    {
      key: "plan", title: "Anything else we should know?", hint: "Both are optional.", valid: true,
      content: (
        <>
          {plans.length > 0 && (
            <Field id="f-plan" label="Plan you're interested in">
              <select id="f-plan" className={inputCls} value={v.plan} onChange={set("plan")}><option value="">Not sure yet</option>{plans.map((p) => <option key={p}>{p}</option>)}</select>
            </Field>
          )}
          <Field id="f-notes" label="Notes"><textarea id="f-notes" rows={3} className={`${inputCls} py-3`} value={v.notes} onChange={set("notes")} maxLength={1000} placeholder="e.g. She lives alone and doesn't use a smartphone" /></Field>
        </>
      ),
    },
    {
      key: "you", title: "And about you", hint: "So we can get back to you.", valid: v.name.trim().length > 1 && /\S+@\S+\.\S+/.test(v.email) && v.phone.trim().length > 6,
      content: (
        <>
          <Field id="f-name" label="Your name"><input id="f-name" autoComplete="name" className={inputCls} value={v.name} onChange={set("name")} /></Field>
          <Field id="f-email" label="Email"><input id="f-email" type="email" autoComplete="email" className={inputCls} value={v.email} onChange={set("email")} /></Field>
          <Field id="f-phone" label="WhatsApp number" hint="With your country code, e.g. +44 7700 900123"><input id="f-phone" type="tel" autoComplete="tel" className={inputCls} value={v.phone} onChange={set("phone")} /></Field>
          <Field id="f-country" label="Country you live in (optional)"><input id="f-country" autoComplete="country-name" className={inputCls} value={v.country} onChange={set("country")} placeholder="e.g. United Kingdom" /></Field>
        </>
      ),
    },
    {
      key: "send", title: "Check and send", valid: consent,
      content: (
        <>
          <dl className="grid gap-2 rounded-[var(--radius-lg)] bg-surface-2 p-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Care for</dt><dd className="text-right font-medium">{v.relationship}{v.parentName ? ` (${v.parentName}${v.parentAge ? `, ${v.parentAge}` : ""})` : v.parentAge ? ` (${v.parentAge})` : ""}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Lives in</dt><dd className="text-right font-medium">{v.location}</dd></div>
            {concerns.length > 0 && <div className="flex justify-between gap-4"><dt className="text-muted">Concerns</dt><dd className="text-right font-medium">{concerns.join(", ")}</dd></div>}
            {v.plan && <div className="flex justify-between gap-4"><dt className="text-muted">Plan</dt><dd className="text-right font-medium">{v.plan}</dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-muted">We&apos;ll contact</dt><dd className="text-right font-medium">{v.name} · {v.phone}</dd></div>
          </dl>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#136F58]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span className="text-sm">I agree that Poveon may store these details to contact me about care, under the Nigeria Data Protection Act. Poveon will speak to my parent and only start care, or share their health information with me, once they agree.</span>
          </label>
        </>
      ),
    },
  ];
  return <Steps className="mt-6" steps={steps} onSubmit={submit} submitLabel="Send" busy={busy} error={error} />;
}
