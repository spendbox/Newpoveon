export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/server";
import { getAccount } from "../data";
import { ProgressPanel, PageHead } from "../panels";

export const metadata: Metadata = { title: "My progress", robots: { index: false } };

export default async function Page() {
  if (!supabaseConfigured()) redirect("/account");
  const { history } = await getAccount();
  return (
    <>
      <PageHead eyebrow="My health" title="My progress" sub="How your scores are changing over time." />
      <ProgressPanel history={history} />
    </>
  );
}
