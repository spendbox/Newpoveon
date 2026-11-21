export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { Notice } from "@/components/ui";
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
    return (
      <>
        <PageHead eyebrow="My plan" title="Your plan" sub="Tick things off each day. Your targets adjust every week." />
        {justPaid && <div className="mb-4"><Notice tone="good">You&apos;re all set. Your plan starts this week, and we&apos;ve emailed you the details.</Notice></div>}
        <PlanHome perkLabel={perkLabel} goals={loaded.goals} today={today} paidUntil={loaded.plan.paid_until!} startsOn={loaded.plan.starts_on ?? today} reminders={loaded.plan.reminders} recheckDue={recheckDue} />
      </>
    );
  }

  return (
    <>
      <PageHead eyebrow="My plan" title={active ? "Change my plan" : "Build your plan"}
        sub={active ? "Change what you're working on or how. Your progress so far is kept." : `A personal plan for the things that matter most for your scores, with a daily check-off and a weekly review. ${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(settings.price)} for a whole year${perkLabel ? `, plus ${perkLabel} every doctor consultation` : ""}.`} />
      {payFailed && <div className="mb-4"><Notice tone="warn">We couldn&apos;t confirm your payment. If you were charged, it will show here within a few minutes, or contact us at {site.legal.email}.</Notice></div>}
      {!latest && <div className="mb-4"><Notice>Tip: take the free check first, so we can recommend the right areas and starting points for you.</Notice></div>}
      <div className="max-w-2xl">
        <PlanBuilder hints={hints} existing={(loaded?.goals ?? []).map((g) => ({ area: g.area, settings: g.settings }))} active={active} expired={loaded?.plan.status === "expired"} price={settings.price} perkLabel={perkLabel} />
      </div>
    </>
  );
}
