import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { adminLoginConfigured, currentAdminSession } from "@/lib/admin-auth";
import { adminLogin } from "./actions";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLogin({ searchParams }: PageProps<"/admin/login">) {
  if (await currentAdminSession()) redirect("/admin");
  const sp = await searchParams;
  const configured = adminLoginConfigured();
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-5">
      <form action={adminLogin} className="w-full max-w-sm rounded-[var(--radius-xl)] border border-line bg-surface p-7 shadow-[var(--shadow-md)]">
        <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">{site.appName} admin</p>
        <h1 className="mt-1 text-2xl font-semibold">Log in</h1>
        {!configured && (
          <p className="mt-4 rounded-[var(--radius-md)] bg-check-bg px-3 py-2 text-sm text-check-text">
            Admin login is off. Set ADMIN_EMAILS and an ADMIN_PASSWORD of at least 12 characters in Vercel, then redeploy.
          </p>
        )}
        {sp.error && <p role="alert" className="mt-4 rounded-[var(--radius-md)] bg-act-bg px-3 py-2 text-sm text-act-text">That email and password don&apos;t match. Please try again.</p>}
        <label htmlFor="a-email" className="mt-5 block text-sm font-semibold">Email</label>
        <input id="a-email" name="email" type="email" autoComplete="username" required className="mt-1.5 min-h-[46px] w-full rounded-[var(--radius-md)] border border-line-strong px-3.5 focus:border-primary focus:outline-none" />
        <label htmlFor="a-pass" className="mt-4 block text-sm font-semibold">Password</label>
        <input id="a-pass" name="password" type="password" autoComplete="current-password" required className="mt-1.5 min-h-[46px] w-full rounded-[var(--radius-md)] border border-line-strong px-3.5 focus:border-primary focus:outline-none" />
        <button disabled={!configured} className="mt-6 min-h-[48px] w-full rounded-[var(--radius-md)] bg-primary font-semibold text-white hover:bg-primary-hover disabled:opacity-40">Log in</button>
        <p className="mt-4 text-xs text-subtle">The password is set in Vercel (ADMIN_PASSWORD). Change it there to reset it.</p>
      </form>
    </main>
  );
}
