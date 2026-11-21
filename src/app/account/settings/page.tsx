export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { supabaseConfigured } from "@/lib/supabase/server";
import { LoginForm } from "@/app/login/login-form";
import { DeleteAccount } from "../account-actions";
import { getAccount } from "../data";
import { PageHead } from "../panels";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  if (!supabaseConfigured()) redirect("/account");
  const { user } = await getAccount();
  return (
    <>
      <PageHead eyebrow="Account" title="Settings" />
      <div className="flex flex-col gap-4">
        <section className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">Your login</h2>
          <p className="mt-1 text-[15px] text-muted">You log in with <b className="text-ink">{user.email}</b> and your password.</p>
          <p className="mt-3 text-sm font-semibold">Change my password</p>
          <p className="text-sm text-muted">We&apos;ll email you a code, then you choose a new password.</p>
          <div className="-mt-3 max-w-sm"><LoginForm next="/account/settings?saved=1" changeEmail={user.email ?? ""} /></div>
        </section>
        <section className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">Your answers</h2>
          <p className="mt-1 text-[15px] text-muted">Changed your weight, stopped smoking or got a new blood pressure reading? Update your answers and your scores are recalculated.</p>
          <Link href="/account/edit" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Update my answers <Icon name="arrowRight" size={14} /></Link>
        </section>
        <section className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">Your data</h2>
          <p className="mt-1 text-[15px] text-muted">You can delete your account and every result saved with your email. This can&apos;t be undone. <Link href="/privacy" className="underline">Privacy notice</Link></p>
          <DeleteAccount />
        </section>
      </div>
    </>
  );
}
