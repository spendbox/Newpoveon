"use client";
import { useEffect, useState } from "react";
import { site } from "@/config/site";
import { Icon } from "@/components/icons";
import { Button, Notice } from "@/components/ui";
import { shareSummary, type Results } from "@/lib/scoring/results";
import type { SavedScreening } from "@/lib/storage";
import { whatsappShareLink } from "@/lib/whatsapp";

/**
 * Share: an image card (no sensitive details), an optional read-only link with a random URL that
 * can be switched off, and one-tap WhatsApp. Health details never go into a URL: the card is made
 * with a POST, and the WhatsApp text only ever contains the opt-in share link.
 */
export function ShareSection({ results, saved }: { results: Results; saved: SavedScreening | null }) {
  const [img, setImg] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const summary = shareSummary(results);

  useEffect(() => {
    let url: string | null = null;
    fetch("/api/share-card", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ age: summary.age, heartAge: summary.heartAge }) })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (!b) return;
        url = URL.createObjectURL(b);
        setBlob(b);
        setImg(url);
      })
      .catch(() => {});
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [summary.age, summary.heartAge]);

  useEffect(() => {
    if (!saved) return;
    fetch(`/api/share?screeningId=${encodeURIComponent(saved.screeningId)}`, { headers: { "x-owner-token": saved.ownerToken } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.url && setLink(d.url))
      .catch(() => {});
  }, [saved]);

  async function shareImage() {
    if (!blob) return;
    const file = new File([blob], `${site.appName.toLowerCase()}-card.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `Check your heart age free at ${site.siteUrl}` });
        return;
      } catch {
        /* user cancelled */
      }
    }
    const a = document.createElement("a");
    a.href = img!;
    a.download = file.name;
    a.click();
  }

  async function toggleLink(enabled: boolean) {
    if (!saved) return;
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json", "x-owner-token": saved.ownerToken },
      body: JSON.stringify({ screeningId: saved.screeningId, enabled }),
    }).catch(() => null);
    const d = r && r.ok ? await r.json() : null;
    setBusy(false);
    if (!d) return setMsg("Sorry, that didn't work. Please try again.");
    setLink(d.url ?? null);
    setMsg(enabled ? "Your share link is on. Anyone with the link can see your summary." : "Your share link is off. The old link no longer works.");
  }

  const waText = link ? `I just did my free ${site.appName}. Here's my summary: ${link}` : `I just did a free ${site.appName} in 10 minutes. Check your heart age: ${site.siteUrl}`;

  return (
    <section className="mt-8 rounded-[var(--radius-lg)] bg-surface p-5" aria-labelledby="share">
      <h2 id="share" className="text-2xl">Share your results</h2>
      <p className="mt-1 text-sm font-bold text-muted-soft">Cards and links never show your mood, worry or alcohol answers.</p>

      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={summary.heartAge ? `Share card: my heart age is ${summary.heartAge.value}. I'm ${summary.age}.` : "Share card"} className="mx-auto mt-4 w-[220px] rounded-[var(--radius-md)] border-[2.5px] border-ink" />
      ) : (
        <div className="mx-auto mt-4 h-[391px] w-[220px] animate-pulse rounded-[var(--radius-md)] bg-ground" aria-hidden="true" />
      )}

      <div className="mt-4 flex flex-col gap-3">
        <Button variant="secondary" icon="download" onClick={shareImage} disabled={!blob}>Share my image</Button>
        <a href={whatsappShareLink(waText)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] border-[2.5px] border-ink bg-[#25D366] px-5 text-base font-extrabold text-ink">
          <Icon name="whatsapp" size={22} /> Share on WhatsApp
        </a>

        {saved ? (
          <div className="rounded-[var(--radius-md)] bg-ground p-4">
            <p className="font-extrabold">Share link</p>
            {link ? (
              <>
                <p className="mt-1 text-sm break-all text-muted">{link}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="quiet" icon="link" onClick={() => navigator.clipboard?.writeText(link).then(() => setMsg("Link copied."))}>Copy link</Button>
                  <Button variant="quiet" icon="close" onClick={() => toggleLink(false)} disabled={busy}>Turn off link</Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted">Create a private, read-only page with your summary. You can turn it off at any time.</p>
                <Button variant="quiet" icon="link" className="mt-3" onClick={() => toggleLink(true)} disabled={busy}>Create share link</Button>
              </>
            )}
          </div>
        ) : null}
        {msg && <Notice>{msg}</Notice>}
      </div>
    </section>
  );
}
