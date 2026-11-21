export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/server";
import { getAccount } from "../data";
import { ResultsPanel, PageHead } from "../panels";

export const metadata: Metadata = { title: "My results", robots: { index: false } };

export default async function Page() {
  if (!supabaseConfigured()) redirect("/account");
  const { history } = await getAccount();
  return (
    <>
      <PageHead eyebrow="My health" title="My results" sub="Your latest result for each part of your health, and how to improve it." />
      <ResultsPanel history={history} />
    </>
  );
}
