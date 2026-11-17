import { NextResponse } from "next/server";
import { adminEmails } from "@/config/site";
import { supabaseAdmin, supabaseUser } from "@/lib/supabase/server";

/**
 * The magic link lands here. We swap the one-time code for a login session, then:
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

  const user = data.user;
  const email = user.email!.toLowerCase();
  const admin = supabaseAdmin();
  const { data: profile } = await admin.from("profiles").select("role, latest_answers").eq("id", user.id).single();
  const isListedAdmin = adminEmails().includes(email);
  const role = isListedAdmin ? "admin" : profile?.role === "admin" ? "user" : profile?.role ?? "user";
  await admin.from("profiles").upsert({ id: user.id, email, role, updated_at: new Date().toISOString() }, { onConflict: "id" });

  // Claim guest screenings saved with this email.
  await admin.from("screenings").update({ user_id: user.id }).eq("email", email).is("user_id", null);
  if (!profile?.latest_answers) {
    const { data: latest } = await admin.from("screenings").select("answers").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (latest) await admin.from("profiles").update({ latest_answers: latest.answers }).eq("id", user.id);
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
