import type { ReactNode } from "react";

export const aInput = "min-h-[40px] w-full rounded-lg border border-line bg-surface px-3 text-sm font-semibold focus:border-ink focus:outline-none";
export const aBtn = "min-h-[40px] rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-[#1b4038] disabled:opacity-50";
export const aBtnQuiet = "min-h-[40px] rounded-lg border border-line bg-surface px-3 text-sm font-semibold hover:bg-ground";

export function H1({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl">{children}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface p-4 ${className}`}>{children}</div>;
}
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" }) {
  const t = { neutral: "bg-ground text-muted", good: "bg-good-bg text-good-text", warn: "bg-check-bg text-check-text" }[tone];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${t}`}>{children}</span>;
}
export function Tabs({ items, active }: { items: { href: string; label: string; key: string }[]; active: string }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map((i) => (
        <a key={i.key} href={i.href} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${i.key === active ? "bg-ink text-white" : "border border-line bg-surface"}`}>{i.label}</a>
      ))}
    </div>
  );
}
