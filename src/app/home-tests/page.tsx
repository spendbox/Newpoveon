export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { Logo } from "@/components/ui";
import { activeHomeTests, LAB_CATEGORIES } from "@/lib/home-tests";
import { LabCatalog } from "./lab-catalog";

export const metadata: Metadata = { title: "Lab tests and packages" };

export default async function LabTestsPage({ searchParams }: PageProps<"/home-tests">) {
  const sp = await searchParams;
  const tests = await activeHomeTests();
  const preselect = typeof sp.test === "string" ? sp.test : null;
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-6">
      <Logo />
      <div className="mt-8 max-w-2xl">
        <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">Lab tests</p>
        <h1 className="mt-2 text-[34px] leading-[1.05] font-bold md:text-5xl">Tests and health packages</h1>
        <p className="mt-3 text-[17px] text-muted">Choose a package or a single test. A trained phlebotomist collects your sample at home, and an accredited lab runs it. We confirm the time and price with you before anything is paid.</p>
      </div>
      <LabCatalog tests={tests} categories={LAB_CATEGORIES} preselect={preselect} />
    </main>
  );
}
