import { confirmCheckPayment } from "@/lib/check/payment";
import { handleError, json, readJson } from "@/lib/http";
import { paystackConfigured } from "@/lib/paystack";
import { canManageScreening } from "@/lib/share/access";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/**
 * After Paystack: confirm the payment (with `reference`), or just ask whether a saved check
 * is already paid (with `screeningId` + `ownerToken`), for example when the webhook got there first.
 */
export async function POST(req: Request) {
  try {
    if (!supabaseConfigured()) return json({ paid: false }, 503);
    const { reference, screeningId, ownerToken } = await readJson(req, 500);
    if (typeof reference === "string") {
      if (!/^CK-[A-Za-z0-9_-]{6,40}$/.test(reference) || !paystackConfigured()) return json({ paid: false }, 400);
      return json(await confirmCheckPayment(reference, "verify"));
    }
    if (typeof screeningId !== "string") return json({ paid: false }, 400);
    const own = await canManageScreening(screeningId, typeof ownerToken === "string" ? ownerToken : null);
    if (!own) return json({ paid: false }, 404);
    const { data } = await supabaseAdmin().from("screenings").select("paid").eq("id", own.id).single();
    return json({ paid: !!data?.paid, screeningId: own.id });
  } catch (e) {
    return handleError(e);
  }
}
