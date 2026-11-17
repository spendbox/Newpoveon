export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { requireAdmin } from "./guard";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const NAV = [
  ["/admin", "Overview"],
  ["/admin/bookings", "Doctor bookings"],
  ["/admin/slots", "Availability"],
  ["/admin/requests", "Requests"],
  ["/admin/tests", "Home tests"],
  ["/admin/contacts", "Emergency contacts"],
] as const;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-[#F6FAF8]">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <Link href="/admin" className="font-display text-xl font-extrabold">{site.appName} admin</Link>
          <div className="flex items-center gap-3 text-sm font-bold text-muted">
            <span>{admin.email}</span>
            <form action="/auth/signout" method="post"><button className="rounded-lg border border-border px-3 py-1.5">Log out</button></form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2" aria-label="Admin">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="shrink-0 rounded-lg px-3 py-2 text-sm font-extrabold hover:bg-ground">{label}</Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
    </div>
  );
}
