import { handleError, json, readJson } from "@/lib/http";
import { QUESTION_BY_ID } from "@/lib/questions";
import { normalisePath } from "@/lib/track-shared";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

const DEVICES = ["phone", "tablet", "desktop"];
const STAGES = ["question", "completed", "emailed", "paywall", "unlocked"];
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[^\w.-]/g, "").slice(0, max) : "");

/**
 * Anonymous counters: checks started and finished, page views, and how far each check got.
 * No answers, names, emails or IP addresses are stored.
 */
export async function POST(req: Request) {
  try {
    const body = await readJson(req, 600);
    const type = body.type;
    if (!supabaseConfigured()) return json({ ok: false }, 202);
    const sb = supabaseAdmin();

    if (type === "started" || type === "completed") {
      await sb.from("events").insert({ type });
      return json({ ok: true });
    }

    const vid = clean(body.vid, 40) || "unknown";
    const src = clean(body.src, 30) || "direct";
    const device = DEVICES.includes(String(body.device)) ? String(body.device) : "phone";

    if (type === "view") {
      const path = normalisePath(String(body.path ?? ""));
      if (!path) return json({ ok: false }, 400);
      await sb.from("page_views").insert({ path, visitor: vid, source: src, device });
      return json({ ok: true });
    }

    if (type === "check") {
      const sid = String(body.sid ?? "");
      const stage = String(body.stage ?? "");
      if (!/^[0-9a-f-]{36}$/i.test(sid) || !STAGES.includes(stage)) return json({ ok: false }, 400);
      const q = stage === "question" ? String(body.q ?? "") : null;
      if (q !== null && !QUESTION_BY_ID[q]) return json({ ok: false }, 400);
      const i = Number(body.i), n = Number(body.n);
      await sb.rpc("track_check", {
        p_id: sid, p_visitor: vid, p_source: src, p_device: device, p_stage: stage,
        p_question: q, p_index: Number.isInteger(i) ? i : null, p_total: Number.isInteger(n) ? n : null,
      });
      return json({ ok: true });
    }

    return json({ ok: false }, 400);
  } catch (e) {
    return handleError(e);
  }
}
