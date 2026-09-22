import { NextResponse } from "next/server";
import { assess } from "@/lib/ml/client";
import { assessRequestSchema } from "@/lib/ml/request-schema";

// Unauthenticated on purpose: the landing screening flow works without an
// account (data-minimization by default — see supabase/migrations/0001_init.sql).
// Nothing here is persisted; saving happens separately via /api/assessments.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = assessRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await assess(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("assess failed", err);
    return NextResponse.json({ error: "The screening service is unavailable right now." }, { status: 502 });
  }
}
