/** Used by the browser tracker and the server that stores it, so both agree on what's allowed. */

/** Group pages so links with private parts (share links) never get stored. null = don't record. */
export function normalisePath(p: string): string | null {
  const path = (p.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
  if (/^\/(admin|api|auth|_next)(\/|$)/.test(path)) return null;
  if (/^\/s\//.test(path)) return "/s/[shared result]";
  if (/^\/account(\/|$)/.test(path)) return "/account";
  if (!/^\/[a-z0-9\-/]*$/i.test(path) || path.length > 80) return null;
  return path.toLowerCase();
}

const HOSTS: [RegExp, string][] = [
  [/whatsapp|wa\.me/, "whatsapp"],
  [/facebook|fb\.com|fb\.me/, "facebook"],
  [/instagram/, "instagram"],
  [/google\./, "google"],
  [/bing\.|yahoo\.|duckduckgo/, "search"],
  [/tiktok/, "tiktok"],
  [/t\.co$|twitter|x\.com/, "x"],
  [/linkedin|lnkd\.in/, "linkedin"],
];
export const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", facebook: "Facebook", instagram: "Instagram", google: "Google", search: "Other search",
  tiktok: "TikTok", x: "X (Twitter)", linkedin: "LinkedIn", direct: "Direct or unknown", other: "Other websites", flyer: "Flyer",
};

/** utm_source wins, then the page they came from. WhatsApp often sends no referrer, so it shows as direct. */
export function sourceFrom(utm: string | null, referrer: string, ownHost: string): string {
  const u = (utm ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
  if (u) {
    for (const [re, name] of HOSTS) if (re.test(u)) return name;
    return u;
  }
  let host = "";
  try { host = referrer ? new URL(referrer).host.toLowerCase() : ""; } catch {}
  if (!host || host === ownHost.toLowerCase()) return "direct";
  for (const [re, name] of HOSTS) if (re.test(host)) return name;
  return "other";
}
