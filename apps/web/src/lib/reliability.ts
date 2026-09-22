import type { AssessResponse } from "@/lib/ml/types";
import { CONFIDENCE_LABEL, confidenceLevel, type ConfidenceLevel } from "@/lib/signals";

/**
 * Feature 2 — the AI reliability / trust layer.
 *
 * Deliberately NOT "the AI is 95% reliable". There is no arbitrary
 * reliability percentage anywhere in here. What this models instead is:
 * which information was actually available, what is missing, and how
 * cautiously the result should therefore be read.
 *
 * Model confidence is never equated with medical certainty — the copy says
 * so explicitly wherever a level is shown.
 */

export type Modality = "clinical" | "ultrasound";

export interface ModalityStatus {
  key: Modality;
  label: string;
  available: boolean;
  detail: string;
}

export type InformationLevel = ConfidenceLevel; // high | moderate | limited

export interface ReliabilityAssessment {
  level: InformationLevel;
  levelLabel: string;
  /** Plain-language reasons the system assigned this level. */
  reasons: string[];
  modalities: ModalityStatus[];
  /** What the model output means, and what it cannot tell you. */
  knows: string[];
  cannotTell: string[];
  nextStep: string;
  cautious: boolean;
}

export interface ReliabilityInput {
  clinical: AssessResponse | null;
  /** Ultrasound model probability, when an ultrasound screening was run. */
  ultrasoundProbability?: number | null;
  /** Missing optional questionnaire fields, from the clinical response. */
  missingFields?: string[];
}

export function buildReliability({
  clinical,
  ultrasoundProbability = null,
  missingFields = [],
}: ReliabilityInput): ReliabilityAssessment {
  const hasClinical = !!clinical;
  const hasUltrasound = ultrasoundProbability !== null && ultrasoundProbability !== undefined;

  const modalities: ModalityStatus[] = [
    {
      key: "clinical",
      label: "Clinical information",
      available: hasClinical,
      detail: hasClinical
        ? "Your questionnaire answers were available to the screening model."
        : "No questionnaire answers were available.",
    },
    {
      key: "ultrasound",
      label: "Ultrasound",
      available: hasUltrasound,
      detail: hasUltrasound
        ? "An ultrasound image was analysed by the image model."
        : "Ultrasound information was not available. This is expected — ultrasound is optional and not required for screening.",
    },
  ];

  const reasons: string[] = [];

  // Base level comes from the clinical model's own data-confidence score,
  // which already reflects answer completeness and how typical the answers
  // were. Modality availability then adjusts it.
  let level: InformationLevel = clinical ? confidenceLevel(clinical.confidence_score) : "limited";

  if (!hasClinical) {
    reasons.push("No screening answers were available, so the model had nothing to work from.");
  } else {
    reasons.push(
      hasUltrasound
        ? "Your result is based on clinical information and an ultrasound image."
        : "Your result is based on clinical information only."
    );

    if (!hasUltrasound) {
      reasons.push("Ultrasound information was not available.");
    }

    if (missingFields.length > 0) {
      reasons.push(
        `Some relevant inputs are missing (${missingFields.length} optional question${missingFields.length > 1 ? "s" : ""} left blank).`
      );
      // Missing inputs cap the level at moderate — we should not claim high
      // information when the user skipped questions.
      if (level === "high") level = "moderate";
    }

    if (clinical?.is_insufficient_data) {
      level = "limited";
      reasons.push("There was not enough information for a reliable screening signal.");
    }
  }

  const knows: string[] = [];
  if (hasClinical) {
    knows.push("The answers you gave about your cycle, symptoms, and lifestyle.");
    knows.push("How those answers compare to patterns in the model's training data.");
  }
  if (hasUltrasound) {
    knows.push("Visual patterns an image model detected in the ultrasound you uploaded.");
  }

  const cannotTell: string[] = [
    "Whether you have PCOS — that requires clinical evaluation against the Rotterdam criteria.",
    "Whether another condition explains your symptoms. Other causes have to be ruled out by a clinician.",
    "Anything about hormone levels or ovaries that you did not provide.",
  ];
  if (!hasUltrasound) {
    cannotTell.push("Anything visible on an ultrasound, since no image was analysed.");
  }

  const cautious = level === "limited" || !!clinical?.is_insufficient_data;

  const nextStep = cautious
    ? "Read this result cautiously. Answering more questions would give a stronger screening assessment, and a healthcare professional can evaluate what a screening tool cannot."
    : hasUltrasound
      ? "Bring both results to a healthcare professional — they can interpret them alongside an examination and any tests."
      : "Discuss this result with a healthcare professional, who can decide whether further evaluation such as bloodwork or an ultrasound is appropriate.";

  return {
    level,
    levelLabel: CONFIDENCE_LABEL[level],
    reasons,
    modalities,
    knows,
    cannotTell,
    nextStep,
    cautious,
  };
}

export const CONFIDENCE_NOT_CERTAINTY =
  "Model confidence is not the same as medical certainty.";
