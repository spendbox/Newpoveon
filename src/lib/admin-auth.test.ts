import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adminLoginConfigured, checkAdminCredentials, makeSessionValue, readSessionValue } from "./admin-auth";

describe("Admin email + password login", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = "boss@poveon.com, ops@poveon.com";
    process.env.ADMIN_PASSWORD = "correct-horse-battery";
    process.env.ADMIN_SESSION_SECRET = "server-secret";
  });
  afterEach(() => {
    delete process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
  });

  it("accepts a listed email with the right password (any letter case in the email)", () => {
    expect(checkAdminCredentials("Boss@Poveon.com", "correct-horse-battery")).toBe(true);
  });
  it("rejects a wrong password or an unlisted email", () => {
    expect(checkAdminCredentials("boss@poveon.com", "wrong")).toBe(false);
    expect(checkAdminCredentials("stranger@x.com", "correct-horse-battery")).toBe(false);
  });
  it("is switched off when the password is missing or shorter than 12 characters", () => {
    process.env.ADMIN_PASSWORD = "short";
    expect(adminLoginConfigured()).toBe(false);
    expect(checkAdminCredentials("boss@poveon.com", "short")).toBe(false);
  });
  it("issues a session that can be read back", () => {
    expect(readSessionValue(makeSessionValue("ops@poveon.com"))).toEqual({ email: "ops@poveon.com" });
  });
  it("rejects a tampered session", () => {
    const v = makeSessionValue("ops@poveon.com");
    const forged = Buffer.from(JSON.stringify({ e: "boss@poveon.com", x: Date.now() + 1e9 })).toString("base64url") + "." + v.split(".")[1];
    expect(readSessionValue(forged)).toBeNull();
  });
  it("logs everyone out when the password is changed in Vercel", () => {
    const v = makeSessionValue("ops@poveon.com");
    process.env.ADMIN_PASSWORD = "a-brand-new-password";
    expect(readSessionValue(v)).toBeNull();
  });
  it("logs a person out when their email is removed from ADMIN_EMAILS", () => {
    const v = makeSessionValue("ops@poveon.com");
    process.env.ADMIN_EMAILS = "boss@poveon.com";
    expect(readSessionValue(v)).toBeNull();
  });
});
