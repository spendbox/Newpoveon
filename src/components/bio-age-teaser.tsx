import Link from "next/link";
import { Icon, type IconName } from "./icons";
import { DnaHelix } from "./dna-helix";

/**
 * The Biological Age Check, teased on public pages as one of the things inside a Poveon account.
 * No price and no booking here: that's only in the dashboard, after logging in.
 */
export function BioAgeTeaser({ loggedIn, id, className = "" }: { loggedIn: boolean; id?: string; className?: string }) {
  const facts: [IconName, string][] = [["flask", "One home blood test"], ["dna", "Your body's real age"], ["target", "What's adding or taking away years"]];
  return (
    <section id={id} className={`scroll-mt-6 ${className}`} aria-labelledby="bio-teaser">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,#0E2A24_0%,#123F35_45%,#2A2350_100%)] p-6 text-white shadow-[var(--shadow-lg)] md:p-10">
        <span className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/50 blur-3xl" aria-hidden="true" />
        <span className="pointer-events-none absolute -right-20 -bottom-28 h-80 w-80 rounded-full bg-lavender/40 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-6">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[13px] font-semibold text-white/90 ring-1 ring-white/15">
              <Icon name="lock" size={13} strokeWidth={2.4} /> Inside your Poveon account
            </p>
            <h2 id="bio-teaser" className="mt-4 text-[30px] leading-[1.08] font-bold text-white md:text-[42px]">
              Are you a <span className="whitespace-nowrap">30-year-old</span> in a <span className="text-sun"><span className="whitespace-nowrap">50-year-old&apos;s</span> body?</span>
            </h2>
            <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-white/75 md:text-[17px]">
              Our Biological Age Check shows how old your body really is, from routine blood results. It&apos;s one of the things waiting for you in Poveon.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {facts.map(([icon, text]) => (
                <li key={text} className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[13px] font-medium text-white/85 ring-1 ring-white/10">
                  <Icon name={icon} size={15} strokeWidth={2.2} className="text-primary-soft" />{text}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              {loggedIn ? (
                <Link href="/account/bio-age" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-6 text-[16px] font-semibold whitespace-nowrap text-ink hover:bg-primary-soft">
                  See it in my dashboard <Icon name="arrowRight" size={18} strokeWidth={2.4} />
                </Link>
              ) : (
                <>
                  <Link href="/check" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-6 text-[16px] font-semibold whitespace-nowrap text-ink hover:bg-primary-soft">
                    Start with your health check <Icon name="arrowRight" size={18} strokeWidth={2.4} />
                  </Link>
                  <Link href="/login?next=/account/bio-age" className="text-center text-[15px] font-semibold whitespace-nowrap text-white/80 underline-offset-4 hover:underline">I have an account</Link>
                </>
              )}
            </div>
          </div>
          <DnaHelix className="pointer-events-none hidden h-[220px] w-[100px] shrink-0 md:block" />
        </div>
      </div>
    </section>
  );
}
