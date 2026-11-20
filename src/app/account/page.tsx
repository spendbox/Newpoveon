export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo, Notice } from "@/components/ui";
import { currentUser, supabaseConfigured, supabaseUser } from "@/lib/supabase/server";
import { Dashboard, type Row } from "./dashboard";

export const metadata: Metadata = { title: "My account", robots: { index: false } };


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
  return <Dashboard email={user.email ?? ""} history={(rows ?? []) as Row[]} bookings={bookings ?? []} />;
}
