import { handleError, json, readJson } from "@/lib/http";
import { currentUser, supabaseUser } from "@/lib/supabase/server";
import { deleteUserAndData } from "@/lib/delete-user";

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
    await deleteUserAndData(user.id, user.email);
    await (await supabaseUser()).auth.signOut();
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
