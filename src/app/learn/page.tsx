import type { Metadata } from "next";
import { BodyMap } from "@/components/body-map";
import { Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Health guides", description: "What each part of your HealthCheck means and how to improve it." };

export default function LearnIndex() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-6 pb-20">
      <Logo />
      <h1 className="mt-8 text-[36px] leading-[1.05] font-bold md:text-5xl">Health guides</h1>
      <p className="mt-3 max-w-xl text-[17px] text-muted">Tap a part of the body to see what we check, what your result means and how to improve it.</p>
      <div className="mt-8"><BodyMap mode="explore" /></div>
    </main>
  );
}
