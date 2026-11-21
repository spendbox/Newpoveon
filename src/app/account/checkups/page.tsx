export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/server";
import { getAccount } from "../data";
import { CheckupsPanel, PageHead } from "../panels";

export const metadata: Metadata = { title: "Check-ups", robots: { index: false } };

export default async function Page() {
  if (!supabaseConfigured()) redirect("/account");
  const { history } = await getAccount();
  return (
    <>
      <PageHead eyebrow="My health" title="Check-ups" sub="Screenings worth booking, based on your age and sex." />
      <CheckupsPanel history={history} />
    </>
  );
}
