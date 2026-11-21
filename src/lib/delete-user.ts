import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Deletes an account and every screening saved with it or its email.
 * Paid booking records and service requests are kept but detached, because payment records
 * may need to be kept for accounting (see the privacy notice).
 * Used by "Delete my account" and by Admin → Users.
 */
export async function deleteUserAndData(userId: string, email: string | null) {
  const sb = supabaseAdmin();
  await sb.from("screenings").delete().eq("user_id", userId);
  if (email) await sb.from("screenings").delete().eq("email", email.toLowerCase());
  await sb.from("bookings").update({ user_id: null, screening_id: null }).eq("user_id", userId);
  await sb.from("service_requests").update({ user_id: null }).eq("user_id", userId);
  const { error } = await sb.auth.admin.deleteUser(userId); // the profile is removed with it
  if (error) throw error;
}
