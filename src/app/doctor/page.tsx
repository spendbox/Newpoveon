export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { Logo } from "@/components/ui";
import { bookableConsultTypes, type ConsultType } from "@/lib/consults";
import { supabaseConfigured } from "@/lib/supabase/server";
import { BookingForm, LeaveBookingButton } from "./booking-form";

export const metadata: Metadata = { title: "Get help with a health concern" };

/** A full-screen, app-like flow: what you need → safety check → tell us → who you'll see → time → details → pay. */
export default async function DoctorPage({ searchParams }: PageProps<"/doctor">) {
  const sp = await searchParams;
  let types: ConsultType[] = [];
  if (supabaseConfigured()) {
    try {
      types = await bookableConsultTypes();
    } catch {
      /* page still renders, with the WhatsApp fallback */
    }
  }
  const preselect = sp.reason === "support" ? "mental-health" : typeof sp.type === "string" ? sp.type : null;
  return (
    <main className="mx-auto w-full max-w-[640px] px-5">
      <div className="flex h-[72px] items-center justify-between">
        <Logo />
        <LeaveBookingButton />
      </div>
      <BookingForm types={types} preselect={preselect} defaultReason={sp.reason === "support" ? "I'd like to talk to someone about how I've been feeling." : ""} />
    </main>
  );
}
