export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { site } from "@/config/site";
import { supabaseConfigured } from "@/lib/supabase/server";
import { requireAdmin } from "../guard";
import { AdminNav } from "../admin-nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-[#F6FAF8] md:flex">
      <AdminNav email={admin.email} appName={site.appName} />
      <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        {supabaseConfigured() ? children : <p className="rounded-lg bg-check-bg px-4 py-3 text-sm text-check-text">The database isn&apos;t connected yet. Add the Supabase keys in Vercel (see docs/SETUP.md) and redeploy.</p>}
      </main>
    </div>
  );
}
