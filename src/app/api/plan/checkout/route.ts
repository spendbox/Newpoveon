import { site } from "@/config/site";
import { handleError, json } from "@/lib/http";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { currentUser, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { randomToken } from "@/lib/tokens";

/** Start a Paystack payment for a year of the personal plan. The price is set on the server. */
export async function POST() {
  try {
    if (!supabaseConfigured() || !paystackConfigured()) return json({ error: "Payments aren't switched on yet." }, 503);
    const user = await currentUser();
    if (!user?.email) return json({ error: "Please log in first." }, 401);
    const sb = supabaseAdmin();
    const { data: plan } = await sb.from("plans").select("id").eq("user_id", user.id).maybeSingle();
    if (!plan) return json({ error: "Please set up your plan first." }, 400);
    const { count } = await sb.from("plan_goals").select("*", { count: "exact", head: true }).eq("plan_id", plan.id).eq("active", true);
    if (!count) return json({ error: "Please choose at least one area first." }, 400);
    const reference = `PL-${randomToken(9)}`;
    const amountKobo = site.planPriceNaira * 100;
    const { error } = await sb.from("plan_purchases").insert({ user_id: user.id, plan_id: plan.id, reference, amount_kobo: amountKobo });
    if (error) throw error;
    const tx = await initializeTransaction({
      email: user.email, amountKobo, reference,
      callbackUrl: `${site.siteUrl}/account/plan`,
      metadata: { purpose: "plan", plan_id: plan.id, custom_fields: [{ display_name: "Product", variable_name: "product", value: "Personal plan, 12 months" }] },
    });
    return json({ authorizationUrl: tx.authorization_url, reference });
  } catch (e) {
    return handleError(e);
  }
}
