import type { Metadata } from "next";
import { site } from "@/config/site";
import { Icon } from "@/components/icons";
import { IllustrationCard } from "@/components/illustrations";
import { Logo } from "@/components/ui";
import { BookingForm } from "./booking-form";

export const metadata: Metadata = { title: "Talk to a doctor" };

export default async function DoctorPage({ searchParams }: PageProps<"/doctor">) {
  const sp = await searchParams;
  const support = sp.reason === "support";
  return (
    <main className="mx-auto w-full max-w-[430px] px-6 pt-7 md:max-w-2xl">
      <Logo />
      <div className="mt-5 md:grid md:grid-cols-[1fr_1.2fr] md:items-start md:gap-8">
        <div>
          <IllustrationCard name="doctor" />
          <h1 className="mt-5 text-[32px] leading-[1.05]">Talk to a doctor for ₦{site.consultPriceNaira.toLocaleString("en-NG")}</h1>
          <p className="mt-2 text-[17px] text-muted">
            A {site.consultMinutes}-minute phone or WhatsApp consult with a qualified Nigerian physician. No login needed. Pay securely with Paystack.
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-[15px] font-bold">
            <li className="flex gap-2"><Icon name="check" size={20} /> Pick a time that suits you</li>
            <li className="flex gap-2"><Icon name="check" size={20} /> Share your results so you don&apos;t repeat yourself</li>
            <li className="flex gap-2"><Icon name="check" size={20} /> Prescriptions and home tests arranged if needed</li>
          </ul>
        </div>
        <BookingForm defaultReason={support ? "I'd like to talk to someone about how I've been feeling." : ""} />
      </div>
    </main>
  );
}
