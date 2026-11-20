import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL || "";
/** Supabase calls this the "anon" or "publishable" key. Safe for the browser. */
const publicKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
/** The "service_role" / "secret" key. NEVER sent to the browser. */
const secretKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

export const supabaseConfigured = () => Boolean(url() && publicKey() && secretKey());

/** Server-side admin client: bypasses row-level security. Use only after checking permissions. */
let admin: SupabaseClient | null = null;
export function supabaseAdmin(): SupabaseClient {
  if (!supabaseConfigured()) throw new NotConfiguredError("Supabase");
  if (!admin) admin = createClient(url(), secretKey(), { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

/** Client acting as the logged-in person (respects row-level security). */
export async function supabaseUser() {
  const store = await cookies();
  return createServerClient(url(), publicKey(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component: the proxy refreshes the session instead */
        }
      },
    },
  });
}

export async function currentUser() {
  if (!supabaseConfigured()) return null;
  const sb = await supabaseUser();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

export class NotConfiguredError extends Error {
  constructor(what: string) {
    super(`${what} is not connected yet`);
  }
}
