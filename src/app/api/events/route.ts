import { handleError, json, readJson } from "@/lib/http";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/** Anonymous counter: "a screening started / completed". No answers or identifiers are stored. */
export async function POST(req: Request) {
  try {
    const { type } = await readJson(req, 200);
    if (type !== "started" && type !== "completed") return json({ ok: false }, 400);
    if (!supabaseConfigured()) return json({ ok: false }, 202);
    await supabaseAdmin().from("events").insert({ type });
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
