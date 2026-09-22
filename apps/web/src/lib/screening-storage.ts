import type { AssessRequest, AssessResponse } from "@/lib/ml/types";

// Anonymous-first flow: the questionnaire result lives in sessionStorage,
// not the database, until the user chooses to save it (see
// supabase/migrations/0001_init.sql's data-minimization note). This also
// lets the results page survive a login/signup round-trip: come back to
// /screening/results after signing in and the "Save" button still works.

const KEY = "pcos:lastAssessment";

export interface StoredAssessment {
  answers: AssessRequest;
  result: AssessResponse;
  savedAssessmentId?: string;
  comparisonAnchor?: boolean;
}

export function saveLastAssessment(data: StoredAssessment) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // sessionStorage can throw in private-browsing edge cases; the result
    // still rendered on this page load, so this is a soft failure.
  }
}

export function readLastAssessment(): StoredAssessment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredAssessment) : null;
  } catch {
    return null;
  }
}

export function markSaved(assessmentId: string) {
  const current = readLastAssessment();
  if (!current) return;
  saveLastAssessment({ ...current, savedAssessmentId: assessmentId });
}

/**
 * Ultrasound result, kept in this browser session only.
 *
 * Deliberately stores ONLY the model output and metadata — never the image
 * itself, and nothing that identifies the person. The result page reads this
 * to show which modalities were available.
 */
const ULTRASOUND_KEY = "pcos:lastUltrasound";

export interface StoredUltrasound {
  probability: number;
  prediction: string;
  model: string;
  at: string;
}

export function saveUltrasoundResult(data: StoredUltrasound) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ULTRASOUND_KEY, JSON.stringify(data));
  } catch {
    // Non-fatal: the result still rendered on the ultrasound page.
  }
}

export function readUltrasoundResult(): StoredUltrasound | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ULTRASOUND_KEY);
    return raw ? (JSON.parse(raw) as StoredUltrasound) : null;
  } catch {
    return null;
  }
}

export function clearUltrasoundResult() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ULTRASOUND_KEY);
  } catch {
    // ignore
  }
}
