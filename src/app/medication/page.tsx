import type { Metadata } from "next";
import { MED_GROUPS, NAFDAC_CHECK_URL } from "@/config/catalog";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";
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
      steps={["Send us the medicine name or a photo of your prescription", "We find it and confirm the price", "We deliver it to your door"]}
    >
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Icon name="shield" size={20} strokeWidth={2} /></span>
          <h2 className="mt-4 text-lg font-semibold">Is your medicine real?</h2>
          <p className="mt-1 text-[15px] text-muted">Every genuine medicine sold in Nigeria has a NAFDAC number on the pack. Check it on NAFDAC&apos;s own website before you use it, whoever you bought it from.</p>
          <a href={NAFDAC_CHECK_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-strong px-5 font-semibold hover:bg-surface-2">
            Check on the NAFDAC portal <Icon name="arrowRight" size={18} strokeWidth={2} />
          </a>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-line bg-check-bg p-5 text-check-text">
          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-surface"><Icon name="stethoscope" size={20} strokeWidth={2} /></span>
          <h2 className="mt-4 text-lg font-semibold">Prescription medicines</h2>
          <p className="mt-1 text-[15px]">We only supply prescription medicines with a valid prescription. No prescription? One of our doctors can see you and prescribe if it&apos;s right for you.</p>
          <ButtonLink href="/doctor" variant="secondary" className="mt-4">See a doctor</ButtonLink>
        </div>
      </div>
    </WhatsAppCatalog>
  );
}
