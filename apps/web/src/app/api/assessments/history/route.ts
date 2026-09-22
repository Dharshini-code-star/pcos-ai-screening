import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to view your history." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("assessments")
    .select(
      "id, created_at, raw_answers, derived_features, risk_results(id, model_version, risk_probability, risk_band, confidence_score, is_insufficient_data, shap_values, created_at)"
    )
    .eq("user_id", user.id)
    .eq("is_simulation", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("history fetch failed", error);
    return NextResponse.json({ error: "Could not load history." }, { status: 500 });
  }

  return NextResponse.json({ assessments: data });
}
