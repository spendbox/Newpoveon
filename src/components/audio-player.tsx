"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const BARS = 40;
const mmss = (s: number) => (Number.isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

/** Read the recording and turn it into BARS bar heights between 0.12 and 1. */
async function analyse(src: string): Promise<{ peaks: number[]; duration: number } | null> {
  try {
    const AC: typeof AudioContext | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const buf = await (await fetch(src)).arrayBuffer();
    const ctx = new AC();
    const audio = await ctx.decodeAudioData(buf);
    void ctx.close();
    const data = audio.getChannelData(0);
    const size = Math.max(1, Math.floor(data.length / BARS));
    const raw: number[] = [];
    for (let i = 0; i < BARS; i++) {
      let sum = 0;
      for (let j = i * size; j < Math.min(data.length, (i + 1) * size); j++) sum += data[j] * data[j];
      raw.push(Math.sqrt(sum / size));
    }
    const max = Math.max(...raw, 1e-6);
    return { peaks: raw.map((v) => 0.12 + 0.88 * Math.pow(v / max, 0.8)), duration: audio.duration };
  } catch {
    return null;
  }
}

/** A gentle placeholder shape until (or if) the real waveform is ready. */
const PLACEHOLDER = Array.from({ length: BARS }, (_, i) => 0.25 + 0.2 * Math.abs(Math.sin(i * 0.9)) + 0.1 * Math.abs(Math.sin(i * 2.3)));

/**
 * A voice-note player: big play/pause, a tappable waveform that fills as it plays, and the time.
 * Works around browsers that record notes without a length (they'd otherwise show 0:00 or ∞).
 * `analyseOnLoad`: draw the real waveform straight away (for local recordings). Otherwise it's drawn on first play.
 */
export function AudioPlayer({ src, durationHint, analyseOnLoad = false, tone = "light" }: { src: string; durationHint?: number; analyseOnLoad?: boolean; tone?: "light" | "soft" }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(durationHint ?? 0);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const analysed = useRef(false);

  const runAnalysis = useCallback(() => {
    if (analysed.current) return;
    analysed.current = true;
    void analyse(src).then((r) => {
      if (!r) return;
      setPeaks(r.peaks);
      if (Number.isFinite(r.duration) && r.duration > 0) setDuration(r.duration);
    });
  }, [src]);

  useEffect(() => {
    analysed.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when a new recording arrives
    setPeaks(null); setTime(0); setPlaying(false);
    if (analyseOnLoad) runAnalysis();
  }, [src, analyseOnLoad, runAnalysis]);

  function onMeta() {
    const a = audio.current;
    if (!a) return;
    if (Number.isFinite(a.duration) && a.duration > 0) return setDuration(a.duration);
    // Recorded WebM has no length written in it. Jumping far ahead makes the browser work it out.
    const fix = () => {
      a.removeEventListener("timeupdate", fix);
      if (Number.isFinite(a.duration)) setDuration((d) => d || a.duration);
      a.currentTime = 0;
    };
    a.addEventListener("timeupdate", fix);
    a.currentTime = 1e7;
  }

  async function toggle() {
    const a = audio.current;
    if (!a) return;
    runAnalysis();
    if (a.paused) {
      if (duration && a.currentTime >= duration - 0.05) a.currentTime = 0;
      try { await a.play(); } catch { setPlaying(false); }
    } else a.pause();
  }

  function seek(clientX: number, el: HTMLElement) {
    const a = audio.current;
    if (!a || !duration) return;
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    a.currentTime = f * duration;
    setTime(f * duration);
  }

  const pct = duration ? Math.min(1, time / duration) : 0;
  const bars = peaks ?? PLACEHOLDER;
  const shell = tone === "soft" ? "bg-primary-soft" : "bg-surface-2";

  return (
    <div className={`flex items-center gap-3 rounded-full ${shell} py-2 pr-4 pl-2`}>
      <audio
        ref={audio} src={src} preload="metadata" className="hidden"
        onLoadedMetadata={onMeta}
        onDurationChange={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d) && d > 0) setDuration(d); }}
        onTimeUpdate={(e) => { const t = e.currentTarget.currentTime; if (t < 1e6) setTime(t); }}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setTime(duration); }}
      />
      <button type="button" onClick={toggle} aria-label={playing ? "Pause voice note" : "Play voice note"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[var(--shadow-sm)] transition-transform hover:bg-primary-hover active:scale-95">
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1.2" fill="currentColor" /><rect x="9.5" y="2" width="3.5" height="12" rx="1.2" fill="currentColor" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.6v10.8a.8.8 0 0 0 1.2.7l8.6-5.4a.8.8 0 0 0 0-1.4L5.7 1.9a.8.8 0 0 0-1.2.7z" fill="currentColor" /></svg>
        )}
      </button>
      <div
        role="slider" tabIndex={0} aria-label="Position in voice note" aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(time)} aria-valuetext={`${mmss(time)} of ${mmss(duration)}`}
        className="flex h-10 flex-1 cursor-pointer touch-none items-center gap-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); seek(e.clientX, e.currentTarget); }}
        onPointerMove={(e) => { if (e.buttons) seek(e.clientX, e.currentTarget); }}
        onKeyDown={(e) => {
          const a = audio.current;
          if (!a || !duration) return;
          if (e.key === "ArrowRight") a.currentTime = Math.min(duration, a.currentTime + 5);
          else if (e.key === "ArrowLeft") a.currentTime = Math.max(0, a.currentTime - 5);
          else if (e.key === " " || e.key === "Enter") void toggle();
          else return;
          e.preventDefault();
        }}
      >
        {bars.map((h, i) => (
          <span key={i} className={`flex-1 rounded-full transition-colors duration-150 ${(i + 0.5) / BARS <= pct ? "bg-primary" : "bg-ink/20"}`} style={{ height: `${Math.round(h * 100)}%`, minWidth: 2 }} />
        ))}
      </div>
      <span className="w-10 shrink-0 text-right text-[13px] font-medium text-muted tabular">{mmss(playing || time > 0 ? time : duration)}</span>
    </div>
  );
}
