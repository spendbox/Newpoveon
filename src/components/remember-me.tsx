"use client";
import { useEffect } from "react";
import { rememberMe } from "@/lib/storage";

/** Signed-in pages: remember this email on the device, so login and forms fill it in next time. */
export function RememberMe({ email }: { email: string }) {
  useEffect(() => {
    if (email) rememberMe({ email, hasAccount: true });
  }, [email]);
  return null;
}
