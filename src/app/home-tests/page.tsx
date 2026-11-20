import type { Metadata } from "next";
import { LAB_GROUPS, TEST_NAMES } from "@/config/catalog";
import { WhatsAppCatalog } from "@/components/whatsapp-catalog";

export const metadata: Metadata = { title: "Lab tests" };

export default async function LabTestsPage({ searchParams }: PageProps<"/home-tests">) {
  const sp = await searchParams;
  const highlight = typeof sp.test === "string" ? TEST_NAMES[sp.test] ?? null : null;
  return (
    <WhatsAppCatalog
      eyebrow="Lab tests"
      title="Lab tests, collected at home"
      intro="Tell us what you need on WhatsApp. A trained phlebotomist collects your sample at home or you visit a partner lab, and an accredited lab runs the test."
      icon="flask"
      kind="lab test"
      groups={LAB_GROUPS}
      highlight={highlight}
      steps={["Message us with the test you need", "We confirm the price and a time", "We collect your sample and send your results"]}
    />
  );
}
