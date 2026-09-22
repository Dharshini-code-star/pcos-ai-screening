// Mirrors services/ml/app/feature_schema.json — the questionnaire the user
// fills out. Kept as a hand-written TS source of truth on this side (small
// hackathon scope) rather than fetched at runtime, so the form renders even
// if the ML service is briefly unreachable.

export type QuestionType = "number" | "boolean";

export interface Question {
  name: string;
  label: string;
  help?: string;
  type: QuestionType;
  required: boolean;
  unit?: string;
  min?: number;
  max?: number;
  /** For boolean questions: what "true" and "false" mean in the UI. */
  trueLabel?: string;
  falseLabel?: string;
}

export interface QuestionnaireStep {
  title: string;
  description?: string;
  questions: Question[];
}

export const QUESTIONNAIRE_STEPS: QuestionnaireStep[] = [
  {
    title: "About you",
    description: "These three are used to calculate your BMI and are required.",
    questions: [
      { name: "age", label: "Age", type: "number", unit: "years", min: 15, max: 55, required: true },
      { name: "height_cm", label: "Height", type: "number", unit: "cm", min: 120, max: 210, required: true },
      { name: "weight_kg", label: "Weight", type: "number", unit: "kg", min: 30, max: 150, required: true },
    ],
  },
  {
    title: "Menstrual cycle",
    questions: [
      {
        name: "cycle_regularity",
        label: "Is your menstrual cycle regular?",
        help: "Regular means your period arrives roughly the same number of days apart, cycle after cycle.",
        type: "boolean",
        trueLabel: "Irregular",
        falseLabel: "Regular",
        required: true,
      },
      {
        name: "period_duration_days",
        label: "How many days does your period usually last?",
        help: "Bleeding duration, not the gap between periods.",
        type: "number",
        unit: "days",
        min: 1,
        max: 12,
        required: false,
      },
    ],
  },
  {
    title: "Symptoms",
    description: "Skip any you're unsure about — leaving them blank is fine and won't count against you as a \"no\".",
    questions: [
      { name: "weight_gain", label: "Recent unexplained weight gain", type: "boolean", trueLabel: "Yes", falseLabel: "No", required: false },
      { name: "hair_growth", label: "Excess hair growth (face, chest, or back)", type: "boolean", trueLabel: "Yes", falseLabel: "No", required: false },
      { name: "skin_darkening", label: "Skin darkening (neck, underarms, or groin)", type: "boolean", trueLabel: "Yes", falseLabel: "No", required: false },
      { name: "hair_loss", label: "Hair thinning or hair loss", type: "boolean", trueLabel: "Yes", falseLabel: "No", required: false },
      { name: "pimples", label: "Persistent acne or pimples", type: "boolean", trueLabel: "Yes", falseLabel: "No", required: false },
    ],
  },
  {
    title: "Lifestyle",
    questions: [
      { name: "fast_food", label: "Do you eat fast food frequently?", type: "boolean", trueLabel: "Yes", falseLabel: "No", required: false },
      { name: "regular_exercise", label: "Do you exercise regularly?", type: "boolean", trueLabel: "Yes", falseLabel: "No", required: false },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = QUESTIONNAIRE_STEPS.flatMap((s) => s.questions);

export const REQUIRED_FIELDS = ALL_QUESTIONS.filter((q) => q.required).map((q) => q.name);
