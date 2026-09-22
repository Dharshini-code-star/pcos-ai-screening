import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { DoctorReportPdf } from "@/components/report/doctor-report-pdf";
import { compareEntries } from "@/lib/compare";
import type { HistoryEntry } from "@/lib/history";
import type { ClinicalData } from "@/lib/clinical";
import type { RiskBand, ShapContribution } from "@/lib/ml/types";

type AssessmentRow = {
  id: string;
  created_at: string;
  raw_answers: unknown;
  derived_features: unknown;
  clinical_data: unknown;
  risk_results: unknown;
};

function toEntry(row: AssessmentRow): HistoryEntry {
  const rr = (Array.isArray(row.risk_results) ? row.risk_results[0] : row.risk_results) as
    | {
        id: string;
        model_version: string;
        risk_probability: number;
        risk_band: string;
        confidence_score: number;
        is_insufficient_data: boolean;
        shap_values: unknown;
      }
    | null;
  const derived = row.derived_features as { bmi?: number } | null;

  return {
    id: row.id,
    createdAt: row.created_at,
    answers: row.raw_answers as HistoryEntry["answers"],
    bmi: derived?.bmi ?? null,
    clinical: (row.clinical_data as ClinicalData) ?? {},
    result: rr
      ? {
          id: rr.id,
          modelVersion: rr.model_version,
          riskProbability: rr.risk_probability,
          riskBand: rr.risk_band as RiskBand,
          confidenceScore: rr.confidence_score,
          isInsufficientData: rr.is_insufficient_data,
          shapValues: rr.shap_values as ShapContribution[],
        }
      : null,
  };
}

const SELECT =
  "id, created_at, raw_answers, derived_features, clinical_data, risk_results(id, model_version, risk_probability, risk_band, confidence_score, is_insufficient_data, shap_values)";

export async function GET(_request: Request, ctx: RouteContext<"/api/report/[assessmentId]">) {
  const { assessmentId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("assessments")
    .select(SELECT)
    .eq("id", assessmentId)
    .eq("user_id", user.id)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const entry = toEntry(row as AssessmentRow);

  // §9 — include what changed since the previous assessment, when there is one.
  const { data: prevRow } = await supabase
    .from("assessments")
    .select(SELECT)
    .eq("user_id", user.id)
    .eq("is_simulation", false)
    .lt("created_at", row.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let comparison = null;
  if (prevRow) {
    const previous = toEntry(prevRow as AssessmentRow);
    const cmp = compareEntries(previous, entry);
    comparison = {
      previousDate: new Date(previous.createdAt).toLocaleString(),
      narrative: cmp.narrative,
      changedAnswers: cmp.featureDiffs.map((d) => ({ label: d.label, before: d.before, after: d.after })),
    };
  }

  const buffer = await renderToBuffer(
    DoctorReportPdf({ entry, generatedAt: new Date().toLocaleString(), comparison })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="pcos-screening-report-${entry.id.slice(0, 8)}.pdf"`,
    },
  });
}
