import { site } from "@/config/site";
import { supabaseConfigured } from "@/lib/supabase/server";
import { AccountNav } from "./account-nav";
import { getAccount } from "./data";

/** Signed-in area: a calm sidebar on computers, a hamburger menu on phones, one topic per page. */
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  if (!supabaseConfigured()) return children;
  const { user } = await getAccount();
  return (
    <div className="min-h-screen md:flex">
      <AccountNav email={user.email ?? ""} appName={site.appName} />
      <main className="mx-auto w-full max-w-4xl min-w-0 flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
    </div>
  );
}
