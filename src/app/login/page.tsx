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
      <h1 className="mt-5 text-[30px] leading-[1.05]">Log in with your email</h1>
      <p className="mt-2 text-[17px] text-muted">No password needed. We&apos;ll email you a magic link. Any results saved with this email will be added to your profile.</p>
      {sp.error && <p className="mt-3 rounded-[var(--radius-md)] bg-caution-bg px-4 py-3 text-sm font-bold text-caution-text">That link has expired or was already used. Please ask for a new one.</p>}
      <LoginForm next={next} />
    </main>
  );
}
