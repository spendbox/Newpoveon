"use client";
import Link, { useLinkStatus } from "next/link";
import { useEffect, useState } from "react";

/** Spinner + text while the next page loads, so a tap always feels answered. */
function Label({ text }: { text: string }) {
  const { pending } = useLinkStatus();
  return (
    <>
      {pending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      <span>{pending ? "Opening…" : text}</span>
    </>
  );
}

/**
 * "Log in", or "My dashboard" when this browser already has a login session.
 * (The Supabase session cookie is readable here; the server still checks it properly.)
 */
export function AccountLink({ className = "" }: { className?: string }) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the cookie after mount
    setSignedIn(/(?:^|; )sb-[^=]+-auth-token(?:\.0)?=/.test(document.cookie));
  }, []);
  return (
    <Link href="/account" className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-[15px] font-medium transition-transform hover:border-line-strong active:scale-95 ${className}`}>
      <Label text={signedIn ? "My dashboard" : "Log in"} />
    </Link>
  );
}
