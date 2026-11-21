"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Answers } from "@/lib/questions";
import { savePrefill, saveProgress } from "@/lib/storage";

export function StartRetake({ answers, email, phone }: { answers: Record<string, unknown> | null; email: string; phone?: string | null }) {
  const router = useRouter();
  useEffect(() => {
    // Your last answers are filled in, so you only change what's different.
    saveProgress({ answers: (answers ?? {}) as Answers, currentId: null, startedAt: new Date().toISOString(), finished: false });
    if (email) savePrefill({ email, phone: phone ?? undefined });
    router.replace("/check");
  }, [answers, email, phone, router]);
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center" role="status">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary" aria-hidden="true" />
      <p className="mt-4 font-semibold">Opening your check with your last answers…</p>
    </div>
  );
}
