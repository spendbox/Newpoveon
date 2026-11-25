export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase/server";
import { savePlanPerks, saveConsultType } from "../../actions";
import { loadPlanSettings } from "@/lib/plan/settings";
import { discountLabel, memberPrice } from "@/lib/plan/perks";
import { aBtn, aInput, Badge, Card, H1 } from "../../ui";
import { SubmitButton } from "@/components/buttons";
import { consultsOn } from "@/lib/help";
import { bioAgePrice } from "@/lib/bioage/server";

type T = { id?: string; code: string; name: string; description: string | null; grp: string; doctor_type: string; duration_min: number; price_naira: number | null; urgent_check: boolean; credit_to_plan: boolean; active: boolean; sort: number };

function Form({ t }: { t?: T }) {
  return (
    <form action={saveConsultType} className="grid gap-2 md:grid-cols-6 md:items-end">
      {t?.id && <input type="hidden" name="id" value={t.id} />}
      <label className="text-sm font-semibold md:col-span-3">What people need help with<input name="name" required defaultValue={t?.name} className={aInput} /></label>
      <label className="text-sm font-semibold">Fee (₦)<input name="price_naira" inputMode="numeric" defaultValue={t?.price_naira ?? ""} placeholder="empty = hidden" className={aInput} /></label>
      <label className="text-sm font-semibold">Doctor<input name="doctor_type" defaultValue={t?.doctor_type ?? "General physician"} className={aInput} /></label>
      <label className="text-sm font-semibold">Minutes<input name="duration_min" type="number" min={5} max={180} defaultValue={t?.duration_min ?? 20} className={aInput} /></label>
      <label className="text-sm font-semibold md:col-span-3">Short description<input name="description" defaultValue={t?.description ?? ""} className={aInput} /></label>
      <label className="text-sm font-semibold">Group<input name="grp" defaultValue={t?.grp ?? "Common"} className={aInput} /></label>
      <label className="text-sm font-semibold">Code<input name="code" required defaultValue={t?.code} className={aInput} /></label>
      <label className="text-sm font-semibold">Order<input name="sort" type="number" defaultValue={t?.sort ?? 100} className={aInput} /></label>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold md:col-span-5">
        <label className="flex items-center gap-1.5"><input type="checkbox" name="active" defaultChecked={t?.active ?? true} /> Offered</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" name="urgent_check" defaultChecked={t?.urgent_check ?? true} /> Ask about danger signs first</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" name="credit_to_plan" defaultChecked={t?.credit_to_plan ?? false} /> Credit fee towards a care plan</label>
      </div>
      <div className="md:text-right"><SubmitButton className={aBtn}>{t ? "Save" : "Add"}</SubmitButton></div>
    </form>
  );
}

export default async function ConsultsPage() {
  const { data } = await supabaseAdmin().from("consult_types").select("*").order("sort");
  const rows = (data ?? []) as T[];
  const perks = await loadPlanSettings();
  const bioPrice = consultsOn ? null : await bioAgePrice();
  const example = rows.find((r) => r.code === "doctor-consult" && r.price_naira != null) ?? rows.find((r) => r.price_naira != null);
  return (
    <>
      <Card className="mb-6">
        <h2 className="text-lg font-semibold">Health check and plan</h2>
        <p className="mt-1 text-sm text-muted">What one health check costs (answering is free; paying unlocks the results), how long the personal plan that comes with it lasts, and the members&apos; discount while a plan is active ({consultsOn ? "on doctor consults" : "on the Biological Age Check"}).</p>
        <form action={savePlanPerks} className="mt-3 grid gap-3 md:grid-cols-[1fr_0.8fr_1.4fr_1fr_auto] md:items-end">
          <label className="text-sm font-semibold">Health check price (₦)<input name="plan_price_naira" inputMode="numeric" required defaultValue={perks.price} className={aInput} /></label>
          <label className="text-sm font-semibold">Plan length (months)<input name="plan_months" type="number" min={1} max={24} required defaultValue={perks.months} className={aInput} /></label>
          <fieldset className="text-sm font-semibold">
            <legend className="mb-1">{consultsOn ? "Member discount on consults" : "Member discount on the Biological Age Check"}</legend>
            <div className="flex flex-wrap gap-3 font-medium">
              {([["fixed", "Amount (₦)"], ["percent", "Percent (%)"], ["none", "No discount"]] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5"><input type="radio" name="plan_discount_type" value={v} defaultChecked={perks.discount.type === v} /> {l}</label>
              ))}
            </div>
          </fieldset>
          <label className="text-sm font-semibold">Discount value<input name="plan_discount_value" inputMode="numeric" defaultValue={perks.discount.value} className={aInput} /></label>
          <SubmitButton className={aBtn}>Save</SubmitButton>
        </form>
        <p className="mt-3 text-sm text-muted">
          Now: <b>{discountLabel(perks.discount) || "no discount"}</b>
          {bioPrice != null && discountLabel(perks.discount) && <> · Biological Age Check ₦{bioPrice.toLocaleString("en-NG")} → <b>₦{memberPrice(bioPrice, perks.discount).toLocaleString("en-NG")}</b> for members</>}
          {consultsOn && example?.price_naira != null && discountLabel(perks.discount) && <> · e.g. &ldquo;{example.name}&rdquo; ₦{example.price_naira.toLocaleString("en-NG")} → <b>₦{memberPrice(example.price_naira, perks.discount).toLocaleString("en-NG")}</b> for members</>}
        </p>
      </Card>

      {!consultsOn ? (
        <Card><p className="text-sm text-muted"><b className="text-ink">Doctor consults are paused.</b> &ldquo;Talk to a doctor&rdquo; links lead to a &ldquo;Chat with our team&rdquo; page on WhatsApp, and no consults can be booked or paid for. Everything is kept: set <code>NEXT_PUBLIC_FEATURE_CONSULTS=true</code> in Vercel and redeploy to bring consults back.</p></Card>
      ) : (<>
      <H1 sub="What people can book help with, which doctor they see, and the fee. A type with no fee is hidden from the booking page. Fees are only shown after someone says what they need.">Consults and fees</H1>
      <div className="flex flex-col gap-2">
        {rows.map((t) => (
          <details key={t.id} className="rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3">
              <span className="font-semibold">{t.name}</span>
              <Badge>{t.grp}</Badge>
              <Badge>{t.doctor_type}</Badge>
              {!t.active && <Badge tone="warn">not offered</Badge>}
              <span className="ml-auto text-sm font-semibold">{t.price_naira != null ? `₦${t.price_naira.toLocaleString("en-NG")}` : <span className="text-check-text">No fee yet (hidden)</span>}</span>
            </summary>
            <div className="border-t border-line p-4"><Form t={t} /></div>
          </details>
        ))}
        <Card className="mt-3 border-dashed"><p className="mb-2 font-semibold">Add a consult type</p><Form /></Card>
      </div>
      </>)}
    </>
  );
}
