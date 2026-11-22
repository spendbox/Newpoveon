"use client";
/**
 * Answers are saved in the browser as people go, so a refresh doesn't lose progress.
 * Nothing here ever goes into a URL.
 */
import type { Answers } from "./questions";

const KEY = "hc.progress.v1";
const SAVED_KEY = "hc.saved.v1";

export interface Progress {
  answers: Answers;
  currentId: string | null;
  startedAt: string;
  finished: boolean;
}

function safeGet<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function safeSet(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or storage full: the check still works, it just won't survive a refresh */
  }
}

export const loadProgress = () => safeGet<Progress>(KEY);
export const saveProgress = (p: Progress) => safeSet(KEY, p);
export function clearProgress() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}

/** After results are saved: the server id and a private owner token (to manage the share link). */
export interface SavedScreening {
  screeningId: string;
  ownerToken: string;
  email: string;
  phone?: string;
  name?: string;
  savedAt: string;
  /** The check has been paid for (results unlocked). */
  paid?: boolean;
  /** An account was created for this email when they paid. */
  accountNew?: boolean;
}
export const loadSaved = () => safeGet<SavedScreening>(SAVED_KEY);
export const saveSaved = (s: SavedScreening) => safeSet(SAVED_KEY, s);
export function clearSaved() {
  try {
    window.localStorage.removeItem(SAVED_KEY);
  } catch {}
}

/** Contact details to pre-fill on the results step (set when a signed-in person retakes the check). */
const PREFILL_KEY = "hc.prefill.v1";
export const loadPrefill = () => safeGet<{ email: string; phone?: string }>(PREFILL_KEY);
export const savePrefill = (p: { email: string; phone?: string }) => safeSet(PREFILL_KEY, p);
