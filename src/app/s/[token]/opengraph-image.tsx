import { findShared } from "@/lib/share/lookup";
import { shareCard } from "@/lib/share/card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Heart age share card";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const shared = await findShared(token);
  return shareCard({ age: shared?.summary.age ?? 0, heartAge: shared?.summary.heartAge ?? null, format: "og" });
}
