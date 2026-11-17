import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import type { HeartAge } from "@/lib/scoring/who-cvd";

let fonts: { name: string; data: Buffer; weight: 700 | 800; style: "normal" }[] | null = null;
async function loadFonts() {
  if (fonts) return fonts;
  const dir = path.join(process.cwd(), "assets/fonts");
  const [baloo, n7, n8] = await Promise.all([
    readFile(path.join(dir, "baloo-2-latin-800-normal.woff")),
    readFile(path.join(dir, "nunito-latin-700-normal.woff")),
    readFile(path.join(dir, "nunito-latin-800-normal.woff")),
  ]);
  fonts = [
    { name: "Baloo 2", data: baloo, weight: 800, style: "normal" },
    { name: "Nunito", data: n7, weight: 700, style: "normal" },
    { name: "Nunito", data: n8, weight: 800, style: "normal" },
  ];
  return fonts;
}

/**
 * The shareable card, in brand style. Story size (1080×1920) for WhatsApp status / Instagram stories,
 * or 1200×630 for link previews. ONLY age and heart age: never mood, worry, alcohol or other details.
 */
export async function shareCard({ age, heartAge, format = "story" }: { age: number; heartAge: HeartAge | null; format?: "story" | "og" }) {
  const story = format === "story";
  const W = story ? 1080 : 1200;
  const H = story ? 1920 : 630;
  const s = story ? 1 : 0.5;
  const ha = heartAge ? `${heartAge.kind === "below" ? "under " : heartAge.kind === "above" ? "over " : ""}${heartAge.value}` : null;
  const headline = ha ? `My heart age is ${ha}.` : `I just did my free ${site.appName}.`;
  const sub = ha ? `I'm ${age}.` : "10 minutes. Heart age, diabetes risk, sleep and more.";
  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: story ? "column" : "row", alignItems: "center", justifyContent: "center", background: "#EEF8F4", fontFamily: "Nunito", color: "#0E2A24", padding: 80 * s, gap: 60 * s }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 * s, position: "absolute", top: 90 * s, left: 90 * s }}>
          <div style={{ width: 72 * s, height: 72 * s, borderRadius: 22 * s, background: "#0E2A24", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={40 * s} height={40 * s} viewBox="0 0 24 24" fill="none" stroke="#FF7A59" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2-5 4 10 2-5h6" /></svg>
          </div>
          <div style={{ fontFamily: "Baloo 2", fontSize: 46 * s, fontWeight: 800 }}>{site.appName}</div>
        </div>
        <div style={{ display: "flex", position: "relative", width: 560 * s, height: 500 * s, alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: 560 * s, height: 560 * s, borderRadius: 999, background: "#D2EFE3" }} />
          <svg width={500 * s} height={446 * s} viewBox="0 0 150 134" style={{ position: "absolute" }}>
            <path d="M75 128 C26 96 6 70 12 44 C18 18 50 8 75 34 C100 8 132 18 138 44 C144 70 124 96 75 128 Z" fill="#FF7A59" stroke="#0E2A24" strokeWidth="4" />
          </svg>
          <div style={{ display: "flex", fontFamily: "Baloo 2", fontWeight: 800, fontSize: (ha && ha.length > 3 ? 120 : 190) * s, marginBottom: 40 * s, color: "#0E2A24" }}>{ha ?? "♥"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: story ? "center" : "flex-start", maxWidth: story ? 900 : 560 }}>
          <div style={{ fontFamily: "Baloo 2", fontWeight: 800, fontSize: 92 * s, lineHeight: 1.02, textAlign: story ? "center" : "left" }}>{headline}</div>
          <div style={{ fontFamily: "Baloo 2", fontWeight: 800, fontSize: 92 * s, lineHeight: 1.02, color: "#1F8A70" }}>{sub}</div>
          <div style={{ display: "flex", marginTop: 56 * s, background: "#FF7A59", border: `${5 * s}px solid #0E2A24`, borderRadius: 40 * s, padding: `${26 * s}px ${44 * s}px`, fontFamily: "Baloo 2", fontWeight: 800, fontSize: 48 * s, boxShadow: `0 ${12 * s}px 0 #0E2A24` }}>
            Check yours free
          </div>
          <div style={{ marginTop: 34 * s, fontSize: 36 * s, fontWeight: 800, color: "#35514A" }}>{site.siteUrl.replace(/^https?:\/\//, "")}</div>
        </div>
        <div style={{ position: "absolute", bottom: 60 * s, fontSize: 26 * s, fontWeight: 700, color: "#4A615B" }}>An estimate based on WHO risk charts, not a diagnosis.</div>
      </div>
    ),
    { width: W, height: H, fonts: await loadFonts(), headers: { "cache-control": "private, no-store" } },
  );
}
