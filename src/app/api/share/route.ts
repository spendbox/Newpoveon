import { site } from "@/config/site";
import { handleError, json, readJson } from "@/lib/http";
import { canManageScreening } from "@/lib/share/access";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { randomToken } from "@/lib/tokens";

const shareUrl = (t: string) => `${site.siteUrl}/s/${t}`;

export async function GET(req: Request) {
  try {
    if (!supabaseConfigured()) return json({ url: null });
    const id = new URL(req.url).searchParams.get("screeningId") ?? "";
    const s = await canManageScreening(id, req.headers.get("x-owner-token"));
    if (!s) return json({ error: "Not found" }, 404);
    return json({ url: s.share_enabled && s.share_token ? shareUrl(s.share_token) : null });
  } catch (e) {
    return handleError(e);
  }
}

/** Turn the share link on (always a NEW random URL) or off (the old URL stops working at once). */
export async function POST(req: Request) {
  try {
    if (!supabaseConfigured()) return json({ error: "Sharing isn't switched on yet." }, 503);
    const body = await readJson(req, 500);
    const s = await canManageScreening(String(body.screeningId ?? ""), req.headers.get("x-owner-token"));
    if (!s) return json({ error: "Not found" }, 404);
    if (body.enabled === true) {
      const { data: paid } = await supabaseAdmin().from("screenings").select("paid").eq("id", s.id).single();
      if (paid && paid.paid === false) return json({ error: "Unlock your results first to share them." }, 402);
      const token = randomToken(24);
      await supabaseAdmin().from("screenings").update({ share_token: token, share_enabled: true }).eq("id", s.id);
      return json({ url: shareUrl(token) });
    }
    await supabaseAdmin().from("screenings").update({ share_token: null, share_enabled: false }).eq("id", s.id);
    return json({ url: null });
  } catch (e) {
    return handleError(e);
  }
}
