import type { Metadata } from "next";
import { IllustrationCard } from "@/components/illustrations";
import { Logo } from "@/components/ui";
import { RequestForm } from "@/components/request-form";

export const metadata: Metadata = { title: "Medication delivery" };

export default function MedicationPage() {
  return (
    <main className="mx-auto w-full max-w-[430px] px-6 pt-7 md:max-w-2xl">
      <Logo />
      <IllustrationCard name="delivery" className="mt-5" />
      <h1 className="mt-5 text-[32px] leading-[1.05]">Medication delivery</h1>
      <p className="mt-2 text-[17px] text-muted">Tell us what you need and where. Our team will confirm the price and delivery time with you.</p>
      <div className="mt-4 rounded-[var(--radius-md)] bg-check-bg p-4 text-sm font-medium text-check-text">
        Prescription medicines are only supplied after a consult with one of our doctors. If you need a prescription medicine, book a doctor first. It&apos;s ₦5,000 and the doctor can prescribe if it&apos;s right for you.
      </div>
      <RequestForm kind="medication" tests={[]} preselect={null} />
    </main>
  );
}
