import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assess } from "@/lib/ml/client";
import { assessRequestSchema } from "@/lib/ml/request-schema";
import type { Json } from "@/lib/supabase/types";

// Persists a questionnaire submission. Requires auth — anonymous screening
// never writes to the database (see supabase/migrations/0001_init.sql).
// Recomputes the result server-side via the ML service rather than trusting
// a client-supplied AssessResponse, so a user's own saved history can't be
// tampered with client-side.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to save results." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = assessRequestSchema.safeParse(body?.answers ?? body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let result;
  try {
    result = await assess(parsed.data);
  } catch (err) {
    console.error("assess failed", err);
    return NextResponse.json({ error: "The screening service is unavailable right now." }, { status: 502 });
  }

  const bmi = parsed.data.weight_kg / (parsed.data.height_cm / 100) ** 2;

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .insert({
      user_id: user.id,
      raw_answers: parsed.data,
      derived_features: { bmi },
      is_simulation: false,
    })
    .select("id, created_at")
    .single();

  if (assessmentError || !assessment) {
    console.error("assessment insert failed", assessmentError);
    return NextResponse.json({ error: "Could not save your result." }, { status: 500 });
  }

  const { error: riskResultError } = await supabase.from("risk_results").insert({
    assessment_id: assessment.id,
    model_version: result.model_version,
    risk_probability: result.risk_probability,
    risk_band: result.risk_band,
    confidence_score: result.confidence_score,
    is_insufficient_data: result.is_insufficient_data,
    shap_values: result.shap_values as unknown as Json,
  });

  if (riskResultError) {
    console.error("risk_result insert failed", riskResultError);
    return NextResponse.json({ error: "Could not save your result." }, { status: 500 });
  }

  return NextResponse.json({ assessmentId: assessment.id, createdAt: assessment.created_at, result });
}
