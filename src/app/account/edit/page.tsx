export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";
import type { Answers } from "@/lib/questions";
import { currentUser, supabaseConfigured, supabaseUser } from "@/lib/supabase/server";
import { EditAnswers } from "./edit-answers";

export const metadata: Metadata = { title: "Update my answers", robots: { index: false } };

export default async function EditPage() {
  if (!supabaseConfigured()) redirect("/account");
  const user = await currentUser();
  if (!user) redirect("/login?next=/account/edit");
  const sb = await supabaseUser();
  const { data: profile } = await sb.from("profiles").select("latest_answers").eq("id", user.id).single();
  let answers = (profile?.latest_answers ?? null) as Answers | null;
  if (!answers) {
    const { data } = await sb.from("screenings").select("answers").order("created_at", { ascending: false }).limit(1).maybeSingle();
    answers = (data?.answers ?? {}) as Answers;
  }
  return (
    <main className="mx-auto w-full max-w-[430px] px-6 pt-7 md:max-w-2xl">
      <Logo />
      <h1 className="mt-6 text-[30px] leading-[1.05]">Update my answers</h1>
      <p className="mt-1 text-muted">Change anything that&apos;s different now, like your weight, smoking or a new blood pressure reading. Your scores will be recalculated and added to your history.</p>
      <EditAnswers initial={answers} />
    </main>
  );
}
