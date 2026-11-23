export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { Icon } from "@/components/icons";
import { ButtonLink, Notice } from "@/components/ui";
import type { Answers } from "@/lib/questions";
import { lagosDay } from "@/lib/plan/engine";
import { confirmPlanPayment, isActive, loadPlan, planHints } from "@/lib/plan/server";
import { supabaseConfigured } from "@/lib/supabase/server";
import { getAccount } from "../data";
import { discountLabel } from "@/lib/plan/perks";
import { loadPlanSettings } from "@/lib/plan/settings";
import { PageHead } from "../panels";
import { PlanBuilder } from "./plan-builder";
import { PlanHome } from "./plan-home";
import { personalAim, personalExtras, personalWhy, planFocus } from "@/lib/plan/personal";

export const metadata: Metadata = { title: "My plan", robots: { index: false } };

/** A personal plan for moving, sleep, weight, eating and calm, with daily ticks and weekly check-ins. */
export default async function PlanPage({ searchParams }: PageProps<"/account/plan">) {
  if (!supabaseConfigured()) redirect("/account");
  const sp = await searchParams;
  const { user, history } = await getAccount();
  const reference = typeof sp.reference === "string" && /^PL-[A-Za-z0-9_-]{6,40}$/.test(sp.reference) ? sp.reference : null;
  let justPaid = false, payFailed = false;
  if (reference) {
    try {
      justPaid = (await confirmPlanPayment(reference, "verify")).paid;
      payFailed = !justPaid;
    } catch (e) {
      console.error("[plan confirm]", (e as Error).message);
      payFailed = true;
    }
  }
  const settings = await loadPlanSettings();
  const perkLabel = discountLabel(settings.discount);
  const today = lagosDay();
  const loaded = await loadPlan(user.id, today);
  const active = isActive(loaded?.plan, today);
  const latest = history[0];
  const hints = planHints((latest?.answers ?? null) as Answers | null, latest?.results ?? null);
  const recheckDue = !!latest && Date.now() - new Date(latest.created_at).getTime() > 84 * 864e5; // eslint-disable-line react-hooks/purity

  if (active && loaded && sp.edit !== "1") {
    const answers = (latest?.answers ?? {}) as Answers;
    const personal = {
      checkDate: latest?.created_at ?? null,
      focus: planFocus(latest?.results ?? null),
      extras: personalExtras(latest?.results ?? null),
      goals: Object.fromEntries(loaded.goals.map((g) => [g.id, { why: personalWhy(g.area, answers, latest?.results ?? null), aim: personalAim({ area: g.area, settings: g.settings }) }])),
    };
    return (
      <>
        <PageHead eyebrow="My plan" title="Your plan" sub="Tick things off each day. Your targets adjust every week." />
        {justPaid && <div className="mb-4"><Notice tone="good">You&apos;re all set. Your plan starts this week, and we&apos;ve emailed you the details.</Notice></div>}
        <PlanHome personal={personal} perkLabel={perkLabel} goals={loaded.goals} today={today} paidUntil={loaded.plan.paid_until!} startsOn={loaded.plan.starts_on ?? today} reminders={loaded.plan.reminders} recheckDue={recheckDue} />
      </>
    );
  }

  if (active && loaded) {
    return (
      <>
        <PageHead eyebrow="My plan" title="Change my plan" sub="Change what you're working on or how. Your progress so far is kept." />
        <div className="max-w-2xl">
          <PlanBuilder hints={hints} existing={loaded.goals.map((g) => ({ area: g.area, settings: g.settings }))} active expired={false} price={settings.price} perkLabel={perkLabel} />
        </div>
      </>
    );
  }

  // No active plan: it comes with a paid health check.
  const ended = loaded?.plan.status === "expired" || (loaded?.plan.status === "active" && !active);
  const ngn = `₦${settings.price.toLocaleString("en-NG")}`;
  return (
    <>
      <PageHead eyebrow="My plan" title={ended ? "Your plan has ended" : "Get your personal plan"} />
      {payFailed && <div className="mb-4"><Notice tone="warn">We couldn&apos;t confirm your payment. If you were charged, it will show here within a few minutes, or contact us at {site.legal.email}.</Notice></div>}
      <section className="max-w-2xl rounded-[var(--radius-xl)] border border-line bg-surface p-6">
        <p className="text-[17px] text-ink/85">
          {ended ? `Take a new check to see how your scores have moved and renew your plan for another ${settings.months} months. Your history is kept.` : `Your plan comes with your health check. For ${ngn} you get your full results and a personal plan for ${settings.months} months, made from them.`}
        </p>
        <ul className="mt-4 flex flex-col gap-2 text-[15px]">
          {["Move more, sleep better, lose weight, eat better or feel calmer: up to 3 at a time", "A daily check-off and a weekly review that adjusts your targets", "Sunday summaries and a midweek nudge by email", ...(perkLabel ? [`${perkLabel} every doctor consultation while your plan is active`] : [])].map((x) => (
            <li key={x} className="flex gap-2"><Icon name="check" size={18} strokeWidth={2.6} className="mt-0.5 shrink-0 text-primary" />{x}</li>
          ))}
        </ul>
        <ButtonLink href={latest ? "/account/retake" : "/check"} className="mt-6" iconRight="arrowRight">{ended ? "Take a new check" : "Take the check"} · {ngn}</ButtonLink>
      </section>
    </>
  );
}
