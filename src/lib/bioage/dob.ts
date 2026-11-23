/**
 * Where to get a person's date of birth for the biological age form.
 * Health checks store it as "dob" (YYYY-MM-DD). Checks saved before we asked for a date of birth only
 * have the age they typed; then we estimate the birthday as half-way through that year of age, and the
 * form says so, because a whole year either way changes the result.
 */
export type DobGuess = { dob: string; source: "exact" | "estimated"; from: string };

export function dobFromAnswers(answers: unknown, savedAt: string): DobGuess | null {
  if (!answers || typeof answers !== "object") return null;
  const a = answers as Record<string, unknown>;
  if (typeof a.dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(a.dob)) return { dob: a.dob, source: "exact", from: savedAt };
  const age = typeof a.age === "number" ? a.age : typeof a.age === "string" ? Number(a.age) : NaN;
  const saved = new Date(savedAt);
  if (!Number.isFinite(age) || age < 18 || age > 100 || Number.isNaN(saved.getTime())) return null;
  const est = new Date(saved.getTime() - (age + 0.5) * 365.2425 * 864e5);
  return { dob: est.toISOString().slice(0, 10), source: "estimated", from: savedAt };
}
