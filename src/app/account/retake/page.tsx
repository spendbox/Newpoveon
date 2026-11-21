export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/server";
import { getAccount } from "../data";
import { StartRetake } from "./start-retake";

export const metadata: Metadata = { title: "Retake the check", robots: { index: false } };

/** One tap from anywhere in the dashboard: loads your last answers and opens the check. */
export default async function RetakePage() {
  if (!supabaseConfigured()) redirect("/check");
  const { user, history } = await getAccount();
  return <StartRetake answers={history[0]?.answers ?? null} email={user.email ?? ""} />;
}
