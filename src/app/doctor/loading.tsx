import { Logo } from "@/components/ui";

/** Shown the instant someone taps "Get help", while the booking page loads. */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-5" aria-busy="true">
      <div className="flex h-[72px] items-center"><Logo /></div>
      <div className="flex min-h-[calc(100dvh-72px)] flex-col items-center justify-center pb-24 text-center">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-primary-soft border-t-primary" aria-hidden="true" />
        <p className="mt-5 font-display text-2xl font-semibold" role="status">Getting a doctor ready for you…</p>
        <p className="mt-1 text-muted">This only takes a moment.</p>
      </div>
    </main>
  );
}
