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
import { MemberId } from "@/components/member-id";
import { Icon } from "@/components/icons";
import Link from "next/link";
import { differenceText } from "@/lib/bioage/phenoage";
import { myBioAges, myMemberCode } from "@/lib/bioage/server";
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
  const [bio, code] = await Promise.all([myBioAges(), myMemberCode(user.id)]);
  const latest = history[0];
  const fmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: site.timeZone });
  return (
    <>
      <PageHead eyebrow="Your health dashboard" title="Hello again" sub={latest ? `Last check ${fmt.format(new Date(latest.created_at))}` : undefined} />
      <BioAgeLink latest={bio[0] ?? null} />
      <OverviewPanel history={history} plan={planSummary} />
      {code && <div className="mt-8"><MemberId code={code} compact /></div>}
    </>
  );
}

/** Dashboard link to the biological age page: the latest result, or an invitation to book. */
function BioAgeLink({ latest }: { latest: { pheno_age: number; age_years: number } | null }) {
  return (
    <Link href="/account/bio-age" className="group mb-6 flex items-center gap-4 rounded-[var(--radius-xl)] border border-line bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-md)]">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-lavender-soft text-lavender"><Icon name="dna" size={24} strokeWidth={2} /></span>
      <span className="min-w-0 flex-1">
        {latest ? (
          <><span className="block font-semibold">Biological age: {Math.round(latest.pheno_age)}</span><span className="block text-sm text-muted">{differenceText(latest.pheno_age - latest.age_years)}</span></>
        ) : (
          <><span className="block font-semibold">New: find your biological age</span><span className="block text-sm text-muted">One home blood test. See how old your body really is.</span></>
        )}
      </span>
      <Icon name="arrowRight" size={18} strokeWidth={2} className="shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
