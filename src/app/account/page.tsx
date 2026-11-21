export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { site } from "@/config/site";
import { Logo, Notice } from "@/components/ui";
import { supabaseConfigured } from "@/lib/supabase/server";
import { getAccount } from "./data";
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
  const { history } = await getAccount();
  const latest = history[0];
  const fmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: site.timeZone });
  return (
    <>
      <PageHead eyebrow="Your health dashboard" title="Hello again" sub={latest ? `Last check ${fmt.format(new Date(latest.created_at))}` : undefined} />
      <OverviewPanel history={history} />
    </>
  );
}
