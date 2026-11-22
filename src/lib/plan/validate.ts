import { CALM_PRACTICES, EAT_SWAPS, weightTarget, type Area, type Goal } from "./engine";
import { CALM_CUES, MAX_AREAS, MOVE_ACTIVITIES, MOVE_CUES, WAKE_TIMES } from "./options";

/** Checks plan goals sent from the browser and rebuilds them from known choices only. Returns null if anything is off. */
export function cleanGoals(input: unknown): Goal[] | null {
  if (!Array.isArray(input) || input.length < 1 || input.length > MAX_AREAS) return null;
  const seen = new Set<Area>();
  const out: Goal[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const { area, settings } = raw as { area: Area; settings: Record<string, unknown> };
    if (seen.has(area) || !settings || typeof settings !== "object") return null;
    seen.add(area);
    const int = (v: unknown, lo: number, hi: number) => (Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi ? (v as number) : null);
    switch (area) {
      case "move": {
        const cue = MOVE_CUES.find((c) => c === settings.cue), activity = MOVE_ACTIVITIES.find((a) => a === settings.activity), startLevel = int(settings.startLevel, 0, 7);
        if (!cue || !activity || startLevel === null) return null;
        out.push({ area, settings: { cue, activity, startLevel } });
        break;
      }
      case "sleep": {
        const wake = WAKE_TIMES.find((w) => w === settings.wake), startLevel = int(settings.startLevel, 0, 4);
        if (!wake || startLevel === null) return null;
        out.push({ area, settings: { wake, startLevel } });
        break;
      }
      case "weight": {
        const kg = Number(settings.startKg), weighDay = int(settings.weighDay, 0, 6), moveStart = settings.moveStart === undefined ? 0 : int(settings.moveStart, 0, 6);
        if (!Number.isFinite(kg) || kg < 30 || kg > 250 || weighDay === null || moveStart === null) return null;
        const startKg = Math.round(kg * 10) / 10;
        out.push({ area, settings: { startKg, targetKg: weightTarget(startKg), weighDay, moveStart } });
        break;
      }
      case "eat": {
        const swaps = Array.isArray(settings.swaps) ? [...new Set(settings.swaps.filter((s): s is string => typeof s === "string" && s in EAT_SWAPS))] : [];
        if (!swaps.length) return null;
        out.push({ area, settings: { swaps } });
        break;
      }
      case "calm": {
        const practice = typeof settings.practice === "string" && settings.practice in CALM_PRACTICES ? settings.practice : null, cue = CALM_CUES.find((c) => c === settings.cue);
        if (!practice || !cue) return null;
        out.push({ area, settings: { practice, cue } });
        break;
      }
      default:
        return null;
    }
  }
  return out;
}
