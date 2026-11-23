import Link from "next/link";
import { differenceText } from "@/lib/bioage/phenoage";
import { withMemberId } from "@/lib/bioage/member";
import { Icon, type IconName } from "./icons";
import { WhatsAppButton } from "./whatsapp-catalog";

export type BioPromoState =
  | { kind: "guest" }
  | { kind: "member"; code: string | null }
  | { kind: "result"; code: string | null; bio: number; real: number };

/**
 * Home page: the Biological Age Check. Visitors see an example; logged-in people can book on WhatsApp
 * with their ID; people with a result see their own number.
 */
export function BioAgePromo({ state, price }: { state: BioPromoState; price: number }) {
  const mine = state.kind === "result";
  const real = mine ? Math.floor(state.real) : 38;
  const bio = mine ? Math.round(state.bio) : 33;
  const diff = bio - real;
  const scale = Math.max(real, bio, 50) * 1.15;
  const drivers: { label: string; years: string; good: boolean }[] = [
    { label: "Blood sugar", years: "−1.4y", good: true },
    { label: "Inflammation", years: "−0.9y", good: true },
    { label: "Red cell size", years: "+0.6y", good: false },
  ];
  const facts: [IconName, string][] = [["flask", "9 blood results"], ["home", "Sample taken at home"], ["clock", "Results in 2–3 days"]];

  return (
    <section className="py-8" aria-labelledby="bio-promo">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,#0E2A24_0%,#123F35_45%,#2A2350_100%)] p-6 text-white shadow-[var(--shadow-lg)] md:p-10">
        <span className="bp-glow pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/50 blur-3xl" aria-hidden="true" />
        <span className="bp-glow bp-glow-2 pointer-events-none absolute -right-20 -bottom-28 h-80 w-80 rounded-full bg-lavender/40 blur-3xl" aria-hidden="true" />

        <div className="relative grid items-center gap-8 md:grid-cols-[1.1fr_1fr] md:gap-12">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[13px] font-semibold text-white/90 ring-1 ring-white/15">
              <Icon name="sparkle" size={14} strokeWidth={2.4} className="text-sun" /> New · Biological Age Check
            </p>
            <h2 id="bio-promo" className="mt-4 text-[34px] leading-[1.05] font-bold text-white md:text-[46px]">
              {mine ? <>Your body is <span className="text-sun">{bio}</span>.</> : <>Your body has an age of <span className="text-sun">its own</span>.</>}
            </h2>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-white/75">
              {mine
                ? `That's ${differenceText(diff)}. See what's shaping it, and re-test to watch it change.`
                : "Nine routine blood results, one home visit. Find out how old your body really is, what's adding years, and what's taking them off."}
            </p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {facts.map(([icon, text]) => (
                <li key={text} className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[13px] font-medium text-white/85 ring-1 ring-white/10">
                  <Icon name={icon} size={15} strokeWidth={2.2} className="text-primary-soft" />{text}
                </li>
              ))}
            </ul>

            <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-[30px] leading-none font-bold">₦{price.toLocaleString("en-NG")}</span>
              <span className="text-[14px] text-white/60">pay on WhatsApp when we confirm your time</span>
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              {state.kind === "guest" && (
                <>
                  <Link href="/home-tests#biological-age" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-6 text-[16px] font-semibold whitespace-nowrap text-ink hover:bg-primary-soft">
                    Find my biological age <Icon name="arrowRight" size={18} strokeWidth={2.4} />
                  </Link>
                  <Link href="/login?next=/account/bio-age" className="text-center text-[15px] font-semibold text-white/80 underline-offset-4 hover:underline">Log in to book</Link>
                </>
              )}
              {state.kind === "member" && (
                <>
                  <WhatsAppButton size="lg" message={withMemberId("Hello, I'd like to book the Biological Age Check.", state.code)}>Book on WhatsApp</WhatsAppButton>
                  <Link href="/account/bio-age" className="text-center text-[15px] font-semibold text-white/80 underline-offset-4 hover:underline">How it works</Link>
                </>
              )}
              {state.kind === "result" && (
                <>
                  <Link href="/account/bio-age" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-6 text-[16px] font-semibold whitespace-nowrap text-ink hover:bg-primary-soft">
                    See my result <Icon name="arrowRight" size={18} strokeWidth={2.4} />
                  </Link>
                  <WhatsAppButton size="sm" message={withMemberId("Hello, I'd like to book a repeat Biological Age Check.", state.code)}>Book a re-test</WhatsAppButton>
                </>
              )}
            </div>
          </div>

          {/* The result card: an example for visitors, their own for people with a result. */}
          <div className="relative mx-auto w-full max-w-[380px]">
            <span className="bp-float absolute -top-5 -right-3 z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-sun text-ink shadow-[var(--shadow-lg)]" aria-hidden="true">
              <Icon name="dna" size={28} strokeWidth={2.2} />
            </span>
            <div className="bp-rise rounded-[28px] bg-white/10 p-6 ring-1 ring-white/20 backdrop-blur-md">
              <p className="text-[12px] font-semibold tracking-[0.1em] text-white/60 uppercase">{mine ? "Your latest result" : "Example result"}</p>
              <div className="mt-2 flex items-end gap-3">
                <span className="font-display text-[72px] leading-none font-bold">{bio}</span>
                <span className="pb-2 text-[15px] text-white/70">body age</span>
              </div>
              <p className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${diff < 0 ? "bg-good-bg text-good-text" : diff > 0 ? "bg-sun text-ink" : "bg-white/15 text-white"}`}>
                {diff < 0 && <Icon name="check" size={13} strokeWidth={3} />}{diff === 0 ? "Same as real age" : `${Math.abs(diff)} year${Math.abs(diff) === 1 ? "" : "s"} ${diff < 0 ? "younger" : "older"}`}
              </p>

              <div className="mt-5 space-y-3" role="img" aria-label={`Real age ${real}, body age ${bio}`}>
                {[["Real age", real, "bg-white/45", "bp-bar"], ["Body age", bio, "bg-sun", "bp-bar bp-bar-2"]].map(([label, v, color, anim]) => (
                  <div key={label as string}>
                    <div className="flex justify-between text-[13px] text-white/70"><span>{label}</span><span className="font-semibold text-white">{v}</span></div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${color} ${anim}`} style={{ width: `${((v as number) / scale) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {!mine && (
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Example of what shapes it">
                  {drivers.map((d, i) => (
                    <li key={d.label} className="bp-pill inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px] text-white/85" style={{ animationDelay: `${0.9 + i * 0.25}s` }}>
                      {d.label}<b className={d.good ? "text-[#7FE0B8]" : "text-sun"}>{d.years}</b>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
