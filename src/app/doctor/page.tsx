export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { Logo } from "@/components/ui";
import { bookableConsultTypes, type ConsultType } from "@/lib/consults";
import { currentUser, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { discountLabel } from "@/lib/plan/perks";
import { isActive, type PlanRow } from "@/lib/plan/server";
import { loadPlanSettings } from "@/lib/plan/settings";
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
  // Health plan perk: members see their lower price; everyone else sees the offer.
  const plan = await loadPlanSettings().catch(() => null);
  let isMember = false;
  if (supabaseConfigured()) {
    const user = await currentUser().catch(() => null);
    if (user) {
      const { data } = await supabaseAdmin().from("plans").select("status, paid_until").eq("user_id", user.id).maybeSingle();
      isMember = !!data && isActive(data as PlanRow);
    }
  }
  const perk = plan && discountLabel(plan.discount) ? { isMember, discount: plan.discount, label: discountLabel(plan.discount), planPrice: plan.price } : null;
  const preselect = sp.reason === "support" ? "mental-health" : typeof sp.type === "string" ? sp.type : null;
  return (
    <main className="mx-auto w-full max-w-[640px] px-5">
      <div className="flex h-[72px] items-center justify-between">
        <Logo />
        <LeaveBookingButton />
      </div>
      <BookingForm perk={perk} types={types} preselect={preselect} defaultReason={sp.reason === "support" ? "I'd like to talk to someone about how I've been feeling." : ""} />
    </main>
  );
}
