import { beforeEach, describe, expect, it } from "vitest";
import { forgetMe, loadMe, rememberMe } from "./storage";

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) },
  };
});

describe("remembered email", () => {
  it("remembers and tidies the email, and adds details later", () => {
    rememberMe({ email: " Ada@Example.com " });
    rememberMe({ email: "ada@example.com", phone: "0803", name: "Ada" });
    expect(loadMe()).toEqual({ email: "ada@example.com", phone: "0803", name: "Ada" });
  });
  it("starts fresh for a different email, so details never mix", () => {
    rememberMe({ email: "ada@example.com", phone: "0803", name: "Ada" });
    rememberMe({ email: "bola@example.com" });
    expect(loadMe()).toEqual({ email: "bola@example.com" });
  });
  it("ignores blanks and can be forgotten", () => {
    rememberMe({ email: "ada@example.com", phone: "0803" });
    rememberMe({ email: "ada@example.com", phone: "" });
    expect(loadMe()?.phone).toBe("0803");
    forgetMe();
    expect(loadMe()).toBeNull();
  });
});
