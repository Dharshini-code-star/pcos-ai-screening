import { NextResponse } from "next/server";

/**
 * Proxies an ultrasound image upload to the FastAPI ultrasound model.
 *
 * Unauthenticated on purpose, matching /api/assess: ultrasound screening
 * works without an account. The image is streamed straight through to the
 * model service — it is never written to disk, never stored in Supabase, and
 * never logged here.
 */

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"]);

export async function POST(request: Request) {
  const mlUrl = process.env.ML_SERVICE_URL;
  if (!mlUrl) {
    return NextResponse.json({ error: "ML_SERVICE_URL is not set." }, { status: 500 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart image upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image was uploaded." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Upload a PNG, JPEG, WebP, or BMP image." },
      { status: 415 }
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image must be 10 MB or smaller." }, { status: 413 });
  }

  const wantsGradcam = new URL(request.url).searchParams.get("gradcam") === "true";

  const upstream = new FormData();
  upstream.append("file", file, file.name || "ultrasound");

  try {
    const res = await fetch(
      `${mlUrl}/predict-ultrasound?gradcam=${wantsGradcam ? "true" : "false"}`,
      { method: "POST", body: upstream, cache: "no-store" }
    );

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      // Pass the model service's own status through (503 = artifact not
      // trained yet) so the UI can explain the real reason.
      return NextResponse.json(
        { error: body?.detail ?? "The ultrasound model could not process this image." },
        { status: res.status }
      );
    }
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "The ultrasound screening service is unavailable right now." },
      { status: 502 }
    );
  }
}
