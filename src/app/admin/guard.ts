import "server-only";
import { redirect } from "next/navigation";
import { currentAdminSession } from "@/lib/admin-auth";

export async function requireAdmin() {
  const session = await currentAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
