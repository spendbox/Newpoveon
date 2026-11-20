import type { ReactNode } from "react";
import type { CatalogGroup } from "@/config/catalog";
import { whatsappLink } from "@/lib/whatsapp";
import { Icon, type IconName } from "./icons";
import { Logo } from "./ui";

const WA_GREEN = "bg-[#1FA855] hover:bg-[#178F47] text-white";

/** A big "Chat on WhatsApp" button. Falls back to a quiet note if the number isn't set yet. */
export function WhatsAppButton({ message, children, size = "lg", className = "" }: { message: string; children: ReactNode; size?: "lg" | "sm"; className?: string }) {
  const href = whatsappLink(message);
  const cls = size === "lg"
    ? "min-h-[56px] rounded-[var(--radius-md)] px-6 text-[17px] shadow-[var(--shadow-md)]"
    : "min-h-[44px] rounded-full px-4 text-[14px]";
  if (!href) return <p className={`text-sm text-muted ${className}`}>WhatsApp is being set up. Please check back soon.</p>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors ${WA_GREEN} ${cls} ${className}`}>
      <Icon name="whatsapp" size={size === "lg" ? 22 : 18} strokeWidth={2} />
      {children}
    </a>
  );
}

/** Lab tests and Medication pages: what we can arrange, then one tap to WhatsApp. No forms, no prices. */
export function WhatsAppCatalog({
  eyebrow, title, intro, icon, groups, kind, highlight, children, steps,
}: {
  eyebrow: string; title: string; intro: string; icon: IconName; groups: CatalogGroup[]; kind: "lab test" | "medicine";
  highlight?: string | null; children?: ReactNode; steps: string[];
}) {
  const general = highlight ? `Hello, I'd like to ask about a ${kind}: ${highlight}.` : `Hello, I'd like to ask about a ${kind}.`;
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-6 pb-16">
      <Logo />

      <section className="mt-8 overflow-hidden rounded-[var(--radius-xl)] bg-ink p-6 text-white md:p-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-white/10"><Icon name={icon} size={24} strokeWidth={2} /></span>
        <p className="mt-5 text-[13px] font-semibold tracking-[0.06em] text-white/60 uppercase">{eyebrow}</p>
        <h1 className="mt-1 max-w-2xl text-[34px] leading-[1.05] font-bold text-white md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-xl text-[17px] text-white/75">{intro}</p>
        {highlight && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium"><Icon name="check" size={16} strokeWidth={2.4} /> {highlight}</p>
        )}
        <WhatsAppButton message={general} className="mt-6 w-full md:w-auto">Request on WhatsApp</WhatsAppButton>
        <ol className="mt-6 grid gap-3 text-[15px] text-white/80 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {children}

      <h2 className="mt-12 text-2xl font-semibold md:text-3xl">What we can arrange</h2>
      <p className="mt-1 text-muted">Don&apos;t see it? Ask anyway. If it exists, we&apos;ll do our best to find it.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <article key={g.key} className="flex flex-col rounded-[var(--radius-xl)] border border-line bg-surface p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name={g.icon} size={20} strokeWidth={2} /></span>
            <h3 className="mt-4 text-lg font-semibold">{g.title}</h3>
            <p className="mt-0.5 text-[15px] text-muted">{g.text}</p>
            <ul className="mt-3 grid gap-1.5 text-[15px]">
              {g.items.map((x) => <li key={x} className="flex gap-2"><Icon name="check" size={16} strokeWidth={2.4} className="mt-1 shrink-0 text-primary" />{x}</li>)}
            </ul>
            <WhatsAppButton size="sm" message={`Hello, I'd like to ask about a ${kind} (${g.title}).`} className="mt-5 self-start">Ask about this</WhatsAppButton>
          </article>
        ))}
      </div>
    </main>
  );
}
