/** Choices people pick from when building a plan (shared by the builder and the server). */
export const MOVE_CUES = ["In the morning, before work", "At lunchtime", "After work", "In the evening, after dinner"] as const;
export const MOVE_ACTIVITIES = ["Brisk walking", "Dancing or aerobics", "Jogging", "Football or another sport", "Skipping"] as const;
export const CALM_CUES = ["After I wake up", "At lunchtime", "Before bed"] as const;
/** Wake times from 4:30am to 9am, every 15 minutes, as "HH:MM". */
export const WAKE_TIMES = Array.from({ length: 19 }, (_, i) => {
  const m = 270 + i * 15;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
export const AREA_INFO = {
  move: { title: "Move more", icon: "run", blurb: "Build up to 150 minutes a week, one small step at a time." },
  sleep: { title: "Sleep better", icon: "moon", blurb: "A steady sleep routine, one habit at a time." },
  weight: { title: "Lose weight", icon: "scale", blurb: "A safe 5% loss at about half a kilo a week." },
  eat: { title: "Eat better", icon: "veg", blurb: "Simple food swaps that suit Nigerian meals." },
  calm: { title: "Feel calmer", icon: "mind", blurb: "A short daily practice to lift your wellbeing." },
} as const;
/** People focus better on a few changes at once. */
export const MAX_AREAS = 3;
