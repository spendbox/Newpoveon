export const dynamic = "force-dynamic";
import type { HomeTest } from "@/lib/home-tests";
import { LAB_CATEGORIES } from "@/lib/home-tests";
import { supabaseAdmin } from "@/lib/supabase/server";
import { saveTest } from "../../actions";
import { aBtn, aInput, Badge, Card, H1 } from "../../ui";
import { SubmitButton } from "@/components/buttons";

type T = HomeTest & { active: boolean; sort: number };

function TestForm({ t }: { t?: T }) {
  return (
    <form action={saveTest} className="grid gap-3 md:grid-cols-6">
      {t?.id && <input type="hidden" name="id" value={t.id} />}
      <label className="text-sm font-semibold md:col-span-3">Name<input name="name" required defaultValue={t?.name} className={aInput} /></label>
      <label className="text-sm font-semibold">Price (₦)<input name="price" inputMode="numeric" defaultValue={t?.price_naira ?? ""} placeholder="blank = on request" className={aInput} /></label>
      <label className="text-sm font-semibold">Category
        <select name="category" defaultValue={t?.category ?? "full"} className={aInput}>
          {LAB_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">Code<input name="code" required defaultValue={t?.code} className={aInput} title="Short id, e.g. full-health-check. Result cards link to bp-check, blood-sugar, hepatitis-b, genotype, cervical-screening." /></label>
      <label className="text-sm font-semibold md:col-span-6">Short description<input name="description" defaultValue={t?.description ?? ""} className={aInput} /></label>
      <label className="text-sm font-semibold md:col-span-3">Tests included (one per line; leave empty for a single test)
        <textarea name="includes" rows={6} defaultValue={t?.includes?.join("\n")} className={`${aInput} py-2`} />
      </label>
      <div className="grid gap-3 md:col-span-3 md:grid-cols-2">
        <label className="text-sm font-semibold">Sample<input name="sample" defaultValue={t?.sample ?? ""} placeholder="Blood and urine" className={aInput} /></label>
        <label className="text-sm font-semibold">Results in<input name="turnaround" defaultValue={t?.turnaround ?? ""} placeholder="24–48 hours" className={aInput} /></label>
        <label className="text-sm font-semibold">For
          <select name="for_sex" defaultValue={t?.for_sex ?? ""} className={aInput}><option value="">Everyone</option><option value="female">Women</option><option value="male">Men</option></select>
        </label>
        <label className="text-sm font-semibold">Collection
          <select name="collection" defaultValue={t?.collection ?? "home"} className={aInput}><option value="home">At home</option><option value="lab">At a partner lab</option><option value="both">Home or lab</option></select>
        </label>
        <label className="text-sm font-semibold md:col-span-2">Preparation / notes<input name="notes" defaultValue={t?.notes ?? ""} placeholder="Fast for 8–10 hours before" className={aInput} /></label>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold md:col-span-4">
        <label className="flex items-center gap-1.5"><input type="checkbox" name="active" defaultChecked={t?.active ?? true} /> Live on the site</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" name="fasting" defaultChecked={t?.fasting} /> Fasting needed</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" name="featured" defaultChecked={t?.featured} /> Mark as popular</label>
        <label className="flex items-center gap-1.5">Order<input name="sort" type="number" defaultValue={t?.sort ?? 100} className={`${aInput} w-20`} /></label>
      </div>
      <div className="md:col-span-2 md:text-right"><SubmitButton className={aBtn}>{t ? "Save" : "Add package or test"}</SubmitButton></div>
    </form>
  );
}

export default async function TestsPage() {
  const { data } = await supabaseAdmin().from("home_tests").select("*").order("sort");
  const rows = (data ?? []) as T[];
  return (
    <>
      <H1 sub="Packages and single tests shown on the Lab tests page. Leave the price blank to show 'Price on request'.">Lab tests and packages</H1>
      <Card className="mb-6 border-dashed"><p className="mb-3 font-semibold">Add a new package or test</p><TestForm /></Card>
      <div className="flex flex-col gap-2">
        {rows.map((t) => (
          <details key={t.id} className="rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3">
              <span className="font-semibold">{t.name}</span>
              <Badge>{LAB_CATEGORIES.find((c) => c.key === t.category)?.label ?? t.category}</Badge>
              {t.includes?.length > 0 && <Badge>{t.includes.length} tests</Badge>}
              {!t.active && <Badge tone="warn">hidden</Badge>}
              <span className="ml-auto text-sm font-semibold">{t.price_naira != null ? `₦${t.price_naira.toLocaleString("en-NG")}` : <span className="text-check-text">No price yet</span>}</span>
            </summary>
            <div className="border-t border-line p-4"><TestForm t={t} /></div>
          </details>
        ))}
      </div>
    </>
  );
}
