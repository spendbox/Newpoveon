"use client";
import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Notice } from "@/components/ui";
import { RequestForm } from "@/components/request-form";
import type { HomeTest } from "@/lib/home-tests";

const price = (t: HomeTest) => (t.price_naira != null ? `₦${t.price_naira.toLocaleString("en-NG")}` : "Price on request");

export function LabCatalog({ tests, categories, preselect }: { tests: HomeTest[]; categories: { key: string; label: string }[]; preselect: string | null }) {
  const initial = tests.find((t) => t.code === preselect) ?? null;
  const [cat, setCat] = useState<string>(initial?.category ?? "all");
  const [selected, setSelected] = useState<HomeTest | null>(initial);
  const [open, setOpen] = useState<string | null>(initial?.id ?? null);
  const formRef = useRef<HTMLDivElement>(null);
  const present = useMemo(() => categories.filter((c) => tests.some((t) => t.category === c.key)), [categories, tests]);
  const shown = cat === "all" ? tests : tests.filter((t) => t.category === cat);

  if (tests.length === 0) {
    return (
      <div className="mt-8 max-w-xl">
        <Notice>Our test list is being updated. Tell us what you need and we&apos;ll call you.</Notice>
        <RequestForm kind="home_test" tests={[]} preselect={null} />
      </div>
    );
  }

  function choose(t: HomeTest) {
    setSelected(t);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return (
    <>
      <div className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-2" role="tablist" aria-label="Categories">
        {[{ key: "all", label: "All" }, ...present].map((c) => (
          <button key={c.key} type="button" role="tab" aria-selected={cat === c.key} onClick={() => setCat(c.key)}
            className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${cat === c.key ? "border-ink bg-ink text-white" : "border-line bg-surface text-muted hover:text-ink"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {shown.map((t) => {
          const isOpen = open === t.id;
          const isSel = selected?.id === t.id;
          return (
            <article key={t.id} className={`flex flex-col rounded-[var(--radius-xl)] border bg-surface p-5 transition-shadow ${isSel ? "border-primary shadow-[0_0_0_1px_var(--color-primary)]" : "border-line hover:shadow-[var(--shadow-md)]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {t.featured && <span className="rounded-full bg-coral-soft px-2 py-0.5 text-[11px] font-semibold text-act-text">Popular</span>}
                    {t.is_bundle && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">{t.includes.length} tests</span>}
                    {t.for_sex && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">{t.for_sex === "female" ? "Women" : "Men"}</span>}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">{t.name}</h2>
                </div>
                <p className="shrink-0 text-right font-display text-lg font-semibold tabular">{price(t)}</p>
              </div>
              {t.description && <p className="mt-1.5 text-[15px] text-muted">{t.description}</p>}
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                {t.sample && <li className="inline-flex items-center gap-1"><Icon name="drop" size={14} strokeWidth={2} />{t.sample}</li>}
                {t.turnaround && <li className="inline-flex items-center gap-1"><Icon name="clock" size={14} strokeWidth={2} />Results in {t.turnaround}</li>}
                {t.fasting && <li className="inline-flex items-center gap-1 text-check-text"><Icon name="alert" size={14} strokeWidth={2} />Fasting needed</li>}
                {t.collection === "lab" && <li className="inline-flex items-center gap-1"><Icon name="location" size={14} strokeWidth={2} />At a partner lab</li>}
              </ul>
              {t.includes.length > 0 && (
                <>
                  <button type="button" onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen} className="mt-3 inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline">
                    {isOpen ? "Hide tests" : "What's included"}
                  </button>
                  {isOpen && (
                    <ul className="mt-2 grid gap-1.5 text-sm">
                      {t.includes.map((x) => <li key={x} className="flex gap-2"><Icon name="check" size={16} strokeWidth={2.4} className="mt-0.5 shrink-0 text-primary" />{x}</li>)}
                    </ul>
                  )}
                </>
              )}
              {isOpen && t.notes && <p className="mt-3 rounded-[var(--radius-md)] bg-surface-2 px-3 py-2 text-[13px] text-muted">{t.notes}</p>}
              <button type="button" onClick={() => choose(t)} className={`mt-4 min-h-[46px] rounded-[var(--radius-md)] text-[15px] font-semibold transition-colors ${isSel ? "bg-primary text-white" : "border border-line-strong hover:bg-surface-2"}`}>
                {isSel ? "Selected" : "Choose this"}
              </button>
            </article>
          );
        })}
      </div>

      <div ref={formRef} className="mt-10 max-w-xl scroll-mt-6">
        <h2 className="text-2xl font-semibold">Book your test</h2>
        {selected ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4">
            <div>
              <p className="font-semibold">{selected.name}</p>
              <p className="text-sm text-muted">{price(selected)}{selected.fasting ? " · fasting needed" : ""}</p>
            </div>
            <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Change</button>
          </div>
        ) : (
          <p className="mt-2 text-muted">Choose a package or test above first.</p>
        )}
        {selected && <RequestForm key={selected.id} kind="home_test" tests={[selected]} preselect={selected.code} hideTestPicker />}
      </div>
    </>
  );
}
