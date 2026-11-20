import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource-variable/bricolage-grotesque/wght.css";
import "@fontsource-variable/inter/wght.css";
import "./globals.css";
import { site } from "@/config/site";
import { FloatingDoctor } from "@/components/client";

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: { default: `${site.appName}: free health check in 10 minutes`, template: `%s · ${site.appName}` },
  description: "Answer a few friendly questions and find out your heart age, diabetes risk, sleep, mood and more. Free, private, and a doctor is a tap away.",
};

export const viewport: Viewport = { themeColor: "#F6F8F7", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* First visit to the home page: mark it before paint so the logo pieces glide in once (see .pv-anim). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(location.pathname==="/"&&!localStorage.getItem("hc.logo.seen")){document.documentElement.setAttribute("data-logo-intro","");localStorage.setItem("hc.logo.seen","1")}}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">
          Skip to content
        </a>
        <div id="main" className="flex flex-1 flex-col">{children}</div>
        <footer className="mt-auto px-6 pt-14 pb-24 text-center text-[13px] text-subtle">
          <p>
            {site.appName} by {site.companyName} gives estimates, not diagnoses. In an emergency call <a href="tel:112" className="underline">112</a>.
          </p>
          <nav className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1" aria-label="Footer">
            <Link href="/privacy" className="underline">Privacy</Link>
            <Link href="/terms" className="underline">Terms</Link>
            <Link href="/home-tests" className="underline">Lab tests</Link>
            <Link href="/medication" className="underline">Medication delivery</Link>
            <Link href="/account" className="underline">My account</Link>
          </nav>
        </footer>
        <FloatingDoctor />
      </body>
    </html>
  );
}
