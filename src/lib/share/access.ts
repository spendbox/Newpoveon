import "server-only";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";
import { safeEqualHex, sha256 } from "@/lib/tokens";

/** Can this request manage the screening's share link? Owner token (guest) or the logged-in owner. */
export async function canManageScreening(screeningId: string, ownerToken: string | null) {
  if (!/^[0-9a-f-]{36}$/i.test(screeningId)) return null;
  const { data } = await supabaseAdmin().from("screenings").select("id, user_id, owner_token_hash, share_token, share_enabled").eq("id", screeningId).single();
  if (!data) return null;
  if (ownerToken && safeEqualHex(sha256(ownerToken), data.owner_token_hash)) return data;
  const user = await currentUser();
  if (user && data.user_id === user.id) return data;
  return null;
}
