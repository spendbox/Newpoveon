import Link from "next/link";
import { EXTENDED_MIN_AGE, site } from "@/config/site";
import { Icon, type IconName } from "@/components/icons";
import { BodyMap } from "@/components/body-map";
import { Mannequin } from "@/components/mannequin";
import { ScoreTile, WellbeingHero } from "@/components/score-widgets";
import { TrendLine } from "@/components/trend-line";
import { ButtonLink, Logo, Notice, ResultCard } from "@/components/ui";
import { formatWhen } from "@/lib/email";
import type { ResultCard as ResultCardData, Results, Status } from "@/lib/scoring/results";
import { DeleteAccount, UseLatestAnswers } from "./account-actions";

export type Row = { id: string; created_at: string; heart_age: number | null; risk_percent: number | null; results: Results; answers: Record<string, unknown> };
type Booking = { id: string; slot_starts_at: string | null; status: string };

/** The signed-in dashboard. Wellbeing first, then key scores, focus areas, body map, trends and history. */
export function Dashboard({ email, history, bookings }: { email: string; history: Row[]; bookings: Booking[] }) {
  const user = { email };
  const latest = history[0];
  const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: site.timeZone });
  const card = (r: Results, id: ResultCardData["id"]) => r.cards.find((c) => c.id === id);
  const short = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: site.timeZone });
  const chrono = [...history].reverse();
  const wbPoints = chrono.filter((h) => h.results.wellbeing).map((h) => ({ date: short.format(new Date(h.created_at)), value: h.results.wellbeing!.score }));
  const haPoints = chrono.filter((h) => h.heart_age).map((h) => ({ date: short.format(new Date(h.created_at)), value: h.heart_age! }));
  const focus = latest ? latest.results.cards.filter((c) => c.status !== "good").sort((a, b) => (a.status === "act" ? -1 : 0) - (b.status === "act" ? -1 : 0)).slice(0, 3) : [];
  const due = latest ? latest.results.reminders.filter((r) => !r.done) : [];

  const tiles = latest ? (() => {
    const r = latest.results;
    const t: { id: ResultCardData["id"]; icon: IconName; label: string; value: string; note?: string; tone: Status | "neutral" }[] = [];
    const h = card(r, "heart");
    t.push(r.heart
      ? { id: "heart", icon: "heart", label: "Heart age", value: `${r.heart.heartAge.kind === "below" ? "Under " : r.heart.heartAge.kind === "above" ? "Over " : ""}${r.heart.heartAge.value}`, note: `${r.heart.riskPercent}% 10-year risk`, tone: h?.status ?? "neutral" }
      : { id: "heart", icon: "heart", label: "Heart age", value: r.age < EXTENDED_MIN_AGE ? `From ${EXTENDED_MIN_AGE}` : h?.value ?? "Not yet", note: r.age < EXTENDED_MIN_AGE ? "Not calculated under 30" : undefined, tone: h?.status ?? "neutral" });
    for (const [id, icon, label] of [["diabetes", "drop", "Diabetes risk"], ["bp", "gauge", "Blood pressure"], ["body", "scale", "Weight and waist"], ["sleep", "moon", "Sleep"], ["activity", "run", "Moving"]] as const) {
      const c = card(r, id);
      if (c) t.push({ id, icon, label, value: c.value, tone: c.status });
    }
    return t;
  })() : [];

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-6 pb-20">
      <div className="flex items-center justify-between">
        <Logo />
        <form action="/auth/signout" method="post">
          <button className="min-h-[44px] rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-2">Log out</button>
        </form>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">Your health dashboard</p>
          <h1 className="mt-1 text-[34px] leading-[1.05] font-bold md:text-5xl">Hello again</h1>
          <p className="mt-1 text-muted">{user.email}{latest ? ` · last check ${dateFmt.format(new Date(latest.created_at))}` : ""}</p>
        </div>
        {latest && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <UseLatestAnswers answers={latest.answers} />
            <ButtonLink href="/account/edit" variant="secondary" icon="edit">Update my answers</ButtonLink>
          </div>
        )}
      </div>

      {!latest ? (
        <section className="mt-8 grid items-center gap-6 rounded-[var(--radius-xl)] border border-line bg-surface p-6 md:grid-cols-[1fr_200px] md:p-10">
          <div>
            <h2 className="text-3xl font-semibold">Let&apos;s get your first scores</h2>
            <p className="mt-2 text-[17px] text-muted">Take the free 10-minute check. Your wellbeing score, heart age, diabetes risk and more will live here, so you can watch them improve.</p>
            <ButtonLink href="/check" className="mt-6" iconRight="arrowRight">Start my check</ButtonLink>
          </div>
          <div className="mx-auto w-[180px]"><Mannequin crop="upper" className="h-auto w-full" /></div>
        </section>
      ) : (
        <>
          {/* 1. Wellbeing, always on top */}
          <div className="mt-8">
            {latest.results.wellbeing ? (
              <WellbeingHero w={latest.results.wellbeing} date={short.format(new Date(latest.created_at))}>
                {wbPoints.length >= 2 && (
                  <p className="mt-3 text-sm text-white/70">
                    {wbPoints[wbPoints.length - 1].value - wbPoints[wbPoints.length - 2].value >= 0 ? "Up" : "Down"} {Math.abs(wbPoints[wbPoints.length - 1].value - wbPoints[wbPoints.length - 2].value)} points since your last check.
                  </p>
                )}
              </WellbeingHero>
            ) : (
              <section className="flex flex-col gap-4 rounded-[var(--radius-xl)] bg-ink p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
                <div>
                  <p className="text-[13px] font-semibold tracking-[0.08em] text-white/65 uppercase">New: your wellbeing score</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-white">Add your wellbeing score in 1 minute</p>
                  <p className="mt-1 text-[15px] text-white/75">Five quick questions about the last two weeks. It will sit at the top of your dashboard.</p>
                </div>
                <UseLatestAnswers answers={latest.answers} />
              </section>
            )}
          </div>

          {/* 2. Key scores */}
          <section className="mt-8" aria-labelledby="scores">
            <h2 id="scores" className="text-2xl font-semibold">Your key scores</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
              {tiles.map((t) => <ScoreTile key={t.id} href={`/learn/${t.id}`} icon={t.icon} label={t.label} value={t.value} note={t.note} tone={t.tone} />)}
            </div>
          </section>

          {/* 3. Focus areas */}
          <section className="mt-10" aria-labelledby="focus">
            <h2 id="focus" className="text-2xl font-semibold">Where to focus</h2>
            {focus.length === 0 ? (
              <div className="mt-3"><Notice tone="good">Everything is looking good. Check again in a few months to keep it that way.</Notice></div>
            ) : (
              <>
                <p className="mt-1 text-[15px] text-muted">The {focus.length === 1 ? "area" : `${focus.length} areas`} that would make the biggest difference right now.</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">{focus.map((c) => <ResultCard key={c.id} card={c} />)}</div>
              </>
            )}
          </section>

          {/* 4. Body map */}
          <section className="mt-10 rounded-[var(--radius-xl)] border border-line bg-surface p-5 md:p-8" aria-labelledby="map">
            <h2 id="map" className="text-2xl font-semibold">Your body map</h2>
            <p className="mt-1 text-[15px] text-muted">Tap a point to see your result and how to improve it.</p>
            <div className="mt-6"><BodyMap mode="results" results={Object.fromEntries(latest.results.cards.map((c) => [c.id, { status: c.status, value: c.value, summary: c.summary }]))} /></div>
          </section>

          {/* 5. Trends */}
          {(wbPoints.length >= 2 || haPoints.length >= 2) && (
            <section className="mt-10" aria-labelledby="trends">
              <h2 id="trends" className="text-2xl font-semibold">How you&apos;re changing</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {wbPoints.length >= 2 && (
                  <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
                    <p className="font-semibold">Wellbeing score</p>
                    <p className="text-[13px] text-muted">Out of 100. Higher is better.</p>
                    <div className="mt-3"><TrendLine points={wbPoints} label="Wellbeing score over time" /></div>
                  </div>
                )}
                {haPoints.length >= 2 && (
                  <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
                    <p className="font-semibold">Heart age</p>
                    <p className="text-[13px] text-muted">In years. Lower is better.</p>
                    <div className="mt-3"><TrendLine points={haPoints} label="Heart age over time" max={100} /></div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 6. History (also the table view for the charts) */}
          <section className="mt-10" aria-labelledby="history">
            <h2 id="history" className="text-2xl font-semibold">Your checks</h2>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4">
                  <span className="font-semibold">{dateFmt.format(new Date(h.created_at))}</span>
                  <span className="flex flex-wrap gap-1.5 text-[13px]">
                    {h.results.wellbeing && <span className="rounded-full bg-primary-soft px-2.5 py-1 font-semibold text-primary">Wellbeing {h.results.wellbeing.score}</span>}
                    {h.heart_age && <span className="rounded-full bg-coral-soft px-2.5 py-1 font-semibold text-act-text">Heart age {h.heart_age}</span>}
                    {card(h.results, "diabetes") && <span className="rounded-full bg-lavender-soft px-2.5 py-1 font-semibold text-lavender">Diabetes {card(h.results, "diabetes")!.value.toLowerCase()}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* 7. Check-ups due */}
          {due.length > 0 && (
            <section className="mt-10" aria-labelledby="due">
              <h2 id="due" className="text-2xl font-semibold">Check-ups you&apos;re due for</h2>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {due.map((r) => (
                  <li key={r.id} className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
                    <p className="font-semibold">{r.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{r.detail}</p>
                    {r.testCode && <Link href={`/home-tests?test=${r.testCode}`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Arrange it <Icon name="arrowRight" size={14} /></Link>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {bookings && bookings.length > 0 && (
        <section className="mt-10" aria-labelledby="bookings">
          <h2 id="bookings" className="text-2xl font-semibold">Your doctor bookings</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-4 text-sm font-medium">
                <Icon name="clock" size={20} />
                {b.slot_starts_at ? formatWhen(b.slot_starts_at) : "Time to be agreed"} · {b.status === "pending_payment" ? "Not paid" : b.status}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 rounded-[var(--radius-lg)] border border-line bg-surface p-5">
        <h2 className="text-xl font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted">You can delete your account and every result saved with your email. This can&apos;t be undone. <Link href="/privacy" className="underline">Privacy notice</Link></p>
        <DeleteAccount />
      </section>
    </main>
  );
}
