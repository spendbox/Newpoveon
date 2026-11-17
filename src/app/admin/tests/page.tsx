export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase/server";
import { saveTest } from "../actions";
import { aBtn, aInput, Card, H1 } from "../ui";

type T = { id?: string; code: string; name: string; description: string | null; price_naira: number | null; is_bundle: boolean; includes: string[]; active: boolean; sort: number };

function TestForm({ t }: { t?: T }) {
  return (
    <form action={saveTest} className="grid gap-3 md:grid-cols-6 md:items-end">
      {t?.id && <input type="hidden" name="id" value={t.id} />}
      <label className="text-sm font-bold md:col-span-2">Name<input name="name" required defaultValue={t?.name} className={aInput} /></label>
      <label className="text-sm font-bold">Code<input name="code" required defaultValue={t?.code} className={aInput} title="Used by result cards, e.g. bp-check" /></label>
      <label className="text-sm font-bold">Price (₦)<input name="price" inputMode="numeric" defaultValue={t?.price_naira ?? ""} placeholder="blank = on request" className={aInput} /></label>
      <label className="text-sm font-bold">Order<input name="sort" type="number" defaultValue={t?.sort ?? 100} className={aInput} /></label>
      <div className="flex gap-3 text-sm font-bold">
        <label className="flex items-center gap-1"><input type="checkbox" name="active" defaultChecked={t?.active ?? true} /> Live</label>
        <label className="flex items-center gap-1"><input type="checkbox" name="is_bundle" defaultChecked={t?.is_bundle} /> Bundle</label>
      </div>
      <label className="text-sm font-bold md:col-span-3">Description<input name="description" defaultValue={t?.description ?? ""} className={aInput} /></label>
      <label className="text-sm font-bold md:col-span-2">Bundle includes (comma separated)<input name="includes" defaultValue={t?.includes?.join(", ")} className={aInput} /></label>
      <button className={aBtn}>{t ? "Save" : "Add test"}</button>
    </form>
  );
}

export default async function TestsPage() {
  const { data } = await supabaseAdmin().from("home_tests").select("*").order("sort");
  return (
    <>
      <H1 sub="These show on the home test page. Result cards link to tests by their code (bp-check, blood-sugar, hepatitis-b, genotype, cervical-screening).">Home tests and prices</H1>
      <div className="flex flex-col gap-3">
        {(data ?? []).map((t) => <Card key={t.id}><TestForm t={t as T} /></Card>)}
        <Card className="border-dashed"><p className="mb-2 font-extrabold">Add a new test or bundle</p><TestForm /></Card>
      </div>
    </>
  );
}
