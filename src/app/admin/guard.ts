import "server-only";
import { redirect } from "next/navigation";
import { currentAdmin, currentUser, supabaseConfigured } from "@/lib/supabase/server";

export async function requireAdmin() {
  if (!supabaseConfigured()) redirect("/");
  const admin = await currentAdmin();
  if (admin) return admin;
  const user = await currentUser();
  redirect(user ? "/?not-admin=1" : "/login?next=/admin");
}
