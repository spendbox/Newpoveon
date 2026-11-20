/**
 * The ONE smart questionnaire. Shared questions are asked once and reused by every score.
 * Validated-tool items (PHQ, GAD, AUDIT-C, STOP-Bang, FINDRISC) keep their published wording;
 * only the friendly screen headers around them are ours.
 */
import type { IconName } from "@/components/icons";
import type { IllustrationName } from "@/components/illustrations";

export type BpValue = { sbp: number; dbp: number };
export type AnswerValue = string | number | string[] | BpValue;
export type Answers = Record<string, AnswerValue>;

export type Topic =
  | "About you"
  | "Your body"
  | "Your heart"
  | "Blood sugar"
  | "Moving"
  | "Sleep"
  | "Alcohol"
  | "Mood"
  | "Worry"
  | "Check-ups";

export interface Option {
  value: string;
  label: string;
  icon?: IconName;
}

interface Base {
  id: string;
  topic: Topic;
  title: string;
  help?: string;
  illustration: IllustrationName;
  /** Section gate: when this returns false the question is skipped. */
  showIf?: (a: Answers) => boolean;
}
export interface ChoiceQuestion extends Base {
  kind: "choice";
  options: Option[];
  layout?: "grid" | "rows";
}
export interface MultiQuestion extends Base {
  kind: "multi";
  options: Option[];
  /** Selecting this value clears the others. */
  noneValue?: string;
}
export interface NumberQuestion extends Base {
  kind: "number";
  unit: string;
  min: number;
  max: number;
  placeholder?: string;
  /** Lets people say they don't know (stored as "unknown"). */
  skipLabel?: string;
  /** Height can also be typed in feet and inches. */
  feetInches?: boolean;
}
export interface BpQuestion extends Base {
  kind: "bp";
}
export type Question = ChoiceQuestion | MultiQuestion | NumberQuestion | BpQuestion;

const yesNo: Option[] = [
  { value: "yes", label: "Yes", icon: "thumbUp" },
  { value: "no", label: "No", icon: "thumbDown" },
];
const yesNoUnsure: Option[] = [...yesNo, { value: "unsure", label: "Not sure", icon: "question" }];

/** PHQ / GAD response scale (published wording). */
export const FREQ_OPTIONS: Option[] = [
  { value: "0", label: "Not at all", icon: "sun" },
  { value: "1", label: "Several days", icon: "partCloud" },
  { value: "2", label: "More than half the days", icon: "cloud" },
  { value: "3", label: "Nearly every day", icon: "rain" },
];

export const num = (a: Answers, id: string): number | null => {
  const v = a[id];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
};
export const str = (a: Answers, id: string): string | null => (typeof a[id] === "string" ? (a[id] as string) : null);

const female = (a: Answers) => a.sex === "female";
const phq2Score = (a: Answers) => Number(a.phq1 ?? 0) + Number(a.phq2 ?? 0);
const gad2Score = (a: Answers) => Number(a.gad1 ?? 0) + Number(a.gad2 ?? 0);
const snores = (a: Answers) => a.snore === "yes" || a.snore === "unsure";
const drinks = (a: Answers) => a.drinks === "yes";

const PHQ_STEM = "Over the last 2 weeks, how often have you been bothered by:";
const GAD_STEM = "Over the last 2 weeks, how often have you been bothered by:";

