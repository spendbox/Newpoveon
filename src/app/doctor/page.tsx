export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { Logo } from "@/components/ui";
import { bookableConsultTypes, type ConsultType } from "@/lib/consults";
import { supabaseConfigured } from "@/lib/supabase/server";
import { BookingForm } from "./booking-form";

export const metadata: Metadata = { title: "Get help with a health concern" };

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
    <main className="mx-auto w-full max-w-[560px] px-5 pt-6">
      <Logo />
      <div className="mt-7">
        <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">Get medical help</p>
        <h1 className="mt-2 text-[32px] leading-[1.05] font-bold md:text-[40px]">What can we help you with?</h1>
        <p className="mt-3 text-[17px] text-muted">
          Tell us what&apos;s going on. We&apos;ll match you with the right doctor for your concern, and show you the fee before you pay. No login needed.
        </p>
      </div>
      <BookingForm types={types} preselect={preselect} defaultReason={sp.reason === "support" ? "I'd like to talk to someone about how I've been feeling." : ""} />
    </main>
  );
}
