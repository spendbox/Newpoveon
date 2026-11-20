import type { BodyArea } from "./learn";

/** Where each body area sits on the figure (viewBox 0 0 300 560). Front view: the person's left is on the right. */
export const AREA_POINTS: Record<BodyArea, { x: number; y: number; label: string }> = {
  mind: { x: 150, y: 46, label: "Mind" },
  sleep: { x: 150, y: 102, label: "Sleep and breathing" },
  lungs: { x: 134, y: 168, label: "Lungs" },
  heart: { x: 163, y: 176, label: "Heart" },
  bp: { x: 92, y: 196, label: "Blood pressure" },
  liver: { x: 136, y: 220, label: "Liver" },
  sugar: { x: 163, y: 236, label: "Blood sugar" },
  waist: { x: 150, y: 266, label: "Weight and waist" },
  legs: { x: 172, y: 436, label: "Movement" },
};

