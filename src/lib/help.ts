/**
 * Where people go for help, and what it's called. While doctor consults are paused (features.consults),
 * every "Talk to a doctor" link leads to /doctor, which shows a "Chat with our team" page on WhatsApp.
 * Links stay the same either way, so nothing breaks when consults are switched back on.
 */
import { features } from "@/config/site";

export const consultsOn = features.consults;

export const HELP = consultsOn
  ? { label: "Talk to a doctor", short: "Doctor", icon: "stethoscope" as const }
  : { label: "Chat with our team", short: "Help", icon: "chat" as const };

/** Result cards and saved results carry labels like "Talk to a doctor"; show the team wording while consults are paused. */
export function helpLabel(label: string): string {
  if (consultsOn) return label;
  return /doctor|consult/i.test(label) ? HELP.label : label;
}

/** What the plan member perk is for: doctor consults, or (while they're paused) the Biological Age Check. "₦2,500 off" → "₦2,500 off the Biological Age Check". */
export function perkText(perk: string): string {
  return consultsOn ? `${perk} every doctor consultation` : `${perk} the Biological Age Check`;
}
