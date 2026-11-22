import { Icon } from "@/components/icons";
import { BIO_AGE_PREP, BIO_AGE_TESTS, differenceText, MARKER_BY_KEY, phenoAge } from "@/lib/bioage/phenoage";
import type { BioAgeRow } from "@/lib/bioage/server";

const dayFmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const day = (d: string) => new Date(`${d}T12:00:00Z`);

export function Latest({ row }: { row: BioAgeRow }) {
  const r = phenoAge(row.age_years, row.markers);
  const diff = row.pheno_age - row.age_years;
  const helping = r.drivers.filter((d) => d.years <= -0.5).slice(0, 3);
  const adding = r.drivers.filter((d) => d.years >= 0.5).slice(0, 3);
  return (
    <>
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] bg-ink p-6 text-white md:p-8" aria-label="Your latest biological age">
        <span className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
        <p className="relative text-[13px] font-semibold tracking-[0.08em] text-white/65 uppercase">Your biological age</p>
        <p className="relative mt-1 font-display text-[64px] leading-none font-bold">{Math.round(row.pheno_age)}</p>
        <p className={`relative mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-semibold ${diff <= -0.5 ? "bg-good-bg text-good-text" : diff >= 0.5 ? "bg-sun text-ink" : "bg-white/15 text-white"}`}>
          {diff <= -0.5 ? <Icon name="check" size={14} strokeWidth={3} /> : null}{differenceText(diff)}
        </p>
        <p className="relative mt-3 text-[14px] text-white/70">Real age {Math.floor(row.age_years)} · blood taken {dayFmt.format(day(row.sample_date))}</p>
      </section>

      {row.notes && (
        <section className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
          <p className="flex items-center gap-2 font-semibold"><Icon name="stethoscope" size={18} strokeWidth={2} className="text-primary" /> A note from our team</p>
          <p className="mt-1 text-[15px] whitespace-pre-line text-muted">{row.notes}</p>
        </section>
      )}

      {(helping.length > 0 || adding.length > 0) && (
        <section aria-labelledby="drivers">
          <h2 id="drivers" className="text-xl font-semibold">What&apos;s shaping it</h2>
          <p className="text-[14px] text-muted">Compared with a typical healthy result. Rough years, to show what matters most.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <DriverList title="Taking years off" tone="good" items={helping} values={row.markers} />
            <DriverList title="Adding years" tone="warn" items={adding} values={row.markers} />
          </div>
        </section>
      )}
    </>
  );
}

function DriverList({ title, tone, items, values }: { title: string; tone: "good" | "warn"; items: { key: keyof typeof MARKER_BY_KEY; years: number }[]; values: Record<string, number> }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
      <p className={`text-[13px] font-semibold tracking-[0.06em] uppercase ${tone === "good" ? "text-good-text" : "text-check-text"}`}>{title}</p>
      {items.length === 0 ? <p className="mt-2 text-[15px] text-muted">{tone === "good" ? "Nothing stood out this time." : "Nothing is adding years. Great work."}</p> : (
        <ul className="mt-2 flex flex-col gap-3">
          {items.map((d) => {
            const m = MARKER_BY_KEY[d.key];
            return (
              <li key={d.key} className="flex gap-3">
                <span className={`mt-0.5 flex h-9 min-w-[52px] shrink-0 items-center justify-center rounded-full px-2 text-[13px] font-bold ${tone === "good" ? "bg-good-bg text-good-text" : "bg-check-bg text-check-text"}`}>{d.years > 0 ? "+" : "−"}{Math.abs(d.years).toFixed(1)}y</span>
                <span>
                  <span className="block font-semibold">{m.name} <span className="font-normal text-muted">· {Math.round(values[d.key] * 10) / 10} {m.units[0].label}</span></span>
                  <span className="block text-[14px] leading-snug text-muted">{m.about}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Intro() {
  return (
    <section className="rounded-[var(--radius-xl)] border border-line bg-surface p-5 md:p-7">
      <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name="dna" size={24} strokeWidth={2} /></span>
      <h2 className="mt-4 text-2xl font-semibold">How old is your body, really?</h2>
      <p className="mt-1 text-[16px] text-muted">One home blood test gives nine routine results. We turn them into your biological age, show what&apos;s adding or taking away years, and track it here each time you re-test.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">What&apos;s tested</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-[15px]">
            {BIO_AGE_TESTS.map((t) => <li key={t} className="flex gap-2"><Icon name="check" size={16} strokeWidth={2.4} className="mt-1 shrink-0 text-primary" />{t}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">Before the test</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-[15px]">
            {BIO_AGE_PREP.map((t) => <li key={t} className="flex gap-2"><Icon name="clock" size={16} strokeWidth={2.2} className="mt-1 shrink-0 text-primary" />{t}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
