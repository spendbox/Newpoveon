import type { Metadata } from "next";
import { site } from "@/config/site";
import { Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy notice" };

/** PLACEHOLDER TEXT — to be reviewed by Poveon and a Nigerian data-protection adviser before launch. */
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-7">
      <Logo />
      <article className="mt-6 flex flex-col gap-4 text-[16px] leading-relaxed [&_h2]:mt-4 [&_h2]:text-2xl">
        <p className="rounded-[var(--radius-md)] bg-check-bg px-4 py-3 text-sm font-semibold text-check-text">Draft for review. [POVEON TO REVIEW WITH A DATA PROTECTION ADVISER BEFORE LAUNCH]</p>
        <h1 className="text-[34px] leading-tight">Privacy notice</h1>
        <p>This notice explains how {site.companyName} ([COMPANY LEGAL NAME], [REGISTERED ADDRESS], RC [NUMBER]) uses your information when you use {site.appName}. We follow the Nigeria Data Protection Act 2023 (NDPA).</p>
        <h2>What we collect</h2>
        <ul className="list-disc pl-6">
          <li>Your answers to the health questions, and the results we calculate.</li>
          <li>Your email, and your phone or WhatsApp number if you give it.</li>
          <li>If you book a doctor or request a service: your name, phone, email, address, reason and appointment time.</li>
          <li>Payment confirmations from Paystack (we never see or store your card details).</li>
          <li>Simple counts of how many checks are started and finished, with no answers or identifiers attached.</li>
        </ul>
        <h2>Before you give us your email</h2>
        <p>While you answer, your answers are kept only on your own device. Nothing is sent to us until you enter your email and tick the consent box.</p>
        <h2>Why we use it, and our legal basis</h2>
        <p>Health information is sensitive personal data. We use it only with your consent, to show and email your results, to keep your history if you have an account, and, if you choose, to share your results with the doctor you book. We use booking and payment details to provide the service you paid for.</p>
        <h2>Who we share it with</h2>
        <p>Only the service providers we need: Supabase (secure database), Resend (email delivery), Paystack (payments) and Vercel (hosting). They process data only on our instructions. [CONFIRM DATA LOCATIONS AND CROSS-BORDER TRANSFER SAFEGUARDS UNDER NDPA PART VIII.] We do not sell your data and we do not use advertising or analytics tools that receive your health answers.</p>
        <h2>Share links</h2>
        <p>If you create a share link, anyone with the link can see a short summary (heart age, diabetes risk and activity). Mood, worry and alcohol results are never included. You can turn the link off at any time.</p>
        <h2>How long we keep it</h2>
        <p>[RETENTION PERIOD, e.g. results kept until you delete them or for X years of inactivity.] Payment and booking records may be kept for [X] years for accounting and legal reasons.</p>
        <h2>Your rights</h2>
        <p>You can ask to see, correct, move or delete your data, and withdraw consent at any time. With an account, you can delete everything yourself from My account. Otherwise email [PRIVACY EMAIL]. You can also complain to the Nigeria Data Protection Commission.</p>
        <h2>Security</h2>
        <p>Data is encrypted in transit, access is restricted so people only ever see their own results, and only authorised staff can see bookings and requests.</p>
        <h2>Contact</h2>
        <p>Data protection officer: [NAME], [EMAIL], [PHONE].</p>
        <p className="text-sm text-subtle">Last updated: [DATE]</p>
      </article>
    </main>
  );
}
