import { handleError, json, readJson } from "@/lib/http";
import { currentUser, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/** Turn plan reminder emails on or off. */
export async function POST(req: Request) {
  try {
    if (!supabaseConfigured()) return json({ error: "Plans aren't switched on yet." }, 503);
    const user = await currentUser();
    if (!user) return json({ error: "Please log in again." }, 401);
    const { reminders } = await readJson(req, 200);
    if (typeof reminders !== "boolean") return json({ error: "Something went wrong." }, 400);
    await supabaseAdmin().from("plans").update({ reminders, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
