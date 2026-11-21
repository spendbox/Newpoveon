export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { site } from "@/config/site";
import { Logo, Notice } from "@/components/ui";
import { supabaseConfigured } from "@/lib/supabase/server";
import { getAccount } from "./data";
import { weekScore } from "@/lib/plan/engine";
import { isActive, loadPlan } from "@/lib/plan/server";
import { discountLabel } from "@/lib/plan/perks";
import { loadPlanSettings } from "@/lib/plan/settings";
import { OverviewPanel, PageHead } from "./panels";

export const metadata: Metadata = { title: "My dashboard", robots: { index: false } };

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
  const { user, history } = await getAccount();
  const loaded = await loadPlan(user.id).catch(() => null);
  const planSummary = loaded && isActive(loaded.plan)
    ? { active: true, week: loaded.goals[0]?.progress.week ?? 1, pct: (() => { const s = weekScore(loaded.goals.map((g) => g.progress)); return s.needed ? Math.round((s.done / s.needed) * 100) : 0; })() }
    : { active: false, perk: discountLabel((await loadPlanSettings()).discount) };
  const latest = history[0];
  const fmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: site.timeZone });
  return (
    <>
      <PageHead eyebrow="Your health dashboard" title="Hello again" sub={latest ? `Last check ${fmt.format(new Date(latest.created_at))}` : undefined} />
      <OverviewPanel history={history} plan={planSummary} />
    </>
  );
}
