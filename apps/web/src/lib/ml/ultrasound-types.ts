// Mirrors the FastAPI ultrasound responses in services/ml/app/ultrasound.py.

export interface UltrasoundResult {
  image_probability: number;
  prediction: string;
  model: string;
  model_version: string;
  gradcam_png_base64?: string;
}

export interface UltrasoundInfo {
  available: boolean;
  metadata: {
    model_version?: string;
    architecture?: string;
    dataset?: string;
    held_out_test?: {
      auroc: number;
      accuracy: number;
      brier: number;
      n_test_images: number;
    };
    /** Written by scripts/check_ultrasound_shortcut.py. */
    shortcut_audit?: {
      shortcut_detected: boolean;
      interpretation: string;
      non_anatomical_baseline?: { test_auroc: number; test_accuracy: number };
    };
    limitations?: string;
  } | null;
}

/** Screening-signal framing of the image probability (0-100), never a diagnosis. */
export function ultrasoundSignal(probability: number): number {
  return Math.round(probability * 100);
}
