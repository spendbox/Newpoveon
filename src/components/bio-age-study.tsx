import { Icon, type IconName } from "./icons";

/**
 * Which study the biological age comes from, and how accurate it is, in plain words.
 * Source: Levine ME, et al. An epigenetic biomarker of aging for lifespan and healthspan. Aging 2018;10:573–591.
 */
export const BIO_STUDY_SHORT = "Based on a Yale University study of nearly 10,000 adults";

const POINTS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "clipboard", title: "The study we use",
    text: "Scientists at Yale University in the USA created this method, called PhenoAge, in 2018. They looked at the blood tests and health of nearly 10,000 adults over many years, then checked it again on thousands more.",
  },
  {
    icon: "heart", title: "What they found",
    text: "People whose result was older than their real age were more likely to get long-term illnesses, like heart disease and diabetes, and to die earlier. Each extra year on the result meant about a 9% higher risk.",
  },
  {
    icon: "target", title: "How accurate it is",
    text: "It's good at showing who is likely to stay healthy for longer. For one person, treat it as a guide, not an exact number: a difference of 1 or 2 years is about the same.",
  },
  {
    icon: "alert", title: "What can change it",
    text: "A recent cold, fever or infection can make it look older for a few weeks. That's why we ask you to test when you're well, and to re-test to see the trend.",
  },
  {
    icon: "family", title: "Who it was tested on",
    text: "The study was done on adults in the USA, including Black Americans. It hasn't yet been tested on large groups of Nigerians, so we show it as an estimate.",
  },
  {
    icon: "stethoscope", title: "What it isn't",
    text: "It's not a diagnosis, and it can't tell you how long you will live. If any of your results worry you, talk to one of our doctors.",
  },
];

export function BioAgeStudy({ id, className = "" }: { id?: string; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-6 ${className}`} aria-labelledby={`${id ?? "bio"}-study-title`}>
      <h2 id={`${id ?? "bio"}-study-title`} className="text-xl font-semibold md:text-2xl">The science, and how accurate it is</h2>
      <p className="mt-1 text-[15px] text-muted">In simple words: where the number comes from, and how much to trust it.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {POINTS.map((p) => (
          <article key={p.title} className="flex gap-3.5 rounded-[var(--radius-xl)] border border-line bg-surface p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name={p.icon} size={20} strokeWidth={2} /></span>
            <span>
              <span className="block font-semibold">{p.title}</span>
              <span className="mt-0.5 block text-[15px] leading-snug text-muted">{p.text}</span>
            </span>
          </article>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-subtle">Source: Levine ME and others. An epigenetic biomarker of aging for lifespan and healthspan. Aging, 2018.</p>
    </section>
  );
}
