import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { ButtonLink, Logo, StatusLabel } from "@/components/ui";
import { findShared } from "@/lib/share/lookup";

export const metadata: Metadata = { title: "Shared results", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function SharedPage({ params }: PageProps<"/s/[token]">) {
  const { token } = await params;
  const shared = await findShared(token);
  if (!shared) notFound();
  const { summary, createdAt } = shared;
  const ha = summary.heartAge;
  return (
    <main className="mx-auto w-full max-w-[430px] px-6 pt-7">
      <Logo />
      <section className="mt-6 flex flex-col items-center rounded-[var(--radius-lg)] bg-ink px-5 py-6 text-white">
        <p className="text-[13px] font-semibold tracking-[0.08em] text-white/65 uppercase">{ha ? "Heart age" : "Health check summary"}</p>
        {ha && (
          <>
            <p className="mt-1 font-display text-[64px] leading-none font-semibold text-coral">{ha.kind === "below" ? "<" : ha.kind === "above" ? ">" : ""}{ha.value}</p>
            <p className="mt-2 text-center font-medium">Real age {summary.age}. 10-year heart risk {summary.riskPercent}%.</p>
          </>
        )}
        <p className="mt-2 text-xs font-medium text-white/65">Checked {new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeZone: site.timeZone }).format(new Date(createdAt))}</p>
      </section>
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        {summary.cards.map((c) => (
          <div key={c.topic} className={`flex flex-col gap-1 rounded-[var(--radius-md)] px-3.5 py-3 ${c.status === "good" ? "bg-good-bg" : "bg-check-bg"}`}>
            <StatusLabel status={c.status} />
            <span className="text-sm font-medium text-subtle">{c.topic}</span>
            <span className="font-display text-[19px] leading-[22px] font-semibold">{c.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs font-medium text-subtle">A read-only summary shared by its owner. Estimates, not diagnoses.</p>
      <ButtonLink href="/" className="mt-6 w-full" iconRight="arrowRight">Check your own heart age</ButtonLink>
    </main>
  );
}
