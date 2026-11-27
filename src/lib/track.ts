"use client";
/**
 * First-party counters only. No answers, names, emails or third-party analytics.
 *  - track(): "a check started / finished" (the original counters).
 *  - trackView(): a page opened, with a random visitor number, where they came from and the device.
 *  - trackCheck(): how far a health check attempt got (which question), for the drop-off report.
 */
import { normalisePath, sourceFrom } from "./track-shared";

function send(body: Record<string, unknown>) {
  try {
    const s = JSON.stringify(body);
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([s], { type: "application/json" }));
    else fetch("/api/events", { method: "POST", body: s, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
  } catch {}
}

export function track(type: "started" | "completed") {
  send({ type });
}

const rid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);

/** A random number for this browser, so a person is counted once. Not linked to who they are. */
function visitor(): string {
  try {
    let v = localStorage.getItem("pv.vid");
    if (!v) { v = rid(); localStorage.setItem("pv.vid", v); }
    return v;
  } catch { return "no-storage"; }
}

/** Where this visit came from, worked out once per visit (WhatsApp, Google, a link with ?utm_source=...). */
function source(): string {
  try {
    let s = sessionStorage.getItem("pv.src");
    if (!s) {
      s = sourceFrom(new URLSearchParams(location.search).get("utm_source"), document.referrer, location.host);
      sessionStorage.setItem("pv.src", s);
    }
    return s;
  } catch { return "direct"; }
}

const device = () => (window.innerWidth < 640 ? "phone" : window.innerWidth < 1024 ? "tablet" : "desktop");

export function trackView(pathname: string) {
  const path = normalisePath(pathname);
  if (path) send({ type: "view", path, vid: visitor(), src: source(), device: device() });
}

export function trackCheck(sid: string, stage: "question" | "completed" | "emailed" | "paywall" | "unlocked", q?: { id: string; index: number; total: number }) {
  send({ type: "check", sid, stage, vid: visitor(), src: source(), device: device(), q: q?.id, i: q?.index, n: q?.total });
}

export const newCheckId = rid;
