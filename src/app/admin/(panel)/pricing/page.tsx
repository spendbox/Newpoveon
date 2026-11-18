export const dynamic = "force-dynamic";
import { COMPONENT_CATEGORIES, loadCatalogue, loadFx, naira } from "@/lib/care-plans";
import { marginFromMarkup } from "@/lib/pricing";
import { saveCareOption, saveComponent, savePricingSettings } from "../../actions";
import { aBtn, aInput, Badge, Card, H1 } from "../../ui";

export default async function PricingPage() {
  const { settings, components, options, plans } = await loadCatalogue();
  const fx = await loadFx();
  const rate = (c: string) => fx.find((f) => f.code === c)?.rate ?? "";
  const missing = components.filter((c) => c.active && c.cost_naira == null).length;
  return (
    <>
      <H1 sub="These numbers price every care plan. Change them at any time; plan prices update straight away. Unit costs are never shown to the public.">Pricing</H1>

      <Card className="mb-6">
        <p className="mb-3 font-semibold">Pricing rules</p>
        <form action={savePricingSettings} className="grid gap-3 md:grid-cols-5 md:items-end">
          <label className="text-sm font-semibold">Default markup (price ÷ cost)<input name="default_markup" inputMode="decimal" defaultValue={settings.defaultMarkup} className={aInput} /></label>
          <p className="text-sm text-muted md:pb-2">= {Math.round(marginFromMarkup(settings.defaultMarkup) * 100)}% gross margin. 4× = 75%.</p>
          <label className="text-sm font-semibold">Quarterly payment premium (%)<input name="quarterly_premium" inputMode="decimal" defaultValue={Math.round(settings.quarterlyPremium * 1000) / 10} className={aInput} /></label>
          <label className="text-sm font-semibold">Monthly payment premium (%)<input name="monthly_premium" inputMode="decimal" defaultValue={Math.round(settings.monthlyPremium * 1000) / 10} className={aInput} /></label>
          <label className="text-sm font-semibold">Round yearly prices up to (₦)<input name="round_to" inputMode="numeric" defaultValue={settings.roundTo} className={aInput} /></label>
          <p className="text-sm font-semibold md:col-span-5">Exchange rates for prices shown abroad (naira for 1 unit; leave empty to hide that currency)</p>
          <label className="text-sm font-semibold">₦ per £1<input name="fx_gbp" inputMode="decimal" defaultValue={rate("GBP")} className={aInput} /></label>
          <label className="text-sm font-semibold">₦ per $1<input name="fx_usd" inputMode="decimal" defaultValue={rate("USD")} className={aInput} /></label>
          <label className="text-sm font-semibold">₦ per €1<input name="fx_eur" inputMode="decimal" defaultValue={rate("EUR")} className={aInput} /></label>
          <label className="text-sm font-semibold">₦ per CA$1<input name="fx_cad" inputMode="decimal" defaultValue={rate("CAD")} className={aInput} /></label>
          <p className="text-xs text-muted md:pb-2">Update these weekly. Prices are charged in naira; the foreign amount is shown as a guide.</p>
          <div className="md:col-span-5"><button className={aBtn}>Save rules</button></div>
        </form>
      </Card>

      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-xl font-semibold">Unit costs</h2>
        {missing > 0 && <Badge tone="warn">{missing} still need a cost</Badge>}
      </div>
      <p className="mb-3 text-sm text-muted">What each building block costs Poveon. A plan can&apos;t be priced automatically until every block in it has a cost (or you type a fixed price for the plan).</p>
      <div className="flex flex-col gap-2">
        {components.map((c) => {
          const usedIn = plans.filter((p) => p.items.some((i) => i.component_id === c.id)).length;
          return (
            <form key={c.id} action={saveComponent} className="grid items-end gap-2 rounded-xl border border-line bg-surface p-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="code" value={c.code} />
              <input type="hidden" name="sort" value={c.sort} />
              <label className="text-sm font-semibold">Name<input name="name" defaultValue={c.name} className={aInput} /></label>
              <label className="text-sm font-semibold">Category
                <select name="category" defaultValue={c.category} className={aInput}>{COMPONENT_CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select>
              </label>
              <label className="text-sm font-semibold">Unit<input name="unit" defaultValue={c.unit} className={aInput} /></label>
              <label className="text-sm font-semibold">Cost to us (₦)<input name="cost_naira" inputMode="numeric" defaultValue={c.cost_naira ?? ""} placeholder="not set" className={`${aInput} ${c.cost_naira == null ? "border-check-text" : ""}`} /></label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={c.active} /> On</label>
                <button className={aBtn}>Save</button>
              </div>
              <p className="text-xs text-subtle md:col-span-5">Used in {usedIn} plan{usedIn === 1 ? "" : "s"}{c.notes ? ` · ${c.notes}` : ""}</p>
            </form>
          );
        })}
        <Card className="border-dashed">
          <p className="mb-2 font-semibold">Add a building block</p>
          <form action={saveComponent} className="grid items-end gap-2 md:grid-cols-[1fr_2fr_1fr_1fr_1fr_auto]">
            <label className="text-sm font-semibold">Code<input name="code" required placeholder="e.g. dietitian-session" className={aInput} /></label>
            <label className="text-sm font-semibold">Name<input name="name" required className={aInput} /></label>
            <label className="text-sm font-semibold">Category<select name="category" className={aInput}>{COMPONENT_CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="text-sm font-semibold">Unit<input name="unit" defaultValue="each" className={aInput} /></label>
            <label className="text-sm font-semibold">Cost (₦)<input name="cost_naira" inputMode="numeric" className={aInput} /></label>
            <input type="hidden" name="active" value="on" />
            <button className={aBtn}>Add</button>
          </form>
        </Card>
      </div>

      <h2 className="mt-8 mb-2 text-xl font-semibold">Customer options</h2>
      <p className="mb-3 text-sm text-muted">Choices that change a plan&apos;s price when someone picks them, e.g. tests at home ×1.2 on test lines. Shown openly to customers as add-ons.</p>
      <div className="flex flex-col gap-2">
        {[...options, null].map((o, i) => (
          <form key={o?.id ?? `new-${i}`} action={saveCareOption} className={`grid items-end gap-2 rounded-xl border bg-surface p-3 md:grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] ${o ? "border-line" : "border-dashed border-line-strong"}`}>
            {o && <input type="hidden" name="id" value={o.id} />}
            <label className="text-sm font-semibold">Code<input name="code" required defaultValue={o?.code} className={aInput} /></label>
            <label className="text-sm font-semibold">Name<input name="name" required defaultValue={o?.name} className={aInput} /></label>
            <label className="text-sm font-semibold">Affects
              <select name="category" defaultValue={o?.category ?? ""} className={aInput}><option value="">Nothing (add-on only)</option>{COMPONENT_CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select>
            </label>
            <label className="text-sm font-semibold">Multiplier<input name="multiplier" inputMode="decimal" defaultValue={o?.multiplier ?? 1} className={aInput} /></label>
            <label className="text-sm font-semibold">Add (₦/yr)<input name="add_naira" inputMode="numeric" defaultValue={o?.add_naira ?? 0} className={aInput} /></label>
            <div className="flex items-center gap-3"><label className="flex items-center gap-1 text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={o?.active ?? true} /> On</label><button className={aBtn}>{o ? "Save" : "Add"}</button></div>
          </form>
        ))}
      </div>
      <p className="mt-6 text-xs text-subtle">Tip: markup applies to cost. A plan costing {naira(100000)} at 4× sells for {naira(400000)} a year.</p>
    </>
  );
}
