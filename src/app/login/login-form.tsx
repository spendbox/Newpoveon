"use client";
import { useState } from "react";
import { Button, Field, inputCls, Notice } from "@/components/ui";
import { browserSupabaseConfigured, supabaseBrowser } from "@/lib/supabase/browser";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const configured = browserSupabaseConfigured();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: true },
    });
    setState(error ? "error" : "sent");
  }

  if (!configured) return <div className="mt-6"><Notice tone="warn">Accounts aren&apos;t switched on yet. You can still do the check and get your results by email.</Notice></div>;
  if (state === "sent") {
    return (
      <div className="mt-6">
        <Notice tone="good">Check your inbox at {email}. Tap the link in the email to log in. It works once and expires in an hour.</Notice>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <Field id="login-email" label="Email address">
        <input id="login-email" type="email" autoComplete="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      {state === "error" && <Notice tone="warn">We couldn&apos;t send the link. Please check the email address and try again in a minute.</Notice>}
      <Button type="submit" disabled={state === "sending" || !/\S+@\S+\.\S+/.test(email)} iconRight="arrowRight">
        {state === "sending" ? "Sending…" : "Email me a magic link"}
      </Button>
    </form>
  );
}
