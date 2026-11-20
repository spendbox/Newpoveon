import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import type { HeartAge } from "@/lib/scoring/who-cvd";

let fonts: { name: string; data: Buffer; weight: 500 | 600 | 700; style: "normal" }[] | null = null;
async function loadFonts() {
  if (fonts) return fonts;
  const dir = path.join(process.cwd(), "assets/fonts");
  const [display, i5, i6] = await Promise.all([
    readFile(path.join(dir, "bricolage-grotesque-latin-700-normal.woff")),
    readFile(path.join(dir, "inter-latin-500-normal.woff")),
    readFile(path.join(dir, "inter-latin-600-normal.woff")),
  ]);
  fonts = [
    { name: "Bricolage", data: display, weight: 700, style: "normal" },
    { name: "Inter", data: i5, weight: 500, style: "normal" },
    { name: "Inter", data: i6, weight: 600, style: "normal" },
  ];
  return fonts;
}

const C = { ground: "#F6F8F7", ink: "#10221D", muted: "#4A5D57", primary: "#136F58", primarySoft: "#E3F2EC", coral: "#FF6B4A", sun: "#FFC23D" };

/**
 * The shareable card (design v2). Story size (1080×1920) for WhatsApp status / Instagram stories,
 * or 1200×630 for link previews. ONLY age and heart age: never mood, worry, alcohol or other details.
 */
export async function shareCard({ age, heartAge, format = "story" }: { age: number; heartAge: HeartAge | null; format?: "story" | "og" }) {
  const story = format === "story";
  const W = story ? 1080 : 1200;
  const H = story ? 1920 : 630;
  const s = story ? 1 : 0.5;
  const ha = heartAge ? `${heartAge.kind === "below" ? "<" : heartAge.kind === "above" ? ">" : ""}${heartAge.value}` : null;
  const headline = ha ? `My heart age is ${ha.replace("<", "under ").replace(">", "over ")}.` : `I just did my free ${site.appName} health check.`;
  const sub = ha ? `I'm ${age}.` : "Heart age, diabetes risk, sleep and more.";
  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: story ? "column" : "row", alignItems: "center", justifyContent: "center", background: C.ground, fontFamily: "Inter", color: C.ink, padding: 90 * s, gap: 70 * s, position: "relative" }}>
        <div style={{ position: "absolute", top: -160 * s, right: -160 * s, width: 520 * s, height: 520 * s, borderRadius: 999, background: C.primarySoft }} />
        <div style={{ position: "absolute", bottom: -120 * s, left: -100 * s, width: 380 * s, height: 380 * s, borderRadius: 120 * s, background: "#FFF5DB", transform: "rotate(12deg)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 18 * s, position: "absolute", top: 90 * s, left: 90 * s }}>
          <div style={{ width: 64 * s, height: 64 * s, borderRadius: 18 * s, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={36 * s} height={36 * s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2-5 4 10 2-5h6" /></svg>
          </div>
          <div style={{ fontFamily: "Bricolage", fontSize: 44 * s, fontWeight: 700 }}>{site.appName}</div>
        </div>
        <div style={{ display: "flex", width: 560 * s, height: 560 * s, borderRadius: 140 * s, background: C.ink, alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 40px 80px -30px rgba(16,34,29,.45)" }}>
          <svg width={420 * s} height={376 * s} viewBox="0 0 150 134" style={{ position: "absolute" }}>
            <path d="M75 128 C26 96 6 70 12 44 C18 18 50 8 75 34 C100 8 132 18 138 44 C144 70 124 96 75 128 Z" fill={C.coral} />
          </svg>
          <div style={{ display: "flex", fontFamily: "Bricolage", fontWeight: 700, fontSize: (ha && ha.length > 2 ? 130 : 170) * s, color: "#FFFFFF", marginBottom: 34 * s }}>{ha ?? "♥"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: story ? "center" : "flex-start", maxWidth: story ? 900 : 560 }}>
          <div style={{ fontFamily: "Bricolage", fontWeight: 700, fontSize: 88 * s, lineHeight: 1.04, letterSpacing: -2 * s, textAlign: story ? "center" : "left" }}>{headline}</div>
          <div style={{ fontFamily: "Bricolage", fontWeight: 700, fontSize: 88 * s, lineHeight: 1.04, letterSpacing: -2 * s, color: C.primary }}>{sub}</div>
          <div style={{ display: "flex", marginTop: 60 * s, background: C.primary, color: "#FFFFFF", borderRadius: 999, padding: `${26 * s}px ${52 * s}px`, fontWeight: 600, fontSize: 40 * s }}>Check yours free</div>
          <div style={{ marginTop: 30 * s, fontSize: 32 * s, fontWeight: 500, color: C.muted }}>{site.siteUrl.replace(/^https?:\/\//, "")}</div>
        </div>
        <div style={{ position: "absolute", bottom: 60 * s, fontSize: 24 * s, fontWeight: 500, color: C.muted }}>An estimate based on WHO risk charts, not a diagnosis.</div>
      </div>
    ),
    { width: W, height: H, fonts: await loadFonts(), headers: { "cache-control": "private, no-store" } },
  );
}
