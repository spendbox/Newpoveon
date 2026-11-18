"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputCls, Notice } from "@/components/ui";

type Step = "email" | "password" | "code";
const MIN = 10;

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function post(path: string, body: unknown) {
    setBusy(true);
    setError(null);
    const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : { error: "You seem to be offline." };
    setBusy(false);
    if (!r?.ok) setError(d.error ?? "Something went wrong. Please try again.");
    return r?.ok ? d : null;
  }

  async function start(e?: React.FormEvent, isForgot = false) {
    e?.preventDefault();
    const d = await post("/api/auth/start", { email, forgot: isForgot });
    if (!d) return;
    setForgot(isForgot);
    setStep(d.step);
    setInfo(d.step === "code" ? `We've sent a code to ${email}. It can take a minute to arrive.` : null);
  }
  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (await post("/api/auth/login", { email, password })) done();
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (await post("/api/auth/verify", { email, code, password: newPass })) done();
  }
  function done() {
    router.push(next);
    router.refresh();
  }
  const back = () => { setStep("email"); setError(null); setInfo(null); setPassword(""); setCode(""); setNewPass(""); };

  return (
    <div className="mt-6">
      {step === "email" && (
        <form onSubmit={start} className="flex flex-col gap-4">
          <Field id="l-email" label="Email address">
            <input id="l-email" type="email" autoComplete="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {error && <Notice tone="warn">{error}</Notice>}
          <Button type="submit" disabled={busy || !/\S+@\S+\.\S+/.test(email)} iconRight="arrowRight">{busy ? "Checking…" : "Continue"}</Button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={login} className="flex flex-col gap-4">
          <p className="text-sm text-muted">Welcome back, <span className="font-medium text-ink">{email}</span>. <button type="button" onClick={back} className="text-primary hover:underline">Not you?</button></p>
          <Field id="l-pass" label="Password">
            <input id="l-pass" type="password" autoComplete="current-password" required autoFocus className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <Notice tone="warn">{error}</Notice>}
          <Button type="submit" disabled={busy || !password} iconRight="arrowRight">{busy ? "Logging in…" : "Log in"}</Button>
          <button type="button" onClick={() => start(undefined, true)} disabled={busy} className="self-start text-sm font-medium text-primary hover:underline">Forgot your password?</button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verify} className="flex flex-col gap-4">
          {info && <Notice tone="good">{info}</Notice>}
          <Field id="l-code" label="Code from your email" hint="Check your spam folder if it isn't there.">
            <input id="l-code" inputMode="numeric" autoComplete="one-time-code" required autoFocus maxLength={10} className={`${inputCls} text-xl tracking-[0.3em] tabular`} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field id="l-new" label={forgot ? "Choose a new password" : "Choose a password"} hint={`At least ${MIN} characters. A short sentence is easy to remember.`}>
            <input id="l-new" type="password" autoComplete="new-password" required className={inputCls} value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          </Field>
          {error && <Notice tone="warn">{error}</Notice>}
          <Button type="submit" disabled={busy || code.length < 6 || newPass.length < MIN} iconRight="arrowRight">{busy ? "Saving…" : forgot ? "Save new password" : "Create my account"}</Button>
          <div className="flex flex-wrap gap-4 text-sm">
            <button type="button" onClick={() => start(undefined, forgot)} disabled={busy} className="font-medium text-primary hover:underline">Send a new code</button>
            <button type="button" onClick={back} className="text-muted hover:underline">Use a different email</button>
          </div>
        </form>
      )}
    </div>
  );
}
