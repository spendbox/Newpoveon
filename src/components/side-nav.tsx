"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { PoveonMark } from "@/components/poveon-mark";

export type NavGroup = { title: string; items: [href: string, label: string, icon: IconName][] };

/**
 * App menu: a sidebar on large screens, a hamburger with a slide-in drawer on phones.
 * Used by the admin area and by the signed-in dashboard.
 */
export function SideNav({ email, appName, badge, home, groups, logoutAction, logoutLabel = "Log out" }: {
  email: string; appName: string; badge?: string; home: string; groups: NavGroup[]; logoutAction: string; logoutLabel?: string;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the drawer after navigating
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) => (href === home ? path === home : path.startsWith(href));
  const menu = (
    <nav aria-label="Menu" className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.title || "main"}>
          {g.title && <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.08em] text-subtle uppercase">{g.title}</p>}
          <ul className="flex flex-col gap-0.5">
            {g.items.map(([href, label, icon]) => (
              <li key={href}>
                <Link href={href} aria-current={isActive(href) ? "page" : undefined}
                  className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-[15px] font-semibold transition-colors ${isActive(href) ? "bg-primary-soft text-primary" : "text-ink/80 hover:bg-ground"}`}>
                  <Icon name={icon} size={18} strokeWidth={2} />{label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
  const footer = (
    <div className="border-t border-line pt-4">
      <p className="truncate px-3 text-xs text-subtle">{email}</p>
      <form action={logoutAction} method="post" className="mt-2">
        <button className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-[15px] font-semibold text-ink/80 hover:bg-ground">
          <Icon name="arrowLeft" size={18} strokeWidth={2} /> {logoutLabel}
        </button>
      </form>
    </div>
  );
  const brand = (
    <Link href={home} className="flex items-center gap-2">
      <PoveonMark size={28} />
      <span className="font-display text-lg font-bold">{appName}</span>
      {badge && <span className="rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">{badge}</span>}
    </Link>
  );

  return (
    <>
      {/* Phone top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur md:hidden">
        {brand}
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="side-drawer"
          className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-ground">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </header>

      {/* Phone drawer */}
      <div className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <aside id="side-drawer" role="dialog" aria-modal="true" aria-label="Menu"
          className={`absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col gap-6 bg-surface p-4 shadow-[var(--shadow-lg)] transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between">
            {brand}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-ground"><Icon name="close" size={18} strokeWidth={2} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">{menu}</div>
          {footer}
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 flex-col gap-6 border-r border-line bg-surface p-4 md:flex">
        <div className="px-1 pt-1">{brand}</div>
        <div className="flex-1 overflow-y-auto">{menu}</div>
        {footer}
      </aside>
    </>
  );
}
