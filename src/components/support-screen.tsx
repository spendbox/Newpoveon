"use client";
import { useEffect, useState } from "react";
import { FALLBACK_EMERGENCY_CONTACTS, site } from "@/config/site";
import { IllustrationCard } from "./illustrations";
import { Button, ButtonLink } from "./ui";
import { Icon } from "./icons";
import { whatsappLink } from "@/lib/whatsapp";

type Contact = { label: string; phone: string | null; description?: string | null };

/**
 * SAFETY SCREEN. Shown immediately when PHQ-9 question 9 (thoughts of self-harm) is answered with
 * anything other than "Not at all". Calm, no alarms, a doctor now, and emergency contacts.
 * Contacts are admin-editable (Admin → Emergency contacts); only contacts with a real number show.
 */
export function SupportScreen({ onClose }: { onClose: () => void }) {
  const [contacts, setContacts] = useState<Contact[]>([...FALLBACK_EMERGENCY_CONTACTS]);
  useEffect(() => {
    fetch("/api/emergency-contacts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { contacts?: Contact[] } | null) => {
        if (d?.contacts?.length) setContacts(d.contacts);
      })
      .catch(() => {});
  }, []);
  const wa = whatsappLink(`Hello, I'd like to talk to a doctor today, please.`);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="support-title" className="fixed inset-0 z-50 overflow-y-auto bg-ground">
      <div className="mx-auto flex min-h-full w-full max-w-[430px] flex-col px-6 pt-7 pb-10">
        <IllustrationCard name="support" />
        <h2 id="support-title" className="mt-5 text-[27px] leading-[30px]">Thank you for telling us</h2>
        <p className="mt-2 text-[17px] leading-relaxed text-muted">
          It sounds like things have been really hard. You don&apos;t have to go through this alone, and talking to someone can help.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <ButtonLink href="/doctor?reason=support" icon="chat">Talk to a doctor now</ButtonLink>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] border border-line-strong bg-surface px-5 text-base font-semibold">
              <Icon name="whatsapp" size={22} /> Message us on WhatsApp
            </a>
          )}
        </div>
        <h3 className="mt-7 text-xl">If you might act on these thoughts, get help now</h3>
        <ul className="mt-3 flex flex-col gap-2.5">
          {contacts.filter((c) => c.phone).map((c) => (
            <li key={c.label}>
              <a href={`tel:${c.phone}`} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral"><Icon name="phone" size={20} /></span>
                <span>
                  <span className="block font-display text-xl leading-6 font-semibold">{c.phone}</span>
                  <span className="block text-sm font-medium">{c.label}</span>
                  {c.description && <span className="block text-xs font-medium text-subtle">{c.description}</span>}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm font-medium text-subtle">Or go to the nearest hospital emergency department, or ask someone you trust to stay with you.</p>
        <Button variant="secondary" className="mt-7" onClick={onClose}>Continue my {site.appName}</Button>
      </div>
    </div>
  );
}
