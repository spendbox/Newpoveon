"use client";
import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "./audio-player";
import { Icon } from "./icons";

export const VOICE_MAX_SECONDS = 120;

function pickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return "";
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Record a short voice note (up to 2 minutes), play it back, re-record or delete it.
 * The recording stays on the phone until the form is sent.
 */
export function VoiceNote({ value, onChange }: { value: Blob | null; onChange: (b: Blob | null) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "denied" | "unsupported">("idle");
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the old playback
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(value);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [value]);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
  }, []);

  async function start() {
    const mime = pickMime();
    if (mime === null || !navigator.mediaDevices?.getUserMedia) return setState("unsupported");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      return setState("denied");
    }
    chunks.current = [];
    const r = new MediaRecorder(stream.current, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      if (timer.current) clearInterval(timer.current);
      const blob = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
      onChange(blob.size > 0 ? blob : null);
      setState("idle");
    };
    rec.current = r;
    r.start(250);
    setSeconds(0);
    setState("recording");
    const began = Date.now();
    timer.current = setInterval(() => {
      const s = (Date.now() - began) / 1000;
      setSeconds(s);
      if (s >= VOICE_MAX_SECONDS) stop();
    }, 200);
  }
  function stop() {
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  }

  if (state === "unsupported") return <p className="text-sm text-muted">Voice notes don&apos;t work in this browser. Please type instead.</p>;

  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      {state === "recording" ? (
        <div className="flex items-center gap-4">
          <button type="button" onClick={stop} aria-label="Stop recording" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-act-text text-white">
            <span className="h-5 w-5 rounded-[4px] bg-white" />
          </button>
          <div className="flex-1">
            <p className="flex items-center gap-2 font-semibold"><span className="pulse-dot h-2.5 w-2.5 rounded-full bg-coral" /> Recording… <span className="tabular text-muted">{mmss(seconds)}</span></p>
            <div className="mt-2 h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-coral" style={{ width: `${Math.min(100, (seconds / VOICE_MAX_SECONDS) * 100)}%` }} /></div>
            <p className="mt-1 text-xs text-subtle">Tap the square to stop. Up to {VOICE_MAX_SECONDS / 60} minutes.</p>
          </div>
        </div>
      ) : url ? (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-good-text"><Icon name="check" size={16} strokeWidth={2.6} /> Voice note ready. Play it back to check.</p>
          <AudioPlayer src={url} durationHint={seconds || undefined} analyseOnLoad tone="soft" />
          <div className="flex gap-2">
            <button type="button" onClick={start} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium hover:bg-surface-2"><Icon name="mic" size={16} strokeWidth={2} /> Record again</button>
            <button type="button" onClick={() => onChange(null)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium text-act-text hover:bg-act-bg"><Icon name="trash" size={16} strokeWidth={2} /> Delete</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <button type="button" onClick={start} aria-label="Record a voice note" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[var(--shadow-md)] hover:bg-primary-hover">
            <Icon name="mic" size={24} strokeWidth={2} />
          </button>
          <div>
            <p className="font-semibold">Record a voice note</p>
            <p className="text-sm text-muted">{state === "denied" ? "We couldn't use your microphone. Allow it in your browser settings, or type instead." : "Say it in your own words, in any language you're comfortable with."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
