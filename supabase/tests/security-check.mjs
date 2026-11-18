// Runs the migration in an in-memory Postgres and checks the row-level security rules.
// Run: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
const db = new PGlite();
// Minimal stand-in for Supabase's auth schema and roles.
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
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
console.log("packages:", (await db.query("select count(*)::int n from home_tests where is_bundle and active")).rows[0].n, "single tests:", (await db.query("select count(*)::int n from home_tests where not is_bundle and active")).rows[0].n);
console.log("migration OK");
const u1 = "11111111-1111-1111-1111-111111111111", u2 = "22222222-2222-2222-2222-222222222222";
await db.exec(`insert into auth.users values ('${u1}','a@x.com'),('${u2}','b@x.com');`);
console.log("profiles auto-created:", (await db.query("select count(*)::int n from profiles")).rows[0].n);
await db.exec(`update profiles set role='admin' where id='${u2}';`);
const ins = (uid, email) => `insert into screenings (user_id,email,answers,results,results_version,consent_at,consent_text,owner_token_hash) values (${uid ? `'${uid}'` : "null"},'${email}','{}','{}',1,now(),'x','h');`;
await db.exec(ins(u1, "a@x.com") + ins(null, "guest@x.com") + ins(u2, "b@x.com"));
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
