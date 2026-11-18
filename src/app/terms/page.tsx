import type { Metadata } from "next";
import { site } from "@/config/site";
import { Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Terms of use" };

/** PLACEHOLDER TEXT — to be reviewed by Poveon's lawyer before launch. */
export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-7">
      <Logo />
      <article className="mt-6 flex flex-col gap-4 text-[16px] leading-relaxed [&_h2]:mt-4 [&_h2]:text-2xl">
        <p className="rounded-[var(--radius-md)] bg-check-bg px-4 py-3 text-sm font-semibold text-check-text">Draft for review. [POVEON TO REVIEW WITH A LAWYER BEFORE LAUNCH]</p>
        <h1 className="text-[34px] leading-tight">Terms of use</h1>
        <h2>Not a diagnosis</h2>
        <p>{site.appName} gives estimates based on published screening tools. It is not a diagnosis and does not replace a doctor. If you feel unwell, see a doctor. In an emergency call 112 or go to the nearest hospital.</p>
        <h2>Doctor consults</h2>
        <p>Consults cost ₦{site.consultPriceNaira.toLocaleString("en-NG")}, paid through Paystack. [CANCELLATION, RESCHEDULING AND REFUND POLICY.] Doctors are registered with the Medical and Dental Council of Nigeria. [CONFIRM.]</p>
        <h2>Home tests and medication</h2>
        <p>Requests are confirmed by our team before anything is charged. Prescription medicines are only supplied after a consult with one of our doctors. [PRICING, DELIVERY AREAS AND PHARMACY LICENCE DETAILS.]</p>
        <h2>Your account</h2>
        <p>You can log in with a link sent to your email. Keep access to your email secure. You can delete your account at any time.</p>
        <h2>Liability</h2>
        <p>[LIMITATION OF LIABILITY CLAUSE.]</p>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>
        <p className="text-sm text-subtle">Last updated: [DATE]</p>
      </article>
    </main>
  );
}
