import { NextResponse } from "next/server";
import { afterLogin } from "@/lib/auth-flow";
import { supabaseUser } from "@/lib/supabase/server";

/**
 * Older email links land here (kept for links already sent). We swap the one-time code for a login session, then:
 *  1. keep the admin role in sync with ADMIN_EMAILS,
 *  2. attach any guest results saved with this (now verified) email to the account.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/account";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/account";
  if (!code) return NextResponse.redirect(new URL("/login?error=1", url.origin));

  const sb = await supabaseUser();
  const { data, error } = await sb.auth.exchangeCodeForSession(code);
  if (error || !data.user?.email) return NextResponse.redirect(new URL("/login?error=1", url.origin));

  await afterLogin(data.user);
  return NextResponse.redirect(new URL(next, url.origin));
}
