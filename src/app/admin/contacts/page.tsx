export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase/server";
import { saveContact } from "../actions";
import { aBtn, aBtnQuiet, aInput, Badge, Card, H1 } from "../ui";

type C = { id?: string; label: string; phone: string | null; description: string | null; active: boolean; sort: number; is_placeholder?: boolean };

function ContactForm({ c }: { c?: C }) {
  return (
    <form action={saveContact} className="grid gap-3 md:grid-cols-6 md:items-end">
      {c?.id && <input type="hidden" name="id" value={c.id} />}
      <label className="text-sm font-bold md:col-span-2">Label<input name="label" required defaultValue={c?.label} className={aInput} /></label>
      <label className="text-sm font-bold">Phone<input name="phone" defaultValue={c?.phone ?? ""} placeholder="Verified number only" className={aInput} /></label>
      <label className="text-sm font-bold md:col-span-2">Description<input name="description" defaultValue={c?.description ?? ""} className={aInput} /></label>
      <label className="text-sm font-bold">Order<input name="sort" type="number" defaultValue={c?.sort ?? 100} className={aInput} /></label>
      <label className="flex items-center gap-1 text-sm font-bold"><input type="checkbox" name="active" defaultChecked={c?.active ?? true} /> Show to users</label>
      <div className="flex gap-2">
        <button className={aBtn}>{c ? "Save" : "Add"}</button>
        {c?.id && <button name="delete" value="1" className={aBtnQuiet}>Remove</button>}
      </div>
    </form>
  );
}

export default async function ContactsPage() {
  const { data } = await supabaseAdmin().from("emergency_contacts").select("*").order("sort");
  return (
    <>
      <H1 sub="Shown on the support screen when someone reports thoughts of self-harm. Only add numbers you have verified. A contact without a number is never shown.">Emergency contacts</H1>
      <div className="flex flex-col gap-3">
        {(data ?? []).map((c) => (
          <Card key={c.id}>
            {!c.phone && <p className="mb-2"><Badge tone="warn">Placeholder: add a verified number</Badge></p>}
            <ContactForm c={c as C} />
          </Card>
        ))}
        <Card className="border-dashed"><p className="mb-2 font-extrabold">Add a contact</p><ContactForm /></Card>
      </div>
    </>
  );
}
