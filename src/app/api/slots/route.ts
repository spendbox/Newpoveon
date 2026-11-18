import { handleError, json } from "@/lib/http";
import { availableSlots } from "@/lib/consults";
import { supabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  try {
    if (!supabaseConfigured()) return json({ slots: [], configured: false });
    const { slots } = await availableSlots();
    return json({ slots: slots.map((s) => ({ startsAt: s.startsAt })), configured: true });
  } catch (e) {
    return handleError(e);
  }
}
