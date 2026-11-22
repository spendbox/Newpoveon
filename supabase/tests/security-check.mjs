// Runs the migration in an in-memory Postgres and checks the row-level security rules.
// Run: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
const db = new PGlite();
// Minimal stand-in for Supabase's auth schema and roles.
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
`);
for (const f of fs.readdirSync(new URL("../migrations/", import.meta.url)).filter((f) => f.endsWith(".sql")).sort()) {
  await db.exec(fs.readFileSync(new URL(`../migrations/${f}`, import.meta.url), "utf8"));
}
// Running the package migration twice must be safe.
await db.exec(fs.readFileSync(new URL("../migrations/20261118000000_lab_packages.sql", import.meta.url), "utf8"));
await db.exec("update home_tests set price_naira = 45000 where code = 'full-health-check'");
await db.exec(fs.readFileSync(new URL("../migrations/20261118000000_lab_packages.sql", import.meta.url), "utf8"));
console.log("price kept after re-run:", (await db.query("select price_naira from home_tests where code='full-health-check'")).rows[0].price_naira);
await db.exec(fs.readFileSync(new URL("../migrations/20261118200000_care_plans.sql", import.meta.url), "utf8"));
console.log("care plans:", (await db.query("select count(*)::int n from care_plans")).rows[0].n, "plan items:", (await db.query("select count(*)::int n from care_plan_items")).rows[0].n, "components:", (await db.query("select count(*)::int n from care_components")).rows[0].n);
await db.exec(fs.readFileSync(new URL("../migrations/20261118300000_family_care.sql", import.meta.url), "utf8"));
await db.exec(fs.readFileSync(new URL("../migrations/20261118300000_family_care.sql", import.meta.url), "utf8"));
console.log("family plans:", (await db.query("select count(*)::int n from care_plans where audience='family'")).rows[0].n, "family items:", (await db.query("select count(*)::int n from care_plan_items i join care_plans p on p.id=i.plan_id where p.audience='family'")).rows[0].n);
await db.exec("insert into service_requests (kind,name,phone,address) values ('family_care','A','+447700900000','Lagos')");
console.log("family request stored: ok");
await db.exec(fs.readFileSync(new URL("../migrations/20261119000000_consults_and_schedule.sql", import.meta.url), "utf8"));
await db.exec(fs.readFileSync(new URL("../migrations/20261119000000_consults_and_schedule.sql", import.meta.url), "utf8"));
console.log("consult types:", (await db.query("select count(*)::int n from consult_types")).rows[0].n, "rules:", (await db.query("select count(*)::int n from availability_rules")).rows[0].n);
{
  const t = "2030-01-07 10:00:00+01";
  const mk = async (ref) => (await db.query(`insert into bookings (name,phone,email,reason,amount_kobo,paystack_reference) values ('X','0803','x@y.z','r',500000,'${ref}') returning id`)).rows[0].id;
  const b1 = await mk("HC-cap1"), b2 = await mk("HC-cap2");
  const r1 = (await db.query(`select book_time('${b1}', '${t}', 1, 30) ok`)).rows[0].ok;
  const r2 = (await db.query(`select book_time('${b2}', '${t}', 1, 30) ok`)).rows[0].ok;
  const r3 = (await db.query(`select book_time('${b2}', '${t}', 2, 30) ok`)).rows[0].ok;
  console.log("book_time capacity 1:", r1, r2, "capacity 2:", r3);
  console.log("new-style paid, no reschedule flag:", JSON.stringify((await db.query(`select status, needs_reschedule from mark_booking_paid('HC-cap1', 500000)`)).rows));
}
await db.exec(fs.readFileSync(new URL("../migrations/20261120000000_voice_notes.sql", import.meta.url), "utf8"));
{
  await db.exec("update consult_types set price_naira = 7000 where code = 'results-review'");
  const mc = fs.readFileSync(new URL("../migrations/20261122000000_more_consult_types.sql", import.meta.url), "utf8");
  await db.exec(mc); await db.exec(mc);
  console.log("new consult types:", JSON.stringify((await db.query("select code, price_naira from consult_types where grp = 'Healthy habits' or code = 'medicine-check' order by sort")).rows));
}
await db.exec(fs.readFileSync(new URL("../migrations/20261120000000_voice_notes.sql", import.meta.url), "utf8"));
console.log("voice bucket private:", JSON.stringify((await db.query("select id, public from storage.buckets")).rows));
console.log("packages:", (await db.query("select count(*)::int n from home_tests where is_bundle and active")).rows[0].n, "single tests:", (await db.query("select count(*)::int n from home_tests where not is_bundle and active")).rows[0].n);
{
  const rn = fs.readFileSync(new URL("../migrations/20261123000000_rename_to_poveon.sql", import.meta.url), "utf8");
  await db.exec(rn); await db.exec(rn);
  console.log("old name left in consult types:", (await db.query("select count(*)::int n from consult_types where name like '%HealthCheck%' or description like '%HealthCheck%'")).rows[0].n);
}
{
  const se = fs.readFileSync(new URL("../migrations/20261124000000_something_else_consult.sql", import.meta.url), "utf8");
  await db.exec(se); await db.exec(se);
  console.log("something else:", JSON.stringify((await db.query("select code, grp, urgent_check, price_naira from consult_types where code = 'something-else'")).rows));
}
{
  const sb12 = fs.readFileSync(new URL("../migrations/20261125000000_simple_booking.sql", import.meta.url), "utf8");
  await db.exec(sb12); await db.exec(sb12);
  console.log("general consult:", JSON.stringify((await db.query("select code, urgent_check, price_naira from consult_types where code = 'doctor-consult'")).rows), "attachments bucket private:", JSON.stringify((await db.query("select public from storage.buckets where id = 'attachments'")).rows));
}
console.log("migration OK");
const u1 = "11111111-1111-1111-1111-111111111111", u2 = "22222222-2222-2222-2222-222222222222";
await db.exec(`insert into auth.users values ('${u1}','a@x.com'),('${u2}','b@x.com');`);
console.log("profiles auto-created:", (await db.query("select count(*)::int n from profiles")).rows[0].n);
await db.exec(`update profiles set role='admin' where id='${u2}';`);
const ins = (uid, email) => `insert into screenings (user_id,email,answers,results,results_version,consent_at,consent_text,owner_token_hash) values (${uid ? `'${uid}'` : "null"},'${email}','{}','{}',1,now(),'x','h');`;
await db.exec(ins(u1, "a@x.com") + ins(null, "guest@x.com") + ins(u2, "b@x.com"));
{
  // Wellbeing column: backfills from saved results, ignores rows without a score, safe to re-run.
  await db.exec(`insert into screenings (email,answers,results,results_version,consent_at,consent_text,owner_token_hash) values ('w@x.com','{}','{"wellbeing":{"score":64,"band":"good"}}',1,now(),'x','h');`);
  const wb = fs.readFileSync(new URL("../migrations/20261121000000_wellbeing_score.sql", import.meta.url), "utf8");
  await db.exec(wb); await db.exec(wb);
  console.log("wellbeing backfill:", JSON.stringify((await db.query("select email, wellbeing_score from screenings where email in ('w@x.com','guest@x.com') order by email")).rows));
  await db.exec("delete from screenings where email = 'w@x.com'");
}
const slot = (await db.query("insert into availability_slots (starts_at) values (now() + interval '2 days') returning id")).rows[0].id;
await db.exec(`insert into bookings (name,phone,email,reason,slot_id,amount_kobo,paystack_reference) values ('A','0803','a@x.com','r','${slot}',500000,'HC-ref1');`);
const bid = (await db.query("select id from bookings")).rows[0].id;
console.log("reserve 1:", (await db.query(`select reserve_slot('${slot}','${bid}',30) ok`)).rows[0].ok, "reserve again:", (await db.query(`select reserve_slot('${slot}','${bid}',30) ok`)).rows[0].ok);
console.log("mark paid wrong amount:", (await db.query(`select count(*)::int n from mark_booking_paid('HC-ref1', 100)`)).rows[0].n);
console.log("mark paid:", (await db.query(`select count(*)::int n from mark_booking_paid('HC-ref1', 500000)`)).rows[0].n, "again (must be 0):", (await db.query(`select count(*)::int n from mark_booking_paid('HC-ref1', 500000)`)).rows[0].n);
console.log("slot status:", (await db.query(`select status from availability_slots`)).rows[0].status);

async function as(role, uid, sql) {
  await db.exec(`set role ${role}; select set_config('request.jwt.sub', '${uid ?? ""}', false);`);
  try { return (await db.query(sql)).rows; } catch (e) { return "ERROR: " + e.message; } finally { await db.exec("reset role;"); }
}
console.log("anon screenings:", (await as("anon", null, "select id from screenings")).length);
console.log("anon bookings:", (await as("anon", null, "select id from bookings")).length);
console.log("anon reads component costs:", JSON.stringify(await as("anon", null, "select cost_naira from care_components")));
console.log("authenticated reads plans:", JSON.stringify(await as("authenticated", u1, "select name from care_plans")));
console.log("anon consult types (priced only):", (await as("anon", null, "select code from consult_types")).length);
console.log("anon home tests:", (await as("anon", null, "select id from home_tests")).length);
console.log("anon contacts (placeholder hidden):", JSON.stringify(await as("anon", null, "select label, phone from emergency_contacts")));
console.log("u1 screenings (own only):", (await as("authenticated", u1, "select email from screenings")).map(r=>r.email));
console.log("u1 bookings:", (await as("authenticated", u1, "select id from bookings")).length);
console.log("admin screenings (no blanket access):", (await as("authenticated", u2, "select email from screenings")).map(r=>r.email));
console.log("admin bookings:", (await as("authenticated", u2, "select id from bookings")).length);
console.log("u1 tries to make self admin:", await as("authenticated", u1, `update profiles set role='admin' where id='${u1}'`));
console.log("u1 role now:", (await db.query(`select role from profiles where id='${u1}'`)).rows[0].role);
console.log("u1 tries to mark has_password:", await as("authenticated", u1, `update profiles set has_password=true where id='${u1}'`));
console.log("u1 updates own name:", JSON.stringify(await as("authenticated", u1, `update profiles set full_name='Ada' where id='${u1}' returning full_name`)));
console.log("u1 calls reserve_slot:", await as("authenticated", u1, `select reserve_slot('${slot}','${bid}',30)`));
console.log("anon inserts screening:", await as("anon", null, ins(null, "evil@x.com")));
{
  // Personal plans: own rows readable, nothing writable from the browser.
  const pl = fs.readFileSync(new URL("../migrations/20261126000000_personal_plans.sql", import.meta.url), "utf8");
  await db.exec(pl); await db.exec(pl);
  const p1 = (await db.query(`insert into plans (user_id, status) values ('${u1}', 'draft') returning id`)).rows[0].id;
  await db.query(`insert into plans (user_id, status) values ('${u2}', 'active')`);
  const g1 = (await db.query(`insert into plan_goals (plan_id, user_id, area, settings) values ('${p1}', '${u1}', 'move', '{}') returning id`)).rows[0].id;
  await db.query(`insert into plan_logs (goal_id, user_id, day) values ('${g1}', '${u1}', '2026-11-20')`);
  console.log("u1 sees plans:", (await as("authenticated", u1, "select user_id from plans")).length);
  console.log("u1 marks own plan paid:", JSON.stringify(await as("authenticated", u1, `update plans set status='active', paid_until='2030-01-01' where user_id='${u1}' returning id`)));
  console.log("u1 plan status still:", (await db.query(`select status from plans where id='${p1}'`)).rows[0].status);
  console.log("u1 inserts a log directly:", JSON.stringify(await as("authenticated", u1, `insert into plan_logs (goal_id, user_id, day) values ('${g1}', '${u1}', '2026-11-21')`)));
  console.log("anon sees plan logs:", (await as("anon", null, "select id from plan_logs")).length);
}
{
  const dk = fs.readFileSync(new URL("../migrations/20261127000000_plan_member_discount.sql", import.meta.url), "utf8");
  await db.exec(dk); await db.exec(dk);
  console.log("plan perks:", JSON.stringify((await db.query("select plan_price_naira, plan_discount_type, plan_discount_value from booking_settings")).rows));
  try { await db.exec("update booking_settings set plan_discount_type='percent', plan_discount_value=150"); console.log("150% allowed?!"); } catch { console.log("150% discount refused: ok"); }
}
{
  const px = fs.readFileSync(new URL("../migrations/20261128000000_consult_price_7500.sql", import.meta.url), "utf8");
  await db.exec(px); await db.exec(px);
  console.log("consult fees:", JSON.stringify((await db.query("select distinct price_naira from consult_types where price_naira is not null")).rows));
}
