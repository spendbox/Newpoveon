import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** 32 random bytes → URL-safe text (≈43 characters). Unguessable. */
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}
