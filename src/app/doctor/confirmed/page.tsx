import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { IllustrationCard } from "@/components/illustrations";
import { ButtonLink, Logo, Notice } from "@/components/ui";
import { formatWhen } from "@/lib/email";
import { confirmBookingPayment, paystackConfigured } from "@/lib/paystack";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Booking confirmed", robots: { index: false } };

/** Paystack sends people back here with ?reference=… We verify on the server before showing "paid". */
export default async function ConfirmedPage({ searchParams }: PageProps<"/doctor/confirmed">) {
  const sp = await searchParams;
  const reference = typeof sp.reference === "string" && /^HC-[A-Za-z0-9_-]{6,40}$/.test(sp.reference) ? sp.reference : null;
  let paid = false;
  let booking: { name: string; slot_starts_at: string | null; needs_reschedule: boolean; amount_kobo: number; doctor_type: string | null } | null = null;
  if (reference && supabaseConfigured() && paystackConfigured()) {
    try {
      paid = (await confirmBookingPayment(reference, "verify")).paid;
      const { data } = await supabaseAdmin().from("bookings").select("name, slot_starts_at, needs_reschedule, status, amount_kobo, doctor_type").eq("paystack_reference", reference).single();
      if (data) {
        booking = data;
        paid = paid || data.status === "paid";
      }
    } catch (e) {
      console.error("[confirm]", (e as Error).message);
    }
  }
  const wa = whatsappLink(`Hello, I just booked a doctor consult. My reference is ${reference ?? ""}.`);
  return (
    <main className="mx-auto w-full max-w-[430px] px-6 pt-7">
      <Logo />
      <IllustrationCard name={paid ? "doctor" : "checklist"} className="mt-5" />
      {paid ? (
        <>
          <h1 className="mt-5 text-[30px] leading-[1.05]">You&apos;re booked{booking ? `, ${booking.name.split(" ")[0]}` : ""}!</h1>
          <p className="mt-2 text-[17px] text-muted">We&apos;ve received your {booking ? `₦${(booking.amount_kobo / 100).toLocaleString("en-NG")} ` : ""}payment and emailed your confirmation.{booking?.doctor_type ? ` You'll speak with a ${booking.doctor_type.toLowerCase()}.` : ""}</p>
          <div className="mt-4 flex items-center gap-3 rounded-[var(--radius-md)] bg-good-bg p-4 text-good-text">
            <Icon name="clock" size={24} />
            <p className="font-semibold">{booking?.slot_starts_at ? formatWhen(booking.slot_starts_at) : "We'll call you to agree a time."}</p>
          </div>
          {booking?.needs_reschedule && <div className="mt-3"><Notice tone="warn">That time was taken while you were paying. Our team will call you to pick a new one.</Notice></div>}
          <p className="mt-3 text-sm font-medium text-subtle">Reference: {reference}</p>
        </>
      ) : (
        <>
          <h1 className="mt-5 text-[30px] leading-[1.05]">We&apos;re checking your payment</h1>
          <p className="mt-2 text-[17px] text-muted">
            If you completed payment, your confirmation email will arrive shortly. If something went wrong, no money was taken. You can try again or message us.
          </p>
          {reference && <p className="mt-3 text-sm font-medium text-subtle">Reference: {reference}</p>}
        </>
      )}
      <div className="mt-6 flex flex-col gap-3">
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-strong bg-[#25D366] text-[19px] font-semibold">
            <Icon name="whatsapp" size={24} /> Chat on WhatsApp
          </a>
        )}
        {!paid && <ButtonLink href="/doctor" variant="secondary">Try booking again</ButtonLink>}
        <ButtonLink href="/" variant="secondary">Back to home</ButtonLink>
      </div>
    </main>
  );
}
