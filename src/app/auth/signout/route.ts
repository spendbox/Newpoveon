import { NextResponse } from "next/server";
import { supabaseConfigured, supabaseUser } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (supabaseConfigured()) await (await supabaseUser()).auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
