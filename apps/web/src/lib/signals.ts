import type { AssessRequest } from "@/lib/ml/types";

/**
 * The Early Signal Profile: groups the questionnaire answers into four
 * screening-signal categories.
 *
 * These are SCREENING SIGNALS, never diagnoses. Nothing here may be phrased
 * as a condition the user "has" (no "hormonal imbalance", no "insulin
 * resistance", no "PCOS"). Every level label below is deliberately about the
 * signal, not the person.
 *
 * This is derived on the client from answers the user already gave — it does
 * not add any new model, scoring, or backend call.
 */

export type SignalLevel = "elevated" | "pattern" | "emerging" | "none" | "insufficient";

export const SIGNAL_LEVEL_LABEL: Record<SignalLevel, string> = {
  elevated: "Elevated screening signal",
  pattern: "Pattern detected",
  emerging: "Emerging signal",
  none: "No strong signal detected",
  insufficient: "Insufficient information",
};

export interface SignalCategory {
  key: string;
  title: string;
  level: SignalLevel;
  /** Human-readable inputs that fed this category, with what was answered. */
  inputs: { label: string; value: string; notable: boolean }[];
  explanation: string;
}

function level(positives: number, answered: number, thresholds = [1, 2, 3]): SignalLevel {
  if (answered === 0) return "insufficient";
  if (positives >= thresholds[2]) return "elevated";
  if (positives >= thresholds[1]) return "pattern";
  if (positives >= thresholds[0]) return "emerging";
  return "none";
}

function yesNo(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return "Not answered";
  return v ? "Yes" : "No";
}

export function buildSignalProfile(a: AssessRequest): SignalCategory[] {
  const bmi = a.weight_kg / (a.height_cm / 100) ** 2;

  // 1. Reproductive pattern — cycle regularity is the strongest single input.
  const irregular = a.cycle_regularity === true;
  const duration = a.period_duration_days ?? null;
  const atypicalDuration = duration !== null && (duration < 2 || duration > 7);
  const reproductive: SignalCategory = {
    key: "reproductive",
    title: "Reproductive Pattern",
    level: irregular
      ? atypicalDuration
        ? "elevated"
        : "pattern"
      : atypicalDuration
        ? "emerging"
        : "none",
    inputs: [
      {
        label: "Menstrual cycle",
        value: a.cycle_regularity ? "Irregular" : "Regular",
        notable: irregular,
      },
      {
        label: "Period duration",
        value: duration === null ? "Not answered" : `${duration} days`,
        notable: atypicalDuration,
      },
    ],
    explanation: irregular
      ? "Irregular cycles are one of the patterns screening tools look at. On its own it has many possible explanations."
      : "Your reported cycle pattern is in the typical range for this screening.",
  };

  // 2. Androgen-related signals — self-reported skin/hair changes only.
  const androgenInputs = [
    { label: "Excess hair growth", raw: a.hair_growth },
    { label: "Persistent acne", raw: a.pimples },
    { label: "Hair thinning or loss", raw: a.hair_loss },
  ];
  const androgenAnswered = androgenInputs.filter((i) => i.raw !== null && i.raw !== undefined).length;
  const androgenPositive = androgenInputs.filter((i) => i.raw === true).length;
  const androgen: SignalCategory = {
    key: "androgen",
    title: "Androgen-Related Signals",
    level: level(androgenPositive, androgenAnswered),
    inputs: androgenInputs.map((i) => ({
      label: i.label,
      value: yesNo(i.raw),
      notable: i.raw === true,
    })),
    explanation:
      androgenAnswered === 0
        ? "You didn't answer these questions, so this category couldn't be assessed."
        : "These are self-reported skin and hair changes that screening tools group together. They are not a hormone measurement.",
  };

  // 3. Metabolic pattern — BMI plus two self-reported inputs. Deliberately
  // never described as insulin resistance or a metabolic condition.
  const metabolicPositive =
    (bmi >= 25 ? 1 : 0) + (a.weight_gain === true ? 1 : 0) + (a.skin_darkening === true ? 1 : 0);
  const metabolicAnswered =
    1 + [a.weight_gain, a.skin_darkening].filter((v) => v !== null && v !== undefined).length;
  const metabolic: SignalCategory = {
    key: "metabolic",
    title: "Metabolic Pattern",
    level: level(metabolicPositive, metabolicAnswered),
    inputs: [
      { label: "BMI (calculated)", value: bmi.toFixed(1), notable: bmi >= 25 },
      { label: "Recent unexplained weight gain", value: yesNo(a.weight_gain), notable: a.weight_gain === true },
      { label: "Skin darkening", value: yesNo(a.skin_darkening), notable: a.skin_darkening === true },
    ],
    explanation:
      "These inputs are grouped because screening guidance looks at them together. They do not measure blood sugar or hormones.",
  };

  // 4. Lifestyle / behavioural.
  const lifestyleAnswered = [a.fast_food, a.regular_exercise].filter(
    (v) => v !== null && v !== undefined
  ).length;
  const lifestylePositive = (a.fast_food === true ? 1 : 0) + (a.regular_exercise === false ? 1 : 0);
  const lifestyle: SignalCategory = {
    key: "lifestyle",
    title: "Lifestyle / Behavioural Pattern",
    level: level(lifestylePositive, lifestyleAnswered, [1, 2, 99]),
    inputs: [
      { label: "Frequent fast food", value: yesNo(a.fast_food), notable: a.fast_food === true },
      { label: "Regular exercise", value: yesNo(a.regular_exercise), notable: a.regular_exercise === false },
    ],
    explanation:
      lifestyleAnswered === 0
        ? "You didn't answer these questions, so this category couldn't be assessed."
        : "Everyday habits are part of the screening picture and are the inputs most within your control.",
  };

  return [reproductive, androgen, metabolic, lifestyle];
}

/** Data-confidence banding (§6) — about information available, not certainty. */
export type ConfidenceLevel = "high" | "moderate" | "limited";

export function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "moderate";
  return "limited";
}

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "High information",
  moderate: "Moderate information",
  limited: "Limited information",
};

/** The 0-100 screening signal — a rescaled model output, never a probability of having PCOS. */
export function screeningSignal(riskProbability: number): number {
  return Math.round(riskProbability * 100);
}

export type SignalBand = "low" | "moderate" | "elevated";

export const SIGNAL_BAND_LABEL: Record<SignalBand, string> = {
  low: "Low screening signal",
  moderate: "Emerging screening signal",
  elevated: "Elevated screening signal",
};

/** §8 — a decision-oriented next step. Never prescriptive, never a diagnosis. */
export const NEXT_BEST_STEP: Record<SignalBand, string> = {
  low: "Continue routine health tracking and reassess if your menstrual or metabolic patterns change.",
  moderate:
    "Consider tracking your menstrual pattern and symptoms over time. If concerns persist, discuss them with a healthcare professional.",
  elevated:
    "Consider discussing your symptoms and screening result with a qualified healthcare professional.",
};
