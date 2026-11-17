import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { paystackConfigured, validWebhookSignature } from "./paystack";

describe("Paystack safety", () => {
  afterEach(() => {
    delete process.env.PAYSTACK_SECRET_KEY;
    delete process.env.PAYSTACK_LIVE_MODE;
  });
  it("accepts only webhooks signed with our secret key", () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_abc";
    const body = JSON.stringify({ event: "charge.success", data: { reference: "HC-1" } });
    const good = createHmac("sha512", "sk_test_abc").update(body).digest("hex");
    const bad = createHmac("sha512", "someone_else").update(body).digest("hex");
    expect(validWebhookSignature(body, good)).toBe(true);
    expect(validWebhookSignature(body, bad)).toBe(false);
    expect(validWebhookSignature(body + " ", good)).toBe(false);
    expect(validWebhookSignature(body, null)).toBe(false);
  });
  it("refuses live keys unless live mode is switched on on purpose", () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_live_xyz";
    expect(paystackConfigured()).toBe(false);
    process.env.PAYSTACK_LIVE_MODE = "true";
    expect(paystackConfigured()).toBe(true);
    process.env.PAYSTACK_SECRET_KEY = "sk_test_abc";
    delete process.env.PAYSTACK_LIVE_MODE;
    expect(paystackConfigured()).toBe(true);
  });
});
