import { describe, expect, it } from "vitest";
import { bySource, dropOffs, funnel, traffic, type SessionRow, type ViewRow } from "./funnel";
import { normalisePath, sourceFrom } from "./track-shared";
import { QUESTIONS } from "./questions";

const now = new Date("2026-11-27T12:00:00Z").getTime();
const ago = (min: number) => new Date(now - min * 60_000).toISOString();
const s = (over: Partial<SessionRow>): SessionRow => ({
  id: Math.random().toString(36), visitor: "v", source: "whatsapp", device: "phone", started_at: ago(120), updated_at: ago(90),
  furthest_question: QUESTIONS[0].id, furthest_index: 1, total: 40, completed_at: null, emailed_at: null, paywall_at: null, unlocked_at: null, ...over,
});
const v = (visitor: string, path = "/", source = "direct", created_at = ago(100)): ViewRow => ({ path, visitor, source, device: "phone", created_at });

describe("tracking rules", () => {
  it("never stores admin pages or share-link tokens", () => {
    expect(normalisePath("/admin/revenue")).toBeNull();
    expect(normalisePath("/api/events")).toBeNull();
    expect(normalisePath("/s/abc123secret")).toBe("/s/[shared result]");
    expect(normalisePath("/account/bio-age")).toBe("/account");
    expect(normalisePath("/check?x=1")).toBe("/check");
    expect(normalisePath("/")).toBe("/");
  });
  it("works out where people came from", () => {
    expect(sourceFrom(null, "https://l.facebook.com/x", "poveon.com")).toBe("facebook");
    expect(sourceFrom(null, "https://www.google.com/", "poveon.com")).toBe("google");
    expect(sourceFrom(null, "", "poveon.com")).toBe("direct");
    expect(sourceFrom(null, "https://poveon.com/check", "poveon.com")).toBe("direct");
    expect(sourceFrom("WhatsApp-Status", "", "poveon.com")).toBe("whatsapp");
    expect(sourceFrom("flyer", "", "poveon.com")).toBe("flyer");
  });
});

describe("traffic", () => {
  it("counts each visitor once, by the source of their first visit", () => {
    const t = traffic([v("a", "/", "whatsapp", ago(200)), v("a", "/check", "direct", ago(150)), v("b", "/")]);
    expect(t.views).toBe(3);
    expect(t.visitors).toBe(2);
    expect(t.pages[0]).toEqual({ key: "/", views: 2, visitors: 2 });
    expect(t.sources.find((x) => x.key === "whatsapp")!.visitors).toBe(1);
  });
});

describe("funnel and drop-off", () => {
  const q = (i: number) => QUESTIONS[i].id;
  const sessions = [
    s({ furthest_question: q(0), furthest_index: 1 }), // opened, left at the first question
    s({ furthest_question: q(3), furthest_index: 4 }), // left at question 4
    s({ furthest_question: q(3), furthest_index: 4, updated_at: ago(5) }), // still answering
    s({ furthest_question: q(30), furthest_index: 30, completed_at: ago(80), emailed_at: ago(79), paywall_at: ago(78) }),
  ];
  it("counts each step", () => {
    const f = funnel(10, sessions, 1);
    expect(f.map((x) => x.count)).toEqual([10, 4, 3, 1, 1, 1, 1, 1]);
  });
  it("finds the question people stop at, ignoring people still answering", () => {
    const d = dropOffs(sessions, now);
    expect(d.stopped).toBe(2);
    expect(d.inProgress).toBe(1);
    expect(d.finished).toBe(1);
    const first = d.rows.find((r) => r.id === q(0))!;
    expect(first.reached).toBe(4);
    expect(first.stopped).toBe(1);
    expect(first.rate).toBe(25);
    const fourth = d.rows.find((r) => r.id === q(3))!;
    expect(fourth.reached).toBe(3);
    expect(fourth.stopped).toBe(1);
  });
  it("splits by source", () => {
    const r = bySource([v("a", "/", "whatsapp")], sessions);
    expect(r[0]).toEqual({ key: "whatsapp", visitors: 1, opened: 4, finished: 1 });
  });
});
