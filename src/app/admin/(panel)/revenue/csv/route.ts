import { NextResponse, type NextRequest } from "next/server";
import { currentAdminSession } from "@/lib/admin-auth";
import { inRange, isSource, resolveRange, toCsv } from "@/lib/revenue";
import { loadPayments } from "@/lib/revenue-server";

export const dynamic = "force-dynamic";

/** The payments in the chosen period, as a spreadsheet. Admins only. */
export async function GET(req: NextRequest) {
  if (!(await currentAdminSession())) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const { payments } = await loadPayments();
  const oldest = payments.at(-1) ? new Date(payments.at(-1)!.paidAt) : null;
  const range = resolveRange(sp.get("range") ?? "30d", new Date(), { from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined }, oldest);
  const source = sp.get("source");
  const q = (sp.get("q") ?? "").trim().toLowerCase().slice(0, 100);
  const rows = payments.filter((p) => inRange(p, range) && (!source || !isSource(source) || p.source === source)
    && (!q || [p.name, p.email, p.phone, p.memberCode, p.reference, p.description].some((v) => v?.toLowerCase().includes(q))));
  const day = (d: Date) => new Date(d.getTime() + 3600e3).toISOString().slice(0, 10);
  return new NextResponse(`﻿${toCsv(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="poveon-revenue-${day(range.from)}-to-${day(new Date(range.to.getTime() - 1))}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
