import { startCheckCheckout } from "@/lib/check/payment";
import { handleError, json, readJson } from "@/lib/http";
import { paystackConfigured } from "@/lib/paystack";
import { canManageScreening } from "@/lib/share/access";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/** Pay to unlock a saved check (and get the plan). Only the person who saved it can start this. */
export async function POST(req: Request) {
  try {
    if (!supabaseConfigured() || !paystackConfigured()) return json({ error: "Payments aren't switched on yet." }, 503);
    const { screeningId, ownerToken } = await readJson(req, 500);
    if (typeof screeningId !== "string") return json({ error: "Something went wrong." }, 400);
    const own = await canManageScreening(screeningId, typeof ownerToken === "string" ? ownerToken : null);
    if (!own) return json({ error: "We couldn't find your check. Please take it again." }, 404);
    const { data: s } = await supabaseAdmin().from("screenings").select("id, email, user_id, paid").eq("id", own.id).single();
    if (s?.paid) return json({ paid: true });
    return json(await startCheckCheckout(s!));
  } catch (e) {
    return handleError(e);
  }
}
