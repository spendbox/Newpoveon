import { handleError, json } from "@/lib/http";
import { openSlots } from "@/lib/slots";
import { supabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  try {
    if (!supabaseConfigured()) return json({ slots: [], configured: false });
    return json({ slots: await openSlots(), configured: true });
  } catch (e) {
    return handleError(e);
  }
}
