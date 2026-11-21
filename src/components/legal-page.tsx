import type { ReactNode } from "react";
import { site } from "@/config/site";
import { Logo } from "./ui";

/** Shared layout for the privacy notice and terms: title, contents list, sections, company details. */
export function LegalPage({ title, intro, sections }: { title: string; intro: ReactNode; sections: { id: string; title: string; body: ReactNode }[] }) {
  const L = site.legal;
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-6 pb-16">
      <Logo />
      <header className="mt-8">
        <h1 className="text-[34px] leading-[1.05] font-bold md:text-5xl">{title}</h1>
        <p className="mt-2 text-sm text-subtle">Effective {L.effective} · {L.name}, {L.rc}</p>
        <div className="mt-4 text-[17px] leading-relaxed text-ink/85">{intro}</div>
      </header>

      <nav aria-label="On this page" className="mt-8 rounded-[var(--radius-xl)] border border-line bg-surface p-5">
        <p className="text-[13px] font-semibold tracking-[0.06em] text-subtle uppercase">On this page</p>
        <ol className="mt-2 grid gap-1.5 text-[15px] sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}><a href={`#${s.id}`} className="text-primary hover:underline">{i + 1}. {s.title}</a></li>
          ))}
        </ol>
      </nav>

      <article className="mt-8 flex flex-col gap-10 text-[16px] leading-relaxed text-ink/85 [&_a]:text-primary [&_a]:underline [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p+p]:mt-3 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-6">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-6">
            <h2 className="mb-3 text-2xl font-semibold text-ink">{i + 1}. {s.title}</h2>
            {s.body}
          </section>
        ))}
      </article>

      <aside className="mt-12 rounded-[var(--radius-xl)] bg-primary-soft p-5 text-[15px]">
        <p className="font-semibold text-ink">{L.name}</p>
        <p className="text-ink/80">{L.rc} · {L.address}</p>
        <p className="mt-2 text-ink/80">Email: <a href={`mailto:${L.email}`} className="text-primary underline">{L.email}</a> · Phone: <a href={`tel:${L.phoneIntl}`} className="text-primary underline">{L.phone}</a></p>
      </aside>
    </main>
  );
}
