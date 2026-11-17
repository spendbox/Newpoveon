import { FALLBACK_EMERGENCY_CONTACTS } from "@/config/site";
import { json } from "@/lib/http";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  if (!supabaseConfigured()) return json({ contacts: FALLBACK_EMERGENCY_CONTACTS });
  const { data } = await supabaseAdmin()
    .from("emergency_contacts")
    .select("label, phone, description")
    .eq("active", true)
    .not("phone", "is", null)
    .order("sort");
  return json({ contacts: data?.length ? data : FALLBACK_EMERGENCY_CONTACTS });
}
