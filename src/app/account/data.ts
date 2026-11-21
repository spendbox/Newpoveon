import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { currentUser, supabaseUser } from "@/lib/supabase/server";
import type { Booking, Row } from "./panels";

/** The signed-in person's checks and bookings, loaded once per request. Row-level security keeps it to their own data. */
export const getAccount = cache(async () => {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");
  const sb = await supabaseUser();
  const [{ data: rows }, { data: bookings }] = await Promise.all([
    sb.from("screenings").select("id, created_at, heart_age, risk_percent, results, answers").order("created_at", { ascending: false }).limit(50),
    sb.from("bookings").select("id, slot_starts_at, status, consult_type_name, created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  return { user, history: (rows ?? []) as Row[], bookings: (bookings ?? []) as Booking[] };
});
