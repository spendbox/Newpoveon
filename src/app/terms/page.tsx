import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of use", description: "The terms for using Poveon's health check, doctor consults and other services." };

export default function TermsPage() {
  const L = site.legal;
  const mail = <a href={`mailto:${L.email}`}>{L.email}</a>;
  return (
    <LegalPage
      title="Terms of use"
      intro={
        <p>
          These terms are an agreement between you and {L.name} (&ldquo;Poveon&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) for using our website and services. By using Poveon you agree to them, so please read them carefully. Our <Link href="/privacy">privacy notice</Link> explains how we handle your information.
        </p>
      }
      sections={[
        {
          id: "emergency", title: "Not for emergencies",
          body: (
            <p className="rounded-[var(--radius-md)] bg-act-bg p-4 font-medium text-act-text">
              Poveon is not an emergency service. If you have chest pain, trouble breathing, signs of a stroke, heavy bleeding, thoughts of harming yourself or any other emergency, <strong>call 112 or go to the nearest hospital now</strong>.
            </p>
          ),
        },
        {
          id: "check", title: "The health check gives estimates, not a diagnosis",
          body: (
            <>
              <p>The free health check uses published, validated screening tools to estimate things like your heart age, diabetes risk, sleep, mood and wellbeing. The results depend on the answers you give, are <strong>estimates only</strong>, and are <strong>not a diagnosis</strong> or a substitute for seeing a doctor.</p>
              <p>Our health guides are general information, not personal medical advice. Always talk to a doctor before making changes to medicines or treatment.</p>
            </>
          ),
        },
        {
          id: "who", title: "Who can use Poveon",
          body: <p>You must be 18 or over and able to agree to these terms. The information you give must be true and your own. You may book a consult for someone else only with their permission.</p>,
        },
        {
          id: "account", title: "Your account",
          body: (
            <ul>
              <li>You can create an account with your email and a password. Keep your password private and your email account secure; you are responsible for activity on your account.</li>
              <li>Tell us straight away at {mail} if you think someone else has used your account.</li>
              <li>You can delete your account at any time in <Link href="/account/settings">Settings</Link>.</li>
            </ul>
          ),
        },
        {
          id: "consults", title: "Doctor consults",
          body: (
            <>
              <ul>
                <li>Consults are provided by doctors registered with the <strong>Medical and Dental Council of Nigeria</strong>, by phone or video, at the start time you choose (or a time we agree with you).</li>
                <li>The fee is always shown before you pay. You pay securely through <strong>Paystack</strong>; your booking is confirmed once Paystack confirms the payment.</li>
                <li>Your doctor will call the number you give at the start time. Please be somewhere you can talk privately.</li>
                <li>A remote consult has limits. Your doctor may advise tests, a medicine, or seeing a doctor in person, and may decide a remote consult isn&apos;t safe for your situation.</li>
                <li>Prescriptions are only given when your doctor decides they are right for you.</li>
              </ul>
            </>
          ),
        },
        {
          id: "refunds", title: "Rescheduling, cancellations and refunds",
          body: (
            <ul>
              <li><strong>If we can&apos;t hold your consult</strong> at the time booked, we will offer you a new time or a full refund, whichever you prefer.</li>
              <li><strong>If you need to change or cancel</strong>, tell us at least 2 hours before the start time by email ({mail}), phone or WhatsApp, and we will move your consult or give you a full refund.</li>
              <li><strong>If you miss your consult</strong> without telling us, and the doctor tried to reach you at the start time, the fee is not refunded, but we will try to offer you another time.</li>
              <li>Refunds go back to the card or account you paid with, usually within 5 to 10 working days, depending on your bank.</li>
            </ul>
          ),
        },
        {
          id: "plan", title: "Personal plans",
          body: (
            <ul>
              <li>A personal plan costs <strong>₦{site.planPriceNaira.toLocaleString("en-NG")} for 12 months</strong>, paid once through Paystack. It does <strong>not</strong> renew automatically; we&apos;ll remind you before it ends.</li>
              <li>Your plan gives general lifestyle guidance based on published guidelines. It is not medical treatment. If you have a heart condition, diabetes, are pregnant, or get chest pain, dizziness or unusual breathlessness when active, talk to a doctor before starting or stepping up.</li>
              <li>You can ask for a <strong>full refund within 7 days</strong> of paying by emailing {mail}.</li>
              <li>You can change your plan or switch off reminder emails at any time.</li>
            </ul>
          ),
        },
        {
          id: "tests", title: "Lab tests and medicines",
          body: (
            <ul>
              <li>Lab tests and medicines are arranged through partner labs and licensed pharmacies, on WhatsApp. We confirm the price, timing and any delivery fee with you before you pay anything.</li>
              <li><strong>Prescription medicines</strong> are only supplied with a valid prescription, from one of our doctors or your own.</li>
              <li>Medicines are sourced from licensed suppliers. You can check any medicine&apos;s registration on the NAFDAC website.</li>
              <li>The partner lab or pharmacy is responsible for the test or medicine it provides.</li>
            </ul>
          ),
        },
        {
          id: "use", title: "Using Poveon fairly",
          body: (
            <>
              <p>You agree not to:</p>
              <ul>
                <li>give false information or pretend to be someone else;</li>
                <li>misuse, copy, disrupt or try to break into the website or other people&apos;s accounts;</li>
                <li>abuse or threaten our doctors or staff;</li>
                <li>use Poveon for anything unlawful.</li>
              </ul>
              <p>We may suspend or close an account that breaks these rules.</p>
            </>
          ),
        },
        {
          id: "ip", title: "Our content",
          body: <p>The Poveon name, logo, website, designs and written content belong to {L.name} or our licensors. You may use them only to use our services for yourself. The screening tools we use belong to their authors and are credited on our site.</p>,
        },
        {
          id: "liability", title: "Our responsibility to you",
          body: (
            <>
              <p>We provide Poveon with reasonable care and skill. But because the health check gives estimates based on your own answers, we are not responsible for decisions you make based only on your results without seeing a doctor.</p>
              <p>As far as the law allows, we are not liable for indirect or unforeseeable losses, or for problems caused by things outside our reasonable control (such as network outages). Where we are liable, our total liability to you for any one consult or service is limited to the amount you paid for it.</p>
              <p>Nothing in these terms limits any rights you have under the <strong>Federal Competition and Consumer Protection Act 2018</strong>, or our liability for death or personal injury caused by our negligence, or for fraud.</p>
            </>
          ),
        },
        {
          id: "changes", title: "Changes to these terms",
          body: <p>We may update these terms from time to time. We will show the new effective date at the top, and tell you by email or on the site if the changes are significant. The terms in place when you book a consult apply to that consult.</p>,
        },
        {
          id: "law", title: "Law and disputes",
          body: <p>These terms are governed by the laws of the Federal Republic of Nigeria. If you have a complaint, please contact us first at {mail} and we will try to resolve it quickly. If we can&apos;t, the courts of Lagos State will have jurisdiction.</p>,
        },
        {
          id: "contact", title: "Contact us",
          body: <p>{L.name}, {L.address}. Email {mail} or call <a href={`tel:${L.phoneIntl}`}>{L.phone}</a>.</p>,
        },
      ]}
    />
  );
}
