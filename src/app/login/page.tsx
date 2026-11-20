import type { Metadata } from "next";
import { IllustrationCard } from "@/components/illustrations";
import { Logo } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/account";
  return (
    <main className="mx-auto w-full max-w-[430px] px-6 pt-7">
      <Logo />
      <IllustrationCard name="aboutYou" className="mt-5" />
      <h1 className="mt-5 text-[30px] leading-[1.05] font-semibold">Log in or create an account</h1>
      <p className="mt-2 text-[17px] text-muted">Enter your email. New here? We&apos;ll send you a code to confirm it, then you choose a password. Results you saved with this email are added to your account.</p>
      {sp.error && <p className="mt-3 rounded-[var(--radius-md)] bg-check-bg px-4 py-3 text-sm font-medium text-check-text">That link has expired. Please log in with your email below.</p>}
      <LoginForm next={next} />
    </main>
  );
}
