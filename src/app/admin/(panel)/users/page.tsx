export const dynamic = "force-dynamic";
import Link from "next/link";
import { site } from "@/config/site";
import { Icon } from "@/components/icons";
import { supabaseAdmin } from "@/lib/supabase/server";
import { deleteUser } from "../../actions";
import { aBtnQuiet, aInput, Badge, Card, H1 } from "../../ui";
import { SubmitButton } from "@/components/buttons";

const PER_PAGE = 25;
type Profile = { id: string; email: string; full_name: string | null; phone: string | null; role: string; created_at: string };

/** Registered users: who they are, when they joined, how much they've used. No health answers are shown. */
export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const open = typeof sp.open === "string" ? sp.open : null;
  const sb = supabaseAdmin();

  let query = sb.from("profiles").select("id, email, full_name, phone, role, created_at", { count: "exact" }).order("created_at", { ascending: false });
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    query = query.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%,phone.ilike.%${safe}%`);
  }
  const { data, count } = await query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  const users = (data ?? []) as Profile[];
  const ids = users.map((u) => u.id);

  const [checks, bookings, auths, totals] = await Promise.all([
    ids.length ? sb.from("screenings").select("user_id, created_at").in("user_id", ids).then((r) => r.data ?? []) : [],
    ids.length ? sb.from("bookings").select("user_id, status").in("user_id", ids).then((r) => r.data ?? []) : [],
    Promise.all(ids.map((id) => sb.auth.admin.getUserById(id).then((r) => [id, r.data.user?.last_sign_in_at ?? null] as const).catch(() => [id, null] as const))),
    Promise.all([
      sb.from("profiles").select("*", { count: "exact", head: true }).then((r) => r.count ?? 0),
      // eslint-disable-next-line react-hooks/purity -- server render, fresh each request
      sb.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()).then((r) => r.count ?? 0),
    ]),
  ]);
  const lastSeen = new Map(auths);
  const checkCount = new Map<string, { n: number; last: string | null }>();
  for (const c of checks as { user_id: string; created_at: string }[]) {
    const v = checkCount.get(c.user_id) ?? { n: 0, last: null };
    v.n++;
    if (!v.last || c.created_at > v.last) v.last = c.created_at;
    checkCount.set(c.user_id, v);
  }
  const paidCount = new Map<string, number>();
  for (const b of bookings as { user_id: string; status: string }[]) if (b.status === "paid" || b.status === "completed") paidCount.set(b.user_id, (paidCount.get(b.user_id) ?? 0) + 1);

  const fmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: site.timeZone });
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER_PAGE));
  const link = (p: number) => `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <>
      <H1 sub="People who have created an account. Health answers aren't shown here.">Users</H1>
      {sp.deleted && <p className="mb-4 rounded-lg bg-good-bg px-4 py-2 text-sm font-medium text-good-text">User deleted, with their saved checks.</p>}
      {sp.error === "confirm" && <p className="mb-4 rounded-lg bg-act-bg px-4 py-2 text-sm font-medium text-act-text">Not deleted: type the user&apos;s email exactly to confirm.</p>}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><p className="text-sm font-medium text-muted">Registered users</p><p className="font-display text-3xl font-semibold">{totals[0].toLocaleString("en-NG")}</p></Card>
        <Card><p className="text-sm font-medium text-muted">New this week</p><p className="font-display text-3xl font-semibold">{totals[1].toLocaleString("en-NG")}</p></Card>
      </div>

      <form className="mb-4 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Search by email, name or phone" className={aInput} aria-label="Search users" />
        <SubmitButton className={aBtnQuiet}>Search</SubmitButton>
        {q && <Link href="/admin/users" className={`${aBtnQuiet} inline-flex items-center`}>Clear</Link>}
      </form>

      {users.length === 0 ? (
        <Card><p className="text-sm text-muted">{q ? "No users match that search." : "No one has registered yet."}</p></Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((u) => {
            const c = checkCount.get(u.id);
            const seen = lastSeen.get(u.id);
            return (
              <li key={u.id}>
                <details open={open === u.id} className="group rounded-xl border border-line bg-surface">
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary uppercase">
                      {(u.full_name || u.email).slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{u.full_name || u.email}</span>
                      <span className="block truncate text-sm text-muted">{u.full_name ? u.email : "No name yet"}{u.phone ? ` · ${u.phone}` : ""}</span>
                    </span>
                    <span className="hidden shrink-0 flex-col items-end text-xs text-subtle sm:flex">
                      <span>Joined {fmt.format(new Date(u.created_at))}</span>
                      <span>{c ? `${c.n} check${c.n === 1 ? "" : "s"}` : "No checks"} · {paidCount.get(u.id) ?? 0} paid consult{paidCount.get(u.id) === 1 ? "" : "s"}</span>
                    </span>
                    {u.role !== "user" && <Badge tone="warn">{u.role}</Badge>}
                    <Icon name="arrowRight" size={16} strokeWidth={2} className="shrink-0 text-subtle transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="border-t border-line p-4">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-4">
                      <div><dt className="text-subtle">Joined</dt><dd className="font-medium">{fmt.format(new Date(u.created_at))}</dd></div>
                      <div><dt className="text-subtle">Last logged in</dt><dd className="font-medium">{seen ? fmt.format(new Date(seen)) : "Never"}</dd></div>
                      <div><dt className="text-subtle">Saved checks</dt><dd className="font-medium">{c?.n ?? 0}{c?.last ? ` · last ${fmt.format(new Date(c.last))}` : ""}</dd></div>
                      <div><dt className="text-subtle">Paid consults</dt><dd className="font-medium">{paidCount.get(u.id) ?? 0}</dd></div>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={`mailto:${u.email}`} className={`${aBtnQuiet} inline-flex items-center gap-1.5`}><Icon name="chat" size={16} strokeWidth={2} /> Email</a>
                      {u.phone && <a href={`tel:${u.phone}`} className={`${aBtnQuiet} inline-flex items-center gap-1.5`}><Icon name="phone" size={16} strokeWidth={2} /> Call</a>}
                      <Link href={`/admin/bookings?q=${encodeURIComponent(u.email)}`} className={`${aBtnQuiet} inline-flex items-center gap-1.5`}><Icon name="stethoscope" size={16} strokeWidth={2} /> Bookings</Link>
                    </div>
                    <form action={deleteUser} className="mt-5 rounded-lg border border-act-text/20 bg-act-bg p-3">
                      <input type="hidden" name="id" value={u.id} />
                      <p className="text-sm font-semibold text-act-text">Delete this user</p>
                      <p className="mt-0.5 text-xs text-act-text/80">Removes their account and saved checks. Paid booking records are kept for accounting, without the account link. This can&apos;t be undone.</p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input name="confirm" placeholder={`Type ${u.email} to confirm`} className={aInput} aria-label="Type the email to confirm" autoComplete="off" />
                        <SubmitButton className="min-h-[40px] shrink-0 rounded-lg bg-act-text px-4 text-sm font-semibold whitespace-nowrap text-white hover:opacity-90">Delete user</SubmitButton>
                      </div>
                    </form>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pages">
          {page > 1 ? <Link href={link(page - 1)} className={aBtnQuiet + " inline-flex items-center"}>← Newer</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={link(page + 1)} className={aBtnQuiet + " inline-flex items-center"}>Older →</Link> : <span />}
        </nav>
      )}
    </>
  );
}
