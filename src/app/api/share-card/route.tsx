import { readJson } from "@/lib/http";
import { shareCard } from "@/lib/share/card";
import type { HeartAge } from "@/lib/scoring/who-cvd";

export const runtime = "nodejs";

/** Makes the share image. POST (not GET) so heart age never appears in a URL or server log. */
export async function POST(req: Request) {
  const body = await readJson(req, 500);
  const age = Number(body.age);
  const h = body.heartAge as HeartAge | null;
  const valid = Number.isInteger(age) && age >= 18 && age <= 100;
  const heartAge =
    h && typeof h === "object" && ["exact", "below", "above"].includes(h.kind) && Number.isInteger(h.value) && h.value >= 18 && h.value <= 100 ? { kind: h.kind, value: h.value } : null;
  if (!valid) return new Response("Bad request", { status: 400 });
  return shareCard({ age, heartAge: heartAge as HeartAge | null });
}
