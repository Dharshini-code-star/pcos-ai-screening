import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AssessRequest, RiskBand, ShapContribution } from "@/lib/ml/types";
import type { ClinicalData } from "@/lib/clinical";

export interface HistoryEntry {
  id: string;
  createdAt: string;
  answers: AssessRequest;
  bmi: number | null;
  /** Optional user-entered lab values — report context only, never modelled. */
  clinical: ClinicalData;
  result: {
    id: string;
    modelVersion: string;
    riskProbability: number;
    riskBand: RiskBand;
    confidenceScore: number;
    isInsufficientData: boolean;
    shapValues: ShapContribution[];
  } | null;
}

export async function getHistory(): Promise<{ user: { id: string; email?: string } | null; entries: HistoryEntry[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, entries: [] };

  const { data, error } = await supabase
    .from("assessments")
    .select(
      "id, created_at, raw_answers, derived_features, clinical_data, risk_results(id, model_version, risk_probability, risk_band, confidence_score, is_insufficient_data, shap_values, created_at)"
    )
    .eq("user_id", user.id)
    .eq("is_simulation", false)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("getHistory failed", error);
    return { user: { id: user.id, email: user.email }, entries: [] };
  }

  const entries: HistoryEntry[] = data.map((row) => {
    const rr = Array.isArray(row.risk_results) ? row.risk_results[0] : row.risk_results;
    const derived = row.derived_features as { bmi?: number } | null;
    return {
      id: row.id,
      createdAt: row.created_at,
      answers: row.raw_answers as unknown as AssessRequest,
      bmi: derived?.bmi ?? null,
      clinical: (row.clinical_data as unknown as ClinicalData) ?? {},
      result: rr
        ? {
            id: rr.id,
            modelVersion: rr.model_version,
            riskProbability: rr.risk_probability,
            riskBand: rr.risk_band as RiskBand,
            confidenceScore: rr.confidence_score,
            isInsufficientData: rr.is_insufficient_data,
            shapValues: rr.shap_values as unknown as ShapContribution[],
          }
        : null,
    };
  });

  return { user: { id: user.id, email: user.email }, entries };
}
