/**
 * ONE place for the things you are likely to change.
 * Values marked "env" can also be set in Vercel (Settings → Environment Variables) without a code change.
 */
export const site = {
  /** Working name of the screening app. Rename here and it changes everywhere. */
  /** The brand name everywhere on the site and in emails. */
  appName: "Poveon",
  /** The company / platform name. */
  companyName: "Poveon",
  /** Legal details shown in the privacy notice, terms and emails. */
  legal: {
    name: "Poveon LTD",
    rc: "RC 8921141",
    address: "Yaba, Lagos, Nigeria",
    email: "notifications@poveon.com",
    phone: "09167015451",
    phoneIntl: "+2349167015451",
    dpo: "Wilson",
    /** Date the current privacy notice and terms took effect. */
    effective: "21 November 2026",
  },
  tagline: "Friendly health screening for Nigerians",

  /** Public web address, used in emails and share links (env: NEXT_PUBLIC_SITE_URL). */
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),

  /** Business WhatsApp number in international format, digits only, e.g. 2348012345678 (env). */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",

  /** How long an unpaid booking holds a time slot before it is released. */
  slotHoldMinutes: 30,

  /** Where team notifications go (env: TEAM_NOTIFICATION_EMAIL). Server only. */
  teamEmail: process.env.TEAM_NOTIFICATION_EMAIL || "",

  /** Sender for all emails, e.g. "Poveon <hello@yourdomain.com>" (env: EMAIL_FROM). */
  emailFrom: process.env.EMAIL_FROM || "Poveon <onboarding@resend.dev>",

  /** Timezone used to show appointment times. */
  timeZone: "Africa/Lagos",
} as const;

/**
 * Features that are built but switched off until a later launch.
 * To switch one on, set its variable to "true" in Vercel and redeploy.
 */
export const features = {
  /** "Care for your parents" (/family) for Nigerians abroad. Next major launch. */
  familyCare: process.env.NEXT_PUBLIC_FEATURE_FAMILY_CARE === "true",
};

/** Comma-separated admin emails (env: ADMIN_EMAILS). Server only. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * ⚠️ NEEDS CLINICAL SIGN-OFF BEFORE LAUNCH.
 * Heart age compares you with someone of the same sex who has "healthy risk factors".
 * The WHO model does not define these values. These are proposed defaults:
 *  - systolic blood pressure 120 mmHg (the WHO model's own centring value, and the usual "normal" upper limit)
 *  - BMI 22 kg/m² (middle of the WHO "healthy" range, 18.5–24.9)
 *  - non-smoker
 * Change them here once a doctor has approved them; all heart ages update automatically.
 */
export const HEART_AGE_REFERENCE = { sbp: 120, bmi: 22, smoker: false } as const;

/**
 * ⚠️ NEEDS CLINICAL SIGN-OFF BEFORE LAUNCH.
 * The WHO 2019 model was built and tested on ages 40–80. Poveon decided to stretch the SAME formula
 * down to this age so people aged 30–39 also get a heart age. Results that rely on ages under 40
 * are shown as an "early estimate". Set this back to 40 to switch the extension off.
 */
export const EXTENDED_MIN_AGE = 30;

/**
 * Fallback emergency contacts, shown if the database is unreachable.
 * The live list is edited in Admin → Emergency contacts.
 */
export const FALLBACK_EMERGENCY_CONTACTS = [
  { label: "Nigeria emergency number", phone: "112", description: "Free from any phone, 24 hours." },
] as const;
