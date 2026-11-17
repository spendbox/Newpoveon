export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { Icon } from "@/components/icons";
import { ButtonLink, Logo, Notice, ResultCard } from "@/components/ui";
import { formatWhen } from "@/lib/email";
import type { Results } from "@/lib/scoring/results";
import { currentUser, supabaseConfigured, supabaseUser } from "@/lib/supabase/server";
import { DeleteAccount, UseLatestAnswers } from "./account-actions";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

type Row = { id: string; created_at: string; heart_age: number | null; risk_percent: number | null; results: Results; answers: Record<string, unknown> };

export default async function AccountPage() {
  if (!supabaseConfigured()) {
    return (
      <main className="mx-auto w-full max-w-[430px] px-6 pt-7">
        <Logo />
        <h1 className="mt-6 text-[30px]">My account</h1>
        <div className="mt-4"><Notice tone="warn">Accounts aren&apos;t switched on yet.</Notice></div>
      </main>
    );
  }
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");

  // Row-level security makes sure this only returns the person's own data.
  const sb = await supabaseUser();
  const [{ data: rows }, { data: bookings }] = await Promise.all([
    sb.from("screenings").select("id, created_at, heart_age, risk_percent, results, answers").order("created_at", { ascending: false }).limit(50),
    sb.from("bookings").select("id, slot_starts_at, status, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  const history = (rows ?? []) as Row[];
  const latest = history[0];
  const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: site.timeZone });

  return (
    <main className="mx-auto w-full max-w-[430px] px-6 pt-7 md:max-w-3xl">
      <div className="flex items-center justify-between">
        <Logo />
        <form action="/auth/signout" method="post">
          <button className="min-h-[44px] rounded-full bg-surface px-4 text-sm font-extrabold">Log out</button>
        </form>
      </div>
      <h1 className="mt-6 text-[30px] leading-[1.05]">Hello!</h1>
      <p className="mt-1 text-muted">Logged in as {user.email}</p>

      {!latest ? (
        <section className="mt-6 rounded-[var(--radius-lg)] bg-surface p-5">
          <h2 className="text-2xl">No results yet</h2>
          <p className="mt-1 text-muted">Do your check and your results will be saved here.</p>
          <ButtonLink href="/check" className="mt-4 w-full" iconRight="arrowRight">Start my check</ButtonLink>
        </section>
      ) : (
        <>
          <section className="mt-6 rounded-[var(--radius-lg)] bg-ink p-5 text-white">
            <p className="text-[13px] font-extrabold tracking-[0.08em] text-[#BFE3D6] uppercase">Latest check · {dateFmt.format(new Date(latest.created_at))}</p>
            {latest.results.heart ? (
              <p className="mt-1 font-display text-4xl font-extrabold">Heart age <span className="text-coral">{latest.heart_age}</span> <span className="text-xl text-[#DDEFE8]">({latest.risk_percent}% risk)</span></p>
            ) : (
              <p className="mt-1 font-display text-2xl font-extrabold">{latest.results.heartNote ?? "Results saved"}</p>
            )}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/account/edit" icon="edit">Update my answers</ButtonLink>
              <UseLatestAnswers answers={latest.answers} />
            </div>
          </section>

          <section className="mt-6" aria-labelledby="changes">
            <h2 id="changes" className="text-2xl">How you&apos;re changing</h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {history.map((h, i) => {
                const prev = history[i + 1];
                const changes: string[] = [];
                if (prev?.heart_age && h.heart_age && prev.heart_age !== h.heart_age) changes.push(`Heart age ${prev.heart_age} → ${h.heart_age}`);
                const d = (r: Results) => r.cards.find((c) => c.id === "diabetes")?.value;
                if (prev && d(prev.results) && d(h.results) && d(prev.results) !== d(h.results)) changes.push(`Diabetes risk ${d(prev.results)} → ${d(h.results)}`);
                const b = (r: Results) => r.cards.find((c) => c.id === "body")?.value;
                if (prev && b(prev.results) !== b(h.results) && b(h.results)) changes.push(`${b(prev.results) ?? "BMI ?"} → ${b(h.results)}`);
                return (
                  <li key={h.id} className="rounded-[var(--radius-md)] bg-surface p-4">
                    <p className="text-sm font-extrabold text-muted-soft">{dateFmt.format(new Date(h.created_at))}</p>
                    <p className="font-display text-xl font-extrabold">{h.heart_age ? `Heart age ${h.heart_age} · ${h.risk_percent}%` : "No heart age"}</p>
                    {changes.length > 0 && (
                      <ul className="mt-1 flex flex-wrap gap-1.5">
                        {changes.map((c) => <li key={c} className="rounded-full bg-ground px-2.5 py-1 text-xs font-extrabold">{c}</li>)}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-6" aria-labelledby="latest-cards">
            <h2 id="latest-cards" className="text-2xl">Your latest results</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {latest.results.cards.map((c) => <ResultCard key={c.id} card={c} />)}
            </div>
          </section>
        </>
      )}

      {bookings && bookings.length > 0 && (
        <section className="mt-6" aria-labelledby="bookings">
          <h2 id="bookings" className="text-2xl">Your doctor bookings</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-surface p-4 text-sm font-bold">
                <Icon name="clock" size={20} />
                {b.slot_starts_at ? formatWhen(b.slot_starts_at) : "Time to be agreed"} · {b.status === "pending_payment" ? "Not paid" : b.status}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 rounded-[var(--radius-lg)] bg-surface p-5">
        <h2 className="text-xl">Your data</h2>
        <p className="mt-1 text-sm text-muted">You can delete your account and every result saved with your email. This can&apos;t be undone. <Link href="/privacy" className="underline">Privacy notice</Link></p>
        <DeleteAccount />
      </section>
    </main>
  );
}
