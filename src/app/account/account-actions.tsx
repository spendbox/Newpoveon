"use client";
import { useState } from "react";
import { Button, inputCls, Notice } from "@/components/ui";
import { clearProgress, clearSaved } from "@/lib/storage";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function go() {
    setBusy(true);
    const r = await fetch("/api/account/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: text }) }).catch(() => null);
    if (r?.ok) {
      clearProgress();
      clearSaved();
      // Full page load on purpose, so no logged-in state survives.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/?deleted=1";
    } else {
      setBusy(false);
      setError(true);
    }
  }
  if (!open) return <Button variant="quiet" icon="trash" className="mt-3" onClick={() => setOpen(true)}>Delete my account and data</Button>;
  return (
    <div className="mt-3 flex flex-col gap-3">
      <label htmlFor="del" className="text-sm font-semibold">Type DELETE to confirm</label>
      <input id="del" className={inputCls} value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
      {error && <Notice tone="warn">That didn&apos;t work. Please try again or contact us.</Notice>}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="secondary" icon="trash" disabled={text !== "DELETE" || busy} onClick={go} className="border-check-text text-check-text">
          {busy ? "Deleting…" : "Delete everything"}
        </Button>
      </div>
    </div>
  );
}
