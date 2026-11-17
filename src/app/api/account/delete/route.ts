import { handleError, json, readJson } from "@/lib/http";
import { currentUser, supabaseAdmin, supabaseUser } from "@/lib/supabase/server";

/**
 * Deletes the account and every screening saved with its email.
 * Paid booking records are kept but detached from the account, because payment records
 * may need to be kept for accounting (see the privacy notice).
 */
export async function POST(req: Request) {
  try {
    const { confirm } = await readJson(req, 200);
    if (confirm !== "DELETE") return json({ error: "Please confirm" }, 400);
    const user = await currentUser();
    if (!user?.email) return json({ error: "Not logged in" }, 401);
    const sb = supabaseAdmin();
    const email = user.email.toLowerCase();
    await sb.from("screenings").delete().eq("user_id", user.id);
    await sb.from("screenings").delete().eq("email", email);
    await sb.from("bookings").update({ user_id: null, screening_id: null }).eq("user_id", user.id);
    await sb.from("service_requests").update({ user_id: null }).eq("user_id", user.id);
    const { error } = await sb.auth.admin.deleteUser(user.id); // profile is removed with it
    if (error) throw error;
    await (await supabaseUser()).auth.signOut();
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
