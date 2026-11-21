import { confirmBookingPayment, validWebhookSignature } from "@/lib/paystack";
import { confirmPlanPayment } from "@/lib/plan/server";

export const runtime = "nodejs";

/**
 * Paystack webhook. Set this URL in Paystack: Settings → API Keys & Webhooks → Webhook URL:
 *   https://YOUR-DOMAIN/api/paystack/webhook
 * The signature is checked, then the payment is verified again with Paystack's API.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get("x-paystack-signature"))) return new Response("invalid signature", { status: 401 });
  let event: { event?: string; data?: { reference?: string } } = {};
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }
  if (event.event === "charge.success" && event.data?.reference?.startsWith("PL-")) {
    try {
      await confirmPlanPayment(event.data.reference, "webhook");
    } catch (e) {
      console.error("[paystack webhook plan]", (e as Error).message);
      return new Response("retry", { status: 500 });
    }
  }
  if (event.event === "charge.success" && event.data?.reference?.startsWith("HC-")) {
    try {
      await confirmBookingPayment(event.data.reference, "webhook");
    } catch (e) {
      console.error("[paystack webhook]", (e as Error).message);
      return new Response("retry", { status: 500 }); // Paystack retries on non-200
    }
  }
  return new Response("ok", { status: 200 });
}
