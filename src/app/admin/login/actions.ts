"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, checkAdminCredentials, makeSessionValue, sessionCookieOptions } from "@/lib/admin-auth";

// Best-effort brute-force brake (per server instance): 5 failures per IP per 15 minutes.
const failures = new Map<string, { n: number; until: number }>();

export async function adminLogin(form: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const f = failures.get(ip);
  if (f && f.n >= 5 && f.until > Date.now()) redirect("/admin/login?error=1");

  const email = String(form.get("email") ?? "").slice(0, 254);
  const password = String(form.get("password") ?? "").slice(0, 200);
  if (!checkAdminCredentials(email, password)) {
    failures.set(ip, { n: (f && f.until > Date.now() ? f.n : 0) + 1, until: Date.now() + 15 * 60 * 1000 });
    await new Promise((r) => setTimeout(r, 700));
    redirect("/admin/login?error=1");
  }
  failures.delete(ip);
  (await cookies()).set(ADMIN_COOKIE, makeSessionValue(email), sessionCookieOptions);
  redirect("/admin");
}
