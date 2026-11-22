/**
 * "Built on tools doctors trust": the organisations and screening tools behind each score, shown as
 * text wordmarks (not their official logos, which can't be used without permission and could suggest
 * an endorsement). Scrolls gently on its own; for reduced motion it sits still and can be swiped.
 */
const TOOLS: { mark: string; full: string; use: string; tint: string }[] = [
  { mark: "WHO", full: "World Health Organization", use: "Heart risk, weight, activity, wellbeing", tint: "text-[#0F6CB6]" },
  { mark: "ISH", full: "International Society of Hypertension", use: "Blood pressure", tint: "text-[#B4233C]" },
  { mark: "FINDRISC", full: "Finnish Diabetes Risk Score", use: "Diabetes risk", tint: "text-[#1E5AA8]" },
  { mark: "PHQ-9", full: "Patient Health Questionnaire", use: "Mood", tint: "text-lavender" },
  { mark: "GAD-7", full: "Generalised Anxiety Disorder scale", use: "Worry", tint: "text-[#6A4FB3]" },
  { mark: "AUDIT-C", full: "Alcohol Use Disorders Identification Test", use: "Alcohol", tint: "text-[#B5651D]" },
  { mark: "STOP-Bang", full: "Sleep apnoea questionnaire", use: "Snoring and sleep apnoea", tint: "text-[#25527A]" },
  { mark: "AASM", full: "American Academy of Sleep Medicine", use: "Sleep hours", tint: "text-[#2E3F8F]" },
  { mark: "NICE", full: "National Institute for Health and Care Excellence", use: "Waist-to-height", tint: "text-[#4A2A6B]" },
];

function Card({ t, copy }: { t: (typeof TOOLS)[number]; copy?: boolean }) {
  return (
    <li aria-hidden={copy || undefined} className={`${copy ? "tt-copy " : ""}w-[200px] shrink-0 rounded-[var(--radius-lg)] border border-line bg-surface px-4 py-3.5 shadow-[var(--shadow-sm)]`}>
      <span className={`block font-display text-[24px] leading-none font-extrabold tracking-tight whitespace-nowrap ${t.tint}`}>{t.mark}</span>
      <span className="mt-1.5 block line-clamp-2 min-h-[2.5em] text-[12px] leading-tight text-subtle">{t.full}</span>
      <span className="mt-2 block text-[13px] leading-snug font-medium text-ink">{t.use}</span>
    </li>
  );
}

export function TrustedTools() {
  return (
    <section className="py-10" aria-labelledby="trusted">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-primary uppercase">The science behind it</p>
      <h2 id="trusted" className="mt-2 text-3xl font-bold md:text-[40px]">Built on tools doctors trust</h2>
      <p className="mt-2 max-w-xl text-[16px] text-muted">Every score comes from a published, validated screening tool or guideline.</p>

      <div className="tt-viewport relative mt-6 -mx-5 overflow-hidden px-5 md:mx-0 md:px-0">
        <ul className="tt-track flex w-max gap-3" aria-label="Screening tools and guidelines we use">
          {TOOLS.map((t) => <Card key={t.mark} t={t} />)}
          {/* A second copy makes the scroll loop seamless; hidden from screen readers. */}
          {TOOLS.map((t) => <Card key={`${t.mark}-2`} t={t} copy />)}
        </ul>
        <span className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-ground to-transparent" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-ground to-transparent" aria-hidden="true" />
      </div>

      <p className="mt-4 text-[12px] text-subtle">Names belong to their owners. Poveon is not affiliated with or endorsed by these organisations.</p>
    </section>
  );
}
