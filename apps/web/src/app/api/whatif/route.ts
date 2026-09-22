import { NextResponse } from "next/server";
import { whatIf } from "@/lib/ml/client";
import { assessRequestSchema } from "@/lib/ml/request-schema";

// Never persisted — see services/ml/app/main.py's /whatif for why this is a
// separate route rather than a flag on /assess.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = assessRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await whatIf(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("whatif failed", err);
    return NextResponse.json({ error: "The screening service is unavailable right now." }, { status: 502 });
  }
}