export const QUESTIONS: Question[] = [
  /* ---------------- About you ---------------- */
  { id: "age", topic: "About you", kind: "number", title: "How old are you?", unit: "years", min: 18, max: 100, placeholder: "e.g. 42", illustration: "aboutYou" },
  {
    id: "sex", topic: "About you", kind: "choice", title: "What sex are you?",
    help: "The heart and diabetes formulas we use are different for men and women.", illustration: "aboutYou",
    options: [{ value: "female", label: "Female", icon: "female" }, { value: "male", label: "Male", icon: "male" }],
  },

  /* ---------------- Your body ---------------- */
  { id: "height", topic: "Your body", kind: "number", title: "How tall are you?", unit: "cm", min: 120, max: 220, placeholder: "e.g. 170", feetInches: true, illustration: "scale" },
  { id: "weight", topic: "Your body", kind: "number", title: "How much do you weigh?", unit: "kg", min: 30, max: 250, placeholder: "e.g. 75", help: "A rough number is fine. Your best guess is better than nothing.", illustration: "scale" },
  {
    id: "waist", topic: "Your body", kind: "number", title: "What's your waist size?", unit: "cm", min: 50, max: 200, placeholder: "e.g. 88",
    help: "Measure around your belly, level with your belly button, after breathing out. A tape measure or a piece of string works.",
    skipLabel: "I can't measure it now", illustration: "tape",
  },

  /* ---------------- Your heart ---------------- */
  {
    id: "cvd_history", topic: "Your heart", kind: "choice", title: "Has a doctor ever told you that you had a heart attack or a stroke?",
    illustration: "heartHistory", options: yesNo,
  },
  {
    id: "smoking", topic: "Your heart", kind: "choice", title: "Do you smoke or use tobacco?", help: "Cigarettes, shisha, snuff or chewing tobacco all count.",
    illustration: "lungs",
    options: [
      { value: "never", label: "Never", icon: "leaf" },
      { value: "former", label: "I quit", icon: "trophy" },
      { value: "current", label: "Yes, I do", icon: "smoke" },
    ],
  },
  {
    id: "bp_known", topic: "Your heart", kind: "choice", title: "Do you know your blood pressure numbers?",
    help: "From a check in the last 12 months, for example 120 over 80.", illustration: "bp",
    options: [
      { value: "yes", label: "Yes, I know them", icon: "gauge" },
      { value: "no", label: "No, I don't", icon: "question" },
    ],
    layout: "rows",
  },
  { id: "bp", topic: "Your heart", kind: "bp", title: "What was your last reading?", help: "The top number is systolic, the bottom is diastolic.", illustration: "bp", showIf: (a) => a.bp_known === "yes" },
  {
    id: "told_high_bp", topic: "Your heart", kind: "choice", title: "Do you have, or are you being treated for, high blood pressure?",
    illustration: "bp", options: yesNoUnsure,
  },
  {
    id: "bp_meds", topic: "Your heart", kind: "choice", title: "Have you ever taken medication for high blood pressure on a regular basis?",
    illustration: "bp", options: yesNo,
  },

  /* ---------------- Blood sugar ---------------- */
  {
    id: "diabetes_dx", topic: "Blood sugar", kind: "choice", title: "Has a doctor told you that you have diabetes?",
    illustration: "sugar", options: yesNo,
  },
  {
    id: "high_sugar", topic: "Blood sugar", kind: "choice",
    title: "Have you ever been found to have high blood sugar?",
    help: "For example in a health check, during an illness or during pregnancy.",
    illustration: "sugar", options: yesNo, showIf: (a) => a.diabetes_dx !== "yes",
  },
  {
    id: "family_diabetes", topic: "Blood sugar", kind: "choice", title: "Has anyone in your family had diabetes?",
    illustration: "family", showIf: (a) => a.diabetes_dx !== "yes", layout: "rows",
    options: [
      { value: "none", label: "No", icon: "thumbDown" },
      { value: "second", label: "Yes: grandparent, aunt, uncle or first cousin", icon: "family" },
      { value: "first", label: "Yes: parent, brother, sister or my own child", icon: "family" },
    ],
  },
  {
    id: "veg_daily", topic: "Blood sugar", kind: "choice", title: "How often do you eat vegetables, fruit or berries?",
    illustration: "veg", showIf: (a) => a.diabetes_dx !== "yes",
    options: [
      { value: "yes", label: "Every day", icon: "veg" },
      { value: "no", label: "Not every day", icon: "calendar" },
    ],
  },

  /* ---------------- Moving ---------------- */
  {
    id: "active_daily", topic: "Moving", kind: "choice",
    title: "Do you usually have at least 30 minutes of physical activity every day?",
    help: "At work or in your free time. Walking to the market counts.", illustration: "moving", options: yesNo,
  },
  {
    id: "active_days", topic: "Moving", kind: "choice", title: "In a usual week, on how many days do you move briskly for 30 minutes or more?",
    help: "Brisk means you breathe faster but can still talk.", illustration: "moving",
    options: [
      { value: "0-1", label: "0–1 days", icon: "couch" },
      { value: "2-4", label: "2–4 days", icon: "walk" },
      { value: "5+", label: "5 or more", icon: "run" },
    ],
  },

  /* ---------------- Sleep ---------------- */
  {
    id: "sleep_hours", topic: "Sleep", kind: "choice", title: "How many hours do you usually sleep at night?", illustration: "sleep",
    options: [
      { value: "lt6", label: "Under 6", icon: "moon" },
      { value: "6-7", label: "6 to 7", icon: "moon" },
      { value: "7-9", label: "7 to 9", icon: "moon" },
      { value: "gt9", label: "Over 9", icon: "moon" },
    ],
  },
  {
    id: "snore", topic: "Sleep", kind: "choice", title: "Do you snore loudly?",
    help: "Louder than talking, or loud enough to be heard through a closed door.", illustration: "sleep", options: yesNoUnsure,
  },
  { id: "tired", topic: "Sleep", kind: "choice", title: "Do you often feel tired, fatigued or sleepy during the daytime?", illustration: "sleep", options: yesNo, showIf: snores },
  { id: "observed", topic: "Sleep", kind: "choice", title: "Has anyone seen you stop breathing or choking or gasping during your sleep?", illustration: "sleep", options: yesNoUnsure, showIf: snores },
  {
    id: "neck", topic: "Sleep", kind: "choice", title: "Is your neck size more than 40 cm (about 16 inches)?",
    help: "Measure around your neck, or check your shirt collar size.", illustration: "tape", options: yesNoUnsure, showIf: snores,
  },

  /* ---------------- Alcohol (AUDIT-C) ---------------- */
  { id: "drinks", topic: "Alcohol", kind: "choice", title: "Do you drink alcohol?", help: "Beer, wine, spirits, palm wine or local gin all count.", illustration: "drink", options: yesNo },
  {
    id: "audit1", topic: "Alcohol", kind: "choice", title: "How often do you have a drink containing alcohol?", illustration: "drink", showIf: drinks, layout: "rows",
    options: [
      { value: "1", label: "Monthly or less" },
      { value: "2", label: "2 to 4 times a month" },
      { value: "3", label: "2 to 3 times a week" },
      { value: "4", label: "4 or more times a week" },
    ],
  },
  {
    id: "audit2", topic: "Alcohol", kind: "choice", title: "How many standard drinks containing alcohol do you have on a typical day?",
    help: "One standard drink is about one small bottle or can of beer (330 ml), one glass of wine, or one tot of spirits. A big bottle of beer (600 ml) is about two.",
    illustration: "drink", showIf: drinks, layout: "rows",
    options: [
      { value: "0", label: "1 or 2" },
      { value: "1", label: "3 or 4" },
      { value: "2", label: "5 or 6" },
      { value: "3", label: "7 to 9" },
      { value: "4", label: "10 or more" },
    ],
  },
  {
    id: "audit3", topic: "Alcohol", kind: "choice", title: "How often do you have six or more drinks on one occasion?", illustration: "drink", showIf: drinks, layout: "rows",
    options: [
      { value: "0", label: "Never" },
      { value: "1", label: "Less than monthly" },
      { value: "2", label: "Monthly" },
      { value: "3", label: "Weekly" },
      { value: "4", label: "Daily or almost daily" },
    ],
  },

  /* ---------------- Mood (PHQ-2 → PHQ-9) ---------------- */
  { id: "phq1", topic: "Mood", kind: "choice", title: "Little interest or pleasure in doing things", help: PHQ_STEM, illustration: "mood", options: FREQ_OPTIONS, layout: "rows" },
  { id: "phq2", topic: "Mood", kind: "choice", title: "Feeling down, depressed, or hopeless", help: PHQ_STEM, illustration: "mood", options: FREQ_OPTIONS, layout: "rows" },
  ...(
    [
      ["phq3", "Trouble falling or staying asleep, or sleeping too much"],
      ["phq4", "Feeling tired or having little energy"],
      ["phq5", "Poor appetite or overeating"],
      ["phq6", "Feeling bad about yourself, or that you are a failure or have let yourself or your family down"],
      ["phq7", "Trouble concentrating on things, such as reading the newspaper or watching television"],
      ["phq8", "Moving or speaking so slowly that other people could have noticed. Or the opposite: being so fidgety or restless that you have been moving around a lot more than usual"],
      ["phq9", "Thoughts that you would be better off dead, or of hurting yourself in some way"],
    ] as const
  ).map(([id, title]): Question => ({
    id, topic: "Mood", kind: "choice", title, help: PHQ_STEM, illustration: "mood", options: FREQ_OPTIONS, layout: "rows",
    showIf: (a) => phq2Score(a) >= 3,
  })),

  /* ---------------- Worry (GAD-2 → GAD-7) ---------------- */
  { id: "gad1", topic: "Worry", kind: "choice", title: "Feeling nervous, anxious, or on edge", help: GAD_STEM, illustration: "calm", options: FREQ_OPTIONS, layout: "rows" },
  { id: "gad2", topic: "Worry", kind: "choice", title: "Not being able to stop or control worrying", help: GAD_STEM, illustration: "calm", options: FREQ_OPTIONS, layout: "rows" },
  ...(
    [
      ["gad3", "Worrying too much about different things"],
      ["gad4", "Trouble relaxing"],
      ["gad5", "Being so restless that it is hard to sit still"],
      ["gad6", "Becoming easily annoyed or irritable"],
      ["gad7", "Feeling afraid, as if something awful might happen"],
    ] as const
  ).map(([id, title]): Question => ({
    id, topic: "Worry", kind: "choice", title, help: GAD_STEM, illustration: "calm", options: FREQ_OPTIONS, layout: "rows",
    showIf: (a) => gad2Score(a) >= 3,
  })),

  /* ---------------- Check-ups (prevention checklist) ---------------- */
  {
    id: "checks", topic: "Check-ups", kind: "multi", title: "Which of these have you already had?", help: "Tap all that apply.",
    illustration: "checklist", noneValue: "none",
    options: [
      { value: "bp_year", label: "Blood pressure check in the last year", icon: "gauge" },
      { value: "sugar_3y", label: "Blood sugar test in the last 3 years", icon: "drop" },
      { value: "hepb", label: "Hepatitis B test", icon: "shield" },
      { value: "genotype", label: "I know my genotype", icon: "dna" },
      { value: "none", label: "None of these", icon: "question" },
    ],
  },
  {
    id: "checks_women", topic: "Check-ups", kind: "multi", title: "And which of these women's checks have you had?", help: "Tap all that apply.",
    illustration: "checklist", noneValue: "none", showIf: female,
    options: [
      { value: "cervical", label: "Cervical screening (HPV test, VIA or Pap smear) in the last 5 years", icon: "shield" },
      { value: "mammogram", label: "Mammogram in the last 2 years", icon: "heart" },
      { value: "none", label: "None of these", icon: "question" },
    ],
  },
];

