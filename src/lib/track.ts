"use client";
/**
 * First-party counters only ("a screening started", "a screening finished").
 * No answers, no identifiers, no third-party analytics.
 */
export function track(type: "started" | "completed") {
  try {
    const body = JSON.stringify({ type });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
  } catch {}
}
