// Mirrors services/ml/app/schema.py — keep in sync manually (small hackathon
// scope; not worth generating this from the FastAPI OpenAPI schema today).

export interface AssessRequest {
  age: number;
  height_cm: number;
  weight_kg: number;
  /** true = irregular, false = regular */
  cycle_regularity: boolean;
  period_duration_days?: number | null;
  weight_gain?: boolean | null;
  hair_growth?: boolean | null;
  skin_darkening?: boolean | null;
  hair_loss?: boolean | null;
  pimples?: boolean | null;
  fast_food?: boolean | null;
  regular_exercise?: boolean | null;
}

export type RiskBand = "low" | "moderate" | "elevated";
export type ShapDirection = "higher_risk" | "lower_risk";

export interface ShapContribution {
  feature: string;
  label: string;
  value: number | boolean | null;
  is_imputed: boolean;
  contribution: number;
  direction: ShapDirection;
}

export interface AssessResponse {
  model_version: string;
  risk_probability: number;
  risk_band: RiskBand;
  confidence_score: number;
  is_insufficient_data: boolean;
  missing_fields: string[];
  shap_values: ShapContribution[];
  base_value: number;
  disclaimer: string;
}

export interface ModelInfoResponse {
  model_version: string;
  selected_model: string;
  n_training_rows: number;
  class_balance: Record<string, number>;
  held_out_test: {
    auroc: number;
    accuracy: number;
    brier: number;
    confusion_matrix: number[][];
    n_test_rows: number;
  };
  limitations: string;
  feature_columns: string[];
}
