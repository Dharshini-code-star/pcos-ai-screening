import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CLINICAL_FIELDS } from "@/lib/clinical";
import type { Json } from "@/lib/supabase/types";

// §4 — stores optional user-entered lab values against one assessment.
// These are context for the doctor-ready report only: they are never sent to
// the ML service, never scored, and never interpreted here.
//
// Built as an object of optional numbers (not z.record with enum keys —
// in Zod v4 that form is exhaustive and would reject partial submissions,
// and every field here is explicitly optional). Unknown keys are stripped.
const clinicalSchema = z.object(
  Object.fromEntries(
    CLINICAL_FIELDS.map((f) => [f.name, z.number().min(0).max(10000).optional()])
  ) as Record<string, z.ZodOptional<z.ZodNumber>>
);

export async function POST(request: Request, ctx: RouteContext<"/api/assessments/[id]/clinical">) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = clinicalSchema.safeParse(body?.clinical ?? body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // .select() so we can tell an actually-updated row from an update that
  // matched nothing (e.g. wrong owner, or a missing RLS update policy —
  // PostgREST reports no error for either).
  const { data, error } = await supabase
    .from("assessments")
    .update({ clinical_data: parsed.data as Json })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("clinical data update failed", error);
    return NextResponse.json({ error: "Could not save clinical data." }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, clinical: parsed.data });
}
