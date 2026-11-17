export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { IllustrationCard } from "@/components/illustrations";
import { Logo } from "@/components/ui";
import { activeHomeTests } from "@/lib/home-tests";
import { RequestForm } from "@/components/request-form";

export const metadata: Metadata = { title: "Order a home test" };

export default async function HomeTestsPage({ searchParams }: PageProps<"/home-tests">) {
  const sp = await searchParams;
  const tests = await activeHomeTests();
  const preselect = typeof sp.test === "string" ? sp.test : null;
  return (
    <main className="mx-auto w-full max-w-[430px] px-6 pt-7 md:max-w-2xl">
      <Logo />
      <IllustrationCard name="homeTest" className="mt-5" />
      <h1 className="mt-5 text-[32px] leading-[1.05]">Order a home test</h1>
      <p className="mt-2 text-[17px] text-muted">Pick a test, tell us where and when, and our team will confirm by phone or WhatsApp. You pay when we confirm.</p>
      <RequestForm kind="home_test" tests={tests} preselect={preselect} />
    </main>
  );
}
