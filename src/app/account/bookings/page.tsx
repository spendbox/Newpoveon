export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/server";
import { getAccount } from "../data";
import { BookingsPanel, PageHead } from "../panels";

export const metadata: Metadata = { title: "Doctor bookings", robots: { index: false } };

export default async function Page() {
  if (!supabaseConfigured()) redirect("/account");
  const { bookings } = await getAccount();
  return (
    <>
      <PageHead eyebrow="Care" title="Doctor bookings" sub="Your consults with Poveon doctors." />
      <BookingsPanel bookings={bookings} />
    </>
  );
}
