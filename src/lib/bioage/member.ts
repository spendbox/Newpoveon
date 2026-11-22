/** Normalise what an admin types: "pv 7k3m9q" → "PV-7K3M9Q". */
export function normaliseMemberCode(s: string): string | null {
  const t = s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = t.startsWith("PV") ? t.slice(2) : t;
  return /^[2-9A-HJKMNP-Z]{6}$/.test(body) ? `PV-${body}` : null;
}

/** A WhatsApp message that always carries the person's member ID, so the team can match the chat to the account. */
export function withMemberId(text: string, code: string | null | undefined): string {
  return code ? `${text} My Poveon ID is ${code}.` : text;
}
