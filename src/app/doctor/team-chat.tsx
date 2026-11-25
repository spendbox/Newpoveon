import { site } from "@/config/site";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/ui";
import { WhatsAppButton } from "@/components/whatsapp-catalog";
import { withMemberId } from "@/lib/bioage/member";

/** What brought them here, so the first WhatsApp message already says it. */
const OPENERS: Record<string, string> = {
  support: "Hello, I'd like to talk to someone about how I've been feeling.",
  "results-review": "Hello, I have a question about my health check results.",
};

/**
 * While doctor consults are paused: one clear way to get help. Our team answers on WhatsApp, helps arrange
 * tests and medicines, and points people to the right doctor or clinic when they need one.
 */
export function TeamChat({ topic, memberCode }: { topic: string | null; memberCode: string | null }) {
  const opener = (topic && OPENERS[topic]) || (topic ? "Hello, I have a question about my health." : "Hello, I have a question.");
  const message = withMemberId(opener, memberCode);
  return (
    <main className="mx-auto w-full max-w-[640px] px-5 pb-16">
      <div className="flex h-[72px] items-center"><Logo /></div>
      <section className="mt-4 overflow-hidden rounded-[var(--radius-xl)] bg-ink p-6 text-white md:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-white/10"><Icon name="chat" size={24} strokeWidth={2} /></span>
        <h1 className="mt-5 text-[34px] leading-[1.05] font-bold text-white md:text-[44px]">Chat with our team</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-white/75">
          A question about your results, a symptom, a test or a medicine? Send us a message. A member of our team will reply, help you arrange tests or medicines, and point you to the right doctor or clinic when you need one.
        </p>
        <WhatsAppButton message={message} className="mt-6 w-full md:w-auto">Chat on WhatsApp</WhatsAppButton>
        {memberCode && <p className="mt-3 text-[14px] text-white/60">Your message includes your Poveon ID, <b className="font-mono text-white/85">{memberCode}</b>, so we can see your results.</p>}
        <p className="mt-4 text-[15px] text-white/70">Or call us on <a href={`tel:${site.legal.phoneIntl}`} className="font-semibold text-white underline">{site.legal.phone}</a>.</p>
      </section>
      <p className="mt-5 flex gap-3 rounded-[var(--radius-lg)] bg-act-bg p-4 text-[15px] text-act-text">
        <Icon name="alert" size={20} strokeWidth={2.2} className="mt-0.5 shrink-0" />
        <span>Chest pain, trouble breathing, signs of a stroke, heavy bleeding or thoughts of harming yourself? <b>Call 112 or go to the nearest hospital now.</b></span>
      </p>
    </main>
  );
}
