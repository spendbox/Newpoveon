/**
 * Friendly 12-hour times, the way people say them: "5pm", "9:30am".
 * Used for booking times, emails and the admin, never 24-hour "17:00".
 */
const cache = new Map<string, Intl.DateTimeFormat>();
const fmt = (timeZone: string, seconds: boolean) => {
  const key = `${timeZone}|${seconds}`;
  if (!cache.has(key)) cache.set(key, new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", ...(seconds ? { second: "2-digit" } : {}), hour12: true, timeZone }));
  return cache.get(key)!;
};

export function clockTime(d: Date, timeZone = "Africa/Lagos", { seconds = false } = {}): string {
  const parts = fmt(timeZone, seconds).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const ampm = get("dayPeriod").toLowerCase();
  const h = get("hour"), m = get("minute"), s = get("second");
  if (seconds) return `${h}:${m}:${s} ${ampm}`;
  return m === "00" ? `${h}${ampm}` : `${h}:${m}${ampm}`;
}
