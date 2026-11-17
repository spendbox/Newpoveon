import "server-only";
import { NextResponse } from "next/server";
import { NotConfiguredError } from "@/lib/supabase/server";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });

/** Turn errors into safe responses. Never leaks internal details or health data. */
export function handleError(e: unknown) {
  if (e instanceof NotConfiguredError) return json({ error: e.message }, 503);
  console.error("[api]", (e as Error)?.message);
  return json({ error: "Something went wrong. Please try again." }, 500);
}

export async function readJson(req: Request, maxBytes = 50_000): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (text.length > maxBytes) throw new Error("Request too large");
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export const isEmail = (s: unknown): s is string => typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
export const cleanText = (s: unknown, max = 500) => (typeof s === "string" ? s.trim().slice(0, max) : "");
export const isPhone = (s: unknown): s is string => typeof s === "string" && /^[+\d][\d\s()-]{6,19}$/.test(s.trim());
