import "server-only";
import { Resend } from "resend";
import { consultsOn, HELP, helpLabel } from "@/lib/help";
import { site } from "@/config/site";
import { displayValue, STATUS_LABEL, type Results } from "@/lib/scoring/results";
import { clockTime } from "@/lib/time";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Sends an email. Never throws: a failed email must not break saving results or a booking. */
export async function sendEmail(to: string | string[], subject: string, html: string, text: string): Promise<boolean> {
  if (!emailConfigured()) {
    console.warn(`[email] RESEND_API_KEY not set; skipped "${subject}"`);
    return false;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: site.emailFrom, to, subject, html, text });
    if (error) {
      console.error("[email] Resend error", error.name);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] failed", (e as Error).message);
    return false;
  }
}

/* ------------------------------------------------------------------ Layout */

export function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#F6F8F7;font-family:Inter,Arial,sans-serif;color:#10221D">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F8F7"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 4px 16px"><span style="display:inline-block;width:12px;height:12px;background:#136F58;border-radius:4px"></span>
<span style="font-size:20px;font-weight:800;vertical-align:middle;margin-left:8px">${esc(site.appName)}</span></td></tr>
<tr><td style="background:#FFFFFF;border-radius:24px;padding:24px">
<h1 style="margin:0 0 12px;font-size:24px;line-height:28px">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:16px 4px;font-size:12px;color:#5E706A">${esc(site.legal.name)}, ${esc(site.legal.rc)}, ${esc(site.legal.address)}. Results are estimates, not diagnoses. In an emergency call 112.
<br><a href="${site.siteUrl}/privacy" style="color:#5E706A">Privacy</a></td></tr>
</table></td></tr></table></body></html>`;
}

export const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#136F58;color:#FFFFFF;border-radius:12px;padding:14px 22px;font-weight:600;text-decoration:none;font-size:16px">${esc(label)}</a>`;

/* ------------------------------------------------------------------ Login code */

export function codeEmail(code: string) {
  const html = layout(
    "Your login code",
    `<p style="margin:0 0 16px;font-size:15px;color:#4A5D57">Enter this code to confirm your email. It expires in 1 hour.</p>
<p style="margin:0 0 16px;font-size:34px;font-weight:700;letter-spacing:8px;background:#E3F2EC;color:#136F58;border-radius:14px;padding:16px;text-align:center">${esc(code)}</p>
<p style="margin:0;font-size:13px;color:#5E706A">If you didn't ask for this code, you can ignore this email. Nobody can use it without access to your inbox.</p>`,
  );
  return { subject: `Your ${site.appName} code: ${code}`, html, text: `Your ${site.appName} code is ${code}. It expires in 1 hour. If you didn't ask for it, ignore this email.` };
}

/* ------------------------------------------------------------------ Results email */

