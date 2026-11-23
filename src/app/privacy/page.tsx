import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy notice", description: "How Poveon LTD collects, uses and protects your personal and health information." };

export default function PrivacyPage() {
  const L = site.legal;
  const mail = <a href={`mailto:${L.email}`}>{L.email}</a>;
  return (
    <LegalPage
      title="Privacy notice"
      intro={
        <p>
          This notice explains what personal information {L.name} (&ldquo;Poveon&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects when you use our website and services, why we use it, who we share it with, and the rights you have. We are the data controller for your information, and we process it in line with the <strong>Nigeria Data Protection Act 2023</strong> (NDPA) and the rules of the Nigeria Data Protection Commission (NDPC).
        </p>
      }
      sections={[
        {
          id: "who", title: "Who we are",
          body: (
            <>
              <p>{L.name} is a company registered in Nigeria ({L.rc}), with its office in {L.address}. Poveon offers an online health check, doctor consults, and help arranging lab tests and medicines.</p>
              <p>Our Data Protection Officer is <strong>{L.dpo}</strong>. You can reach them at {mail} or on <a href={`tel:${L.phoneIntl}`}>{L.phone}</a>.</p>
            </>
          ),
        },
        {
          id: "collect", title: "What we collect",
          body: (
            <>
              <p><strong>Information you give us:</strong></p>
              <ul>
                <li><strong>Health check answers</strong>, such as your date of birth, sex, height, weight, waist, blood pressure, smoking, activity, sleep, alcohol, mood, worry and wellbeing, and the results we calculate from them.</li>
                <li><strong>Contact details</strong>: your email address, and your phone or WhatsApp number if you give it.</li>
                <li><strong>Account details</strong>: your email (we create an account for it when you pay for a check, so your results and plan are kept) and a password (stored only in scrambled, &ldquo;hashed&rdquo; form by our database provider; we can never see it).</li>
                <li><strong>Doctor consult details</strong>: your name, phone, email, the time you choose, your voice note, any written note, and any photos or documents you attach (for example lab results or a prescription).</li>
                <li><strong>Lab results</strong> for a test you ask us to arrange, such as the Biological Age Check: the results our team enters from the lab report, the lab&apos;s name and reference, the date of the test and the biological age we work out from them. Each entry records which staff member made it, so results can be checked.</li>
                <li><strong>Your Poveon ID</strong>: a short code (like PV-7K3M9Q) given to every account, so we can match your WhatsApp messages and lab results to the right account. It contains no personal information.</li>
                <li><strong>Your plan</strong>, if you have one: the areas you chose, your settings (such as your wake-up time or starting weight), the days you tick off and the weights you log.</li>
                <li><strong>Messages</strong> you send us by email or WhatsApp, for example to request a lab test or medicine.</li>
              </ul>
              <p><strong>Information from others:</strong> Paystack tells us whether your payment succeeded, the amount and a reference. <strong>We never see or store your card or bank details.</strong></p>
              <p><strong>Information collected automatically:</strong> a simple count of how many health checks are started and finished, with no answers or identifiers attached; and the basic technical logs every website keeps (such as IP address and browser type) for security and to fix problems. We do <strong>not</strong> use advertising cookies, and no analytics or advertising company receives your health answers.</p>
            </>
          ),
        },
        {
          id: "device", title: "What stays on your phone",
          body: (
            <>
              <p>While you answer the health check, your answers are saved only on your own device so you don&apos;t lose your place. <strong>Nothing is sent to us until you enter your email and tick the consent box</strong> to see your results.</p>
              <p>We use a small number of essential cookies and browser storage: to keep you logged in, to keep your place in the check, to remember your email (and phone and name, if you gave them) so you don't have to type them again, and to remember settings like whether you have seen the logo animation. On the login page, &ldquo;Use a different email&rdquo; forgets your email on that device. You can clear these at any time in your browser settings.</p>
            </>
          ),
        },
        {
          id: "why", title: "Why we use it, and our legal basis",
          body: (
            <>
              <p>Health information is <strong>sensitive personal data</strong> under the NDPA, so we take extra care with it.</p>
              <ul>
                <li><strong>To show and email your results, and keep your history:</strong> based on your <strong>explicit consent</strong>, which you give when you tick the consent box. You can withdraw it at any time (see section 9).</li>
                <li><strong>To provide a doctor consult you book</strong>, including sharing your voice note, note, attachments and (if you choose) your latest results with the doctor: to perform our <strong>contract</strong> with you, and with your <strong>explicit consent</strong> for the health information involved.</li>
                <li><strong>To take payments and keep accounting records:</strong> to perform our contract with you, and to meet our <strong>legal obligations</strong> under Nigerian tax and company law.</li>
                <li><strong>To send you emails you need</strong>, such as your results, login codes and booking confirmations: to perform our contract with you.</li>
                <li><strong>To run your plan</strong>, including working out each week&apos;s targets and sending your Sunday summary and midweek nudge: to perform our contract with you. You can switch the emails off at any time on your plan page.</li>
                <li><strong>To keep the service safe and working</strong> (for example preventing fraud and fixing faults): our <strong>legitimate interests</strong>, which we balance against your rights.</li>
                <li><strong>In an emergency</strong>, if we believe someone&apos;s life is at risk: to protect their <strong>vital interests</strong>.</li>
              </ul>
              <p>We do not send marketing messages without your permission, and we never sell your information.</p>
            </>
          ),
        },
        {
          id: "automated", title: "How your scores are worked out",
          body: (
            <>
              <p>Your results are calculated automatically from your answers using published, validated screening tools (such as the WHO cardiovascular risk charts, FINDRISC, PHQ-9, GAD-7, AUDIT-C, STOP-Bang and the WHO-5 Well-Being Index). They are <strong>estimates, not a diagnosis</strong>, and they are not used to make any decision about you that has legal or similarly significant effects.</p>
              <p>You can always ask one of our doctors to review your results with you.</p>
            </>
          ),
        },
        {
          id: "share", title: "Who we share it with",
          body: (
            <>
              <p>We share only what is needed, only with:</p>
              <ul>
                <li><strong>Our doctors</strong>, for consults you book.</li>
                <li><strong>Service providers</strong> that run parts of Poveon for us and may only use your information on our instructions: <strong>Supabase</strong> (secure database and file storage), <strong>Vercel</strong> (website hosting), <strong>Resend</strong> (email delivery) and <strong>Paystack</strong> (payments).</li>
                <li><strong>Partner labs and pharmacies</strong>, only when you ask us to arrange a test or medicine, and only the details they need to do it.</li>
                <li><strong>WhatsApp</strong>, only when you choose to message us there. WhatsApp is run by Meta under its own privacy policy.</li>
                <li><strong>Authorities</strong>, if the law requires it, for example a valid court order.</li>
              </ul>
              <p><strong>Share links:</strong> if you create a share link for your results, anyone with the link can see a short summary: your age, heart age and heart risk, diabetes risk and activity. Mood, worry, wellbeing, alcohol and sleep results are never included. You can switch the link off at any time.</p>
            </>
          ),
        },
        {
          id: "abroad", title: "Storing information outside Nigeria",
          body: (
            <p>Some of our service providers store or process information on servers outside Nigeria, for example in the European Union or the United States. When this happens, we rely on the safeguards allowed by Part VIII of the NDPA: transfers to countries with adequate data protection, or contracts that require the provider to protect your information to the standard Nigerian law expects. You can ask us for more details.</p>
          ),
        },
        {
          id: "keep", title: "How long we keep it",
          body: (
            <ul>
              <li><strong>Health check results:</strong> until you delete them or ask us to. If you have an account, you can delete everything yourself in <Link href="/account/settings">Settings</Link>.</li>
              <li><strong>Accounts:</strong> until you delete your account.</li>
              <li><strong>Your plan and what you tick off:</strong> until you delete your account.</li>
              <li><strong>Biological age and other lab results:</strong> until you delete your account. They are deleted with it.</li>
              <li><strong>Consult records</strong> (including voice notes, notes and attachments): for as long as needed to provide your care and to meet medical record-keeping duties, after which they are deleted.</li>
              <li><strong>Payment and booking records:</strong> for up to 6 years, as required by Nigerian tax and accounting law. If you delete your account, these records are kept but are no longer linked to it.</li>
              <li><strong>Anonymous counts</strong> of checks started and finished: these contain nothing that identifies you.</li>
            </ul>
          ),
        },
        {
          id: "rights", title: "Your rights",
          body: (
            <>
              <p>Under the NDPA you have the right to:</p>
              <ul>
                <li>be told how your information is used (this notice);</li>
                <li>get a copy of your information;</li>
                <li>have wrong information corrected;</li>
                <li>have your information deleted;</li>
                <li>restrict or object to how we use it;</li>
                <li>receive your information in a common format and move it to another provider;</li>
                <li><strong>withdraw your consent at any time</strong>, without affecting anything we did before;</li>
                <li>not be subject to decisions made solely by automated means that significantly affect you.</li>
              </ul>
              <p>To use any of these rights, email {mail} or call <a href={`tel:${L.phoneIntl}`}>{L.phone}</a>. We will reply within 30 days. If you are unhappy with how we handle your information, you can complain to the <strong>Nigeria Data Protection Commission</strong> (ndpc.gov.ng).</p>
            </>
          ),
        },
        {
          id: "security", title: "How we protect it",
          body: (
            <ul>
              <li>Information is encrypted when it travels between your device and us.</li>
              <li>Database rules make sure each person can only ever see their own results.</li>
              <li>Voice notes and attachments are kept in private storage that only authorised staff can open, using links that expire after an hour.</li>
              <li>Only authorised staff can see bookings and requests, and the admin area shows no health answers except what you share for a consult.</li>
            </ul>
          ),
        },
        {
          id: "children", title: "Children",
          body: <p>Poveon is for adults aged 18 and over. We don&apos;t knowingly collect information from children. If you think a child has used Poveon, contact us and we will delete their information.</p>,
        },
        {
          id: "changes", title: "Changes to this notice",
          body: <p>We may update this notice from time to time. We will show the new effective date at the top, and tell you by email or on the site if the changes are significant.</p>,
        },
        {
          id: "contact", title: "Contact us",
          body: <p>Questions about privacy or your information: our Data Protection Officer, {L.dpo}, at {mail}, on <a href={`tel:${L.phoneIntl}`}>{L.phone}</a>, or by post to {L.name}, {L.address}.</p>,
        },
      ]}
    />
  );
}
