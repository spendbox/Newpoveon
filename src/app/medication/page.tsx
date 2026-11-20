import type { Metadata } from "next";
import { MED_GROUPS, NAFDAC_CHECK_URL } from "@/config/catalog";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";
import { NafdacDemo } from "@/components/nafdac-demo";
import { WhatsAppCatalog } from "@/components/whatsapp-catalog";

export const metadata: Metadata = { title: "Medication delivery" };

export default function MedicationPage() {
  return (
    <WhatsAppCatalog
      eyebrow="Medication delivery"
      title="Any medicine, delivered. Even the hard-to-find ones."
      intro="From your regular blood pressure tablets to rare and imported medicines, our pharmacy partners can source it and deliver it to your door. Just ask on WhatsApp."
      icon="box"
      kind="medicine"
      groups={MED_GROUPS}
      heroExtra={
        <a href="#verify" className="inline-flex min-h-[44px] items-center justify-center gap-1.5 self-center rounded-full border border-white/30 px-4 text-[15px] font-semibold text-white hover:bg-white/10 md:self-auto">
          <Icon name="shield" size={18} strokeWidth={2} /> Verify a drug
        </a>
      }
      steps={["Send us the medicine name or a photo of your prescription", "We find it and confirm the price", "We deliver it to your door"]}
    >
      <section id="verify" className="mt-10 scroll-mt-6" aria-labelledby="verify-title">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name="shield" size={20} strokeWidth={2} /></span>
          <h2 id="verify-title" className="text-2xl font-semibold md:text-3xl">Is your medicine real?</h2>
        </div>
        <p className="mt-2 max-w-2xl text-[16px] text-muted">Every genuine medicine sold in Nigeria has a NAFDAC number on the pack. Check it on NAFDAC&apos;s website in under a minute, whoever you bought it from. Here&apos;s how:</p>
        <div className="mt-5"><NafdacDemo /></div>
        <a href={NAFDAC_CHECK_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary px-6 text-[17px] font-semibold text-white shadow-[var(--shadow-sm)] hover:bg-primary-hover md:w-auto">
          Open the NAFDAC website <Icon name="arrowRight" size={18} strokeWidth={2} />
        </a>
        <p className="mt-2 text-[13px] text-subtle">Opens registration.nafdac.gov.ng in a new tab. The demo above is our own drawing of the steps.</p>
      </section>

      <div className="mt-8 rounded-[var(--radius-xl)] border border-line bg-check-bg p-5 text-check-text">
        <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-surface"><Icon name="stethoscope" size={20} strokeWidth={2} /></span>
        <h2 className="mt-4 text-lg font-semibold">Prescription medicines</h2>
        <p className="mt-1 max-w-2xl text-[15px]">We only supply prescription medicines with a valid prescription. No prescription? One of our doctors can see you and prescribe if it&apos;s right for you.</p>
        <ButtonLink href="/doctor" variant="secondary" className="mt-4">See a doctor</ButtonLink>
      </div>
    </WhatsAppCatalog>
  );
}