export const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Record<string, Question>;

/** Questions that apply given the current answers, in order. */
export function visibleQuestions(a: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(a));
}

/** Remove answers to questions that are no longer shown (e.g. after a gate answer changed). */
export function pruneAnswers(a: Answers): Answers {
  const visible = new Set(visibleQuestions(a).map((q) => q.id));
  return Object.fromEntries(Object.entries(a).filter(([k]) => visible.has(k)));
}

export function isComplete(a: Answers): boolean {
  return visibleQuestions(a).every((q) => a[q.id] !== undefined);
}

/** Validate a single answer against its question (used on the server too). */
export function isValidAnswer(q: Question, v: unknown): boolean {
  switch (q.kind) {
    case "choice":
      return typeof v === "string" && q.options.some((o) => o.value === v);
    case "multi":
      return Array.isArray(v) && v.length > 0 && v.every((x) => q.options.some((o) => o.value === x));
    case "number":
      return (q.skipLabel && v === "unknown") || (typeof v === "number" && v >= q.min && v <= q.max);
    case "bp": {
      const b = v as BpValue;
      return !!b && typeof b === "object" && typeof b.sbp === "number" && typeof b.dbp === "number" && b.sbp >= 70 && b.sbp <= 260 && b.dbp >= 40 && b.dbp <= 160 && b.sbp > b.dbp;
    }
  }
}

/** Server-side clean-up: keep only valid answers for visible questions. */
export function sanitizeAnswers(input: unknown): Answers {
  if (!input || typeof input !== "object") return {};
  const raw = input as Record<string, unknown>;
  const out: Answers = {};
  for (const q of QUESTIONS) {
    if (raw[q.id] !== undefined && isValidAnswer(q, raw[q.id])) out[q.id] = raw[q.id] as AnswerValue;
  }
  return pruneAnswers(out);
}
