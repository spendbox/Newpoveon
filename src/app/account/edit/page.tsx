export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Answers } from "@/lib/questions";
import { currentUser, supabaseConfigured, supabaseUser } from "@/lib/supabase/server";
import { EditAnswers } from "./edit-answers";

export const metadata: Metadata = { title: "My answers", robots: { index: false } };

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
    <div className="max-w-2xl">
      <p className="text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">Account</p>
      <h1 className="mt-1 text-[30px] leading-[1.05] font-bold md:text-4xl">My answers</h1>
      <p className="mt-1 text-muted">Change anything that&apos;s different now, like your weight, smoking or a new blood pressure reading. Your scores will be recalculated and added to your history.</p>
      <EditAnswers initial={answers} />
    </div>
  );
}