export function resultsEmail(r: Results) {
  const heart = r.heart
    ? `<div style="background:#10221D;color:#FFFFFF;border-radius:20px;padding:18px;text-align:center;margin-bottom:14px">
<div style="font-size:12px;font-weight:800;letter-spacing:1px;color:#A9C2BA;text-transform:uppercase">Your heart age</div>
<div style="font-size:48px;font-weight:800;color:#FF6B4A;line-height:56px">${r.heart.heartAge.kind === "below" ? "&lt;" : r.heart.heartAge.kind === "above" ? "&gt;" : ""}${r.heart.heartAge.value}</div>
<div style="font-size:15px;font-weight:700">You're ${r.age}. 10-year heart attack or stroke risk: ${r.heart.riskPercent}%</div>
<div style="font-size:12px;color:#A9C2BA;margin-top:6px">${r.heart.earlyEstimate ? "Early estimate: the WHO risk charts were tested on people aged 40 and over, so treat this as a rough guide." : "Estimate based on WHO 2019 risk charts."} Not a diagnosis.</div></div>`
    : r.heartNote
      ? `<p style="background:#FFF4DC;color:#7A4A00;border-radius:16px;padding:12px 14px;font-weight:700">${esc(r.heartNote)}</p>`
      : "";
  const wb = r.wellbeing
    ? `<div style="background:#E3F2EC;border-radius:20px;padding:18px;text-align:center;margin-bottom:14px">
<div style="font-size:12px;font-weight:800;letter-spacing:1px;color:#136F58;text-transform:uppercase">Your wellbeing score</div>
<div style="font-size:48px;font-weight:800;color:#10221D;line-height:56px">${r.wellbeing.score}<span style="font-size:20px;color:#5E706A"> / 100</span></div>
<div style="font-size:12px;color:#5E706A;margin-top:4px">WHO-5 Well-Being Index, over the last two weeks. Not a diagnosis.</div></div>`
    : "";
  const cards = r.cards
    .map(
      (c) => `<tr><td style="padding:6px 0"><div style="background:${c.status === "good" ? "#E6F4EE" : "#FFF4DC"};border-radius:16px;padding:12px 14px">
<div style="font-size:12px;font-weight:800;color:${c.status === "good" ? "#116149" : "#7A4A00"}">${c.status === "good" ? "&#10003;" : "&#9888;"} ${STATUS_LABEL[c.status]}</div>
<div style="font-size:13px;font-weight:700;color:#5E706A">${esc(c.topic)}</div>
<div style="font-size:18px;font-weight:800">${esc(displayValue(c))}</div>
<div style="font-size:14px;margin-top:4px">${esc(c.summary)}</div>
<div style="font-size:12px;color:#5E706A;margin-top:4px">${esc(c.basis)} An estimate, not a diagnosis.</div>
<div style="font-size:14px;font-weight:800;margin-top:6px">Next step: ${esc(c.next.label)} · <a href="${site.siteUrl}/learn/${c.id}" style="color:#136F58">Learn more</a></div></div></td></tr>`,
    )
    .join("");
  const due = r.reminders.filter((x) => !x.done).map((x) => `<li style="margin:4px 0"><b>${esc(x.title)}</b>: ${esc(x.detail)}</li>`).join("");
  const html = layout(
    "Here are your results",
    `${wb}${heart}<table role="presentation" width="100%">${cards}</table>
${due ? `<h2 style="font-size:18px;margin:18px 0 6px">Check-ups you're due for</h2><ul style="padding-left:18px;margin:0;font-size:14px">${due}</ul>` : ""}
<p style="margin:20px 0 8px;font-size:15px">${consultsOn ? "Something worrying? A doctor can talk it through with you." : "Something worrying, or a question about a result? Our team is a message away."}</p>
${button(`${site.siteUrl}/doctor`, consultsOn ? "Get help from a doctor" : "Chat with our team")}
<p style="margin:18px 0 0;font-size:13px;color:#5E706A">Your results and your personal plan are saved to your account. <a href="${site.siteUrl}/account" style="color:#10221D">Open my dashboard</a> (log in with a code sent to this email).</p>`,
  );
  const text = [
    `Your ${site.appName} results`,
    r.wellbeing ? `Wellbeing score: ${r.wellbeing.score}/100 (WHO-5).` : "",
    r.heart ? `Heart age: ${r.heart.heartAge.value} (you're ${r.age}). 10-year risk: ${r.heart.riskPercent}%.` : r.heartNote ?? "",
    ...r.cards.map((c) => `- ${c.topic}: ${STATUS_LABEL[c.status]} — ${displayValue(c)}. ${c.summary} (${c.basis}) Next: ${helpLabel(c.next.label)}`),
    "Every result is an estimate, not a diagnosis.",
    `${HELP.label}: ${site.siteUrl}/doctor`,
  ].join("\n");
  return { subject: `Your ${site.appName} results`, html, text };
}

/* ------------------------------------------------------------------ Booking confirmation */

export function bookingEmail(b: { name: string; slot_starts_at: string | null; reason: string; paystack_reference: string; needs_reschedule: boolean; amount_kobo: number; consult_type_name?: string | null; doctor_type?: string | null }, whatsappUrl: string | null) {
  const when = b.slot_starts_at ? formatWhen(b.slot_starts_at) : "We'll call you to agree a time";
  const html = layout(
    "Your doctor consult is booked",
    `<p style="font-size:16px">Hi ${esc(b.name)}, thank you. Your payment of ₦${(b.amount_kobo / 100).toLocaleString("en-NG")} was received${b.consult_type_name ? ` for: ${esc(b.consult_type_name)}` : ""}.</p>
<p style="background:#E6F4EE;border-radius:16px;padding:12px 14px;font-weight:800">${esc(when)}</p>
${b.needs_reschedule ? `<p style="background:#FFF4DC;border-radius:16px;padding:12px 14px;color:#7A4A00;font-weight:700">That time was taken while you were paying, so our team will call you to pick a new one. Sorry about that.</p>` : ""}
<p style="font-size:15px">${b.doctor_type ? `A ${esc(b.doctor_type.toLowerCase())}` : "A doctor"} will call you on your phone number. Reason you gave: ${esc(b.reason)}</p>
<p style="font-size:13px;color:#5E706A">Reference: ${esc(b.paystack_reference)}</p>
${whatsappUrl ? button(whatsappUrl, "Chat on WhatsApp") : ""}
<p style="font-size:13px;color:#5E706A;margin-top:16px">If you feel very unwell before your consult, call 112 or go to the nearest hospital.</p>`,
  );
  const text = `Your doctor consult is booked. ${when}. Reference: ${b.paystack_reference}.${whatsappUrl ? ` WhatsApp: ${whatsappUrl}` : ""}`;
  return { subject: `Booked: your ${site.appName} doctor consult`, html, text };
}

/* ------------------------------------------------------------------ Team notifications */

export function teamEmail(title: string, rows: Record<string, unknown>) {
  const body = `<table role="presentation" style="font-size:14px">${Object.entries(rows)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5E706A;font-weight:700;vertical-align:top">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`)
    .join("")}</table><p style="margin-top:16px">${button(`${site.siteUrl}/admin`, "Open admin")}</p>`;
  const text = `${title}\n${Object.entries(rows).map(([k, v]) => `${k}: ${v ?? ""}`).join("\n")}`;
  return { subject: `[${site.appName}] ${title}`, html: layout(title, body), text };
}

export function formatWhen(iso: string) {
  const d = new Date(iso);
  return `${new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long", timeZone: site.timeZone }).format(d)}, ${clockTime(d, site.timeZone)}`;
}
