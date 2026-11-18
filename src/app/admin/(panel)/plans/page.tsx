export const dynamic = "force-dynamic";
import { loadCatalogue, naira, TIERS } from "@/lib/care-plans";
import { saveCareGoal, saveCarePlan, savePlanItem } from "../../actions";
import { aBtn, aBtnQuiet, aInput, Badge, Card, H1 } from "../../ui";

export default async function PlansPage() {
  const { goals, plans, components, settings } = await loadCatalogue();
  const compById = new Map(components.map((c) => [c.id, c]));
  return (
    <>
      <H1 sub={`Every plan's price is editable here. Leave "Fixed price" empty to price it automatically from unit costs × markup (default ${settings.defaultMarkup}×, set in Pricing). Quantities are per year.`}>Care plans</H1>
      <div className="flex flex-col gap-6">
        {goals.map((g) => {
          const gp = plans.filter((p) => p.plan.goal_id === g.id);
          return (
            <section key={g.id} className="rounded-xl border border-line bg-surface">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3">
                  <span className="font-semibold">{g.name}</span>
                  <Badge>{g.area}</Badge>
                  <Badge tone={g.active ? "good" : "neutral"}>{g.active ? "offered" : "not offered yet"}</Badge>
                  <span className="ml-auto text-sm text-muted">{gp.length} plan{gp.length === 1 ? "" : "s"}</span>
                </summary>
                <div className="border-t border-line p-4">
                  <form action={saveCareGoal} className="mb-4 grid items-end gap-2 md:grid-cols-[2fr_1fr_auto]">
                    <input type="hidden" name="id" value={g.id} /><input type="hidden" name="code" value={g.code} /><input type="hidden" name="sort" value={g.sort} />
                    <label className="text-sm font-semibold">Goal name<input name="name" defaultValue={g.name} className={aInput} /></label>
                    <label className="text-sm font-semibold">Area<input name="area" defaultValue={g.area} className={aInput} /></label>
                    <div className="flex items-center gap-3"><label className="flex items-center gap-1 text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={g.active} /> Offer this goal</label><button className={aBtnQuiet}>Save goal</button></div>
                  </form>

                  <div className="flex flex-col gap-4">
                    {gp.map(({ plan: p, items, price }) => (
                      <Card key={p.id} className="bg-[#FBFCFC]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{p.name} {!p.active && <Badge tone="warn">hidden</Badge>}</p>
                            <p className="text-sm text-muted">{p.summary}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-2xl font-semibold">{price.annual ? `${naira(price.annual)}/yr` : "Not priced"}</p>
                            {price.annual && <p className="text-xs text-muted">{naira(price.quarterly)}/quarter · {naira(price.monthly)}/month</p>}
                            <p className="text-xs text-muted">Cost {naira(price.costNaira)} · {price.annual ? `${price.markup.toFixed(1)}× markup · ${Math.round(price.grossMargin * 100)}% margin` : ""} {price.source === "override" && <Badge>fixed price</Badge>}</p>
                          </div>
                        </div>
                        {price.missingCosts.length > 0 && <p className="mt-2 rounded-lg bg-check-bg px-3 py-2 text-xs text-check-text">Missing unit costs: {price.missingCosts.join(", ")}. Add them in Pricing, or type a fixed price.</p>}
                        {price.annual && price.markup < settings.defaultMarkup && price.source === "override" && <p className="mt-2 rounded-lg bg-act-bg px-3 py-2 text-xs text-act-text">This fixed price is below your target markup of {settings.defaultMarkup}×.</p>}

                        <form action={saveCarePlan} className="mt-3 grid items-end gap-2 md:grid-cols-6">
                          <input type="hidden" name="id" value={p.id} /><input type="hidden" name="goal_id" value={p.goal_id} /><input type="hidden" name="sort" value={p.sort} />
                          <label className="text-sm font-semibold md:col-span-2">Name<input name="name" defaultValue={p.name} className={aInput} /></label>
                          <label className="text-sm font-semibold">Tier<select name="tier" defaultValue={p.tier} className={aInput}>{TIERS.map((t) => <option key={t}>{t}</option>)}</select></label>
                          <label className="text-sm font-semibold">Fixed price (₦/yr)<input name="price_override_naira" inputMode="numeric" defaultValue={p.price_override_naira ?? ""} placeholder="automatic" className={aInput} /></label>
                          <label className="text-sm font-semibold">Markup for this plan<input name="markup_override" inputMode="decimal" defaultValue={p.markup_override ?? ""} placeholder={`${settings.defaultMarkup}× (default)`} className={aInput} /></label>
                          <div className="flex items-center gap-3"><label className="flex items-center gap-1 text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={p.active} /> Show</label><button className={aBtn}>Save plan</button></div>
                          <label className="text-sm font-semibold md:col-span-6">Summary<input name="summary" defaultValue={p.summary ?? ""} className={aInput} /></label>
                        </form>

                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-semibold text-primary">What&apos;s included ({items.length} lines)</summary>
                          <table className="mt-2 w-full text-sm">
                            <thead><tr className="text-left text-xs text-muted"><th className="py-1">Building block</th><th>Unit cost</th><th>Qty / year</th><th>Line cost</th><th /></tr></thead>
                            <tbody>
                              {items.map((i) => {
                                const c = compById.get(i.component_id);
                                return (
                                  <tr key={i.id} className="border-t border-line">
                                    <td className="py-1.5">{c?.name}</td>
                                    <td>{naira(c?.cost_naira)}</td>
                                    <td colSpan={3}>
                                      <form action={savePlanItem} className="flex items-center gap-2">
                                        <input type="hidden" name="plan_id" value={p.id} /><input type="hidden" name="component_id" value={i.component_id} />
                                        <input name="quantity" inputMode="decimal" defaultValue={Number(i.quantity)} aria-label={`Quantity of ${c?.name}`} className={`${aInput} w-20`} />
                                        <span className="w-28 text-muted">{c?.cost_naira != null ? naira(c.cost_naira * Number(i.quantity)) : "—"}</span>
                                        <button className={aBtnQuiet}>Update</button>
                                        <span className="text-xs text-subtle">0 removes it</span>
                                      </form>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <form action={savePlanItem} className="mt-2 flex flex-wrap items-end gap-2">
                            <input type="hidden" name="plan_id" value={p.id} />
                            <label className="text-sm font-semibold">Add a block<select name="component_id" className={aInput}>{components.filter((c) => c.active && !items.some((i) => i.component_id === c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                            <label className="text-sm font-semibold">Qty / year<input name="quantity" inputMode="decimal" defaultValue="1" className={`${aInput} w-24`} /></label>
                            <button className={aBtnQuiet}>Add</button>
                          </form>
                        </details>
                      </Card>
                    ))}
                    <Card className="border-dashed">
                      <p className="mb-2 text-sm font-semibold">Add a plan for this goal</p>
                      <form action={saveCarePlan} className="grid items-end gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
                        <input type="hidden" name="goal_id" value={g.id} /><input type="hidden" name="active" value="on" />
                        <label className="text-sm font-semibold">Name<input name="name" required placeholder={`${g.name} · Concierge`} className={aInput} /></label>
                        <label className="text-sm font-semibold">Tier<select name="tier" className={aInput}>{TIERS.map((t) => <option key={t}>{t}</option>)}</select></label>
                        <label className="text-sm font-semibold">Fixed price (₦/yr)<input name="price_override_naira" inputMode="numeric" placeholder="automatic" className={aInput} /></label>
                        <button className={aBtn}>Add plan</button>
                      </form>
                    </Card>
                  </div>
                </div>
              </details>
            </section>
          );
        })}
        <Card className="border-dashed">
          <p className="mb-2 font-semibold">Add a goal</p>
          <form action={saveCareGoal} className="grid items-end gap-2 md:grid-cols-[1fr_2fr_1fr_auto]">
            <label className="text-sm font-semibold">Code<input name="code" required placeholder="e.g. menopause" className={aInput} /></label>
            <label className="text-sm font-semibold">Goal, as people say it<input name="name" required className={aInput} /></label>
            <label className="text-sm font-semibold">Area<input name="area" defaultValue="Prevention" className={aInput} /></label>
            <button className={aBtn}>Add goal</button>
          </form>
        </Card>
      </div>
    </>
  );
}
