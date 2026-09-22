"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ImageUp, Loader2, RefreshCw, ScanLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { saveUltrasoundResult } from "@/lib/screening-storage";
import { ultrasoundSignal, type UltrasoundResult } from "@/lib/ml/ultrasound-types";

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"];
const MAX_BYTES = 10 * 1024 * 1024;

type Status = "idle" | "loading" | "done" | "error";

export function UltrasoundScreening() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UltrasoundResult | null>(null);

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setStatus("idle");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onPick(picked: File | undefined) {
    setError(null);
    setResult(null);
    setStatus("idle");
    if (!picked) return;

    if (!ALLOWED.includes(picked.type)) {
      setError("That file type isn't supported. Upload a PNG, JPEG, WebP, or BMP image.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError("That image is larger than 10 MB. Please choose a smaller file.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  }

  async function analyse() {
    if (!file) return;
    setStatus("loading");
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/ultrasound?gradcam=true", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "The ultrasound model could not process this image.");
        setStatus("error");
        return;
      }
      setResult(data as UltrasoundResult);
      // Kept in this browser session only, so the result page can show that
      // ultrasound was one of the available modalities. The image itself is
      // never stored.
      saveUltrasoundResult({
        probability: data.image_probability,
        prediction: data.prediction,
        model: data.model,
        at: new Date().toISOString(),
      });
      setStatus("done");
    } catch {
      setError("Could not reach the ultrasound screening service.");
      setStatus("error");
    }
  }

  const signal = result ? ultrasoundSignal(result.image_probability) : null;

  return (
    <div className="space-y-4">
      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload an ovarian ultrasound image</CardTitle>
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, WebP, or BMP · up to 10 MB. Your image is analysed and then discarded —
            it is never saved to your history or our database.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            id="ultrasound-file"
            type="file"
            accept={ALLOWED.join(",")}
            className="sr-only"
            onChange={(e) => onPick(e.target.files?.[0])}
          />

          {!previewUrl ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-pink-300 bg-brand-blush-50 px-6 py-12 text-center hover:bg-brand-blush-100"
            >
              <ImageUp className="size-7 text-brand-mauve-600" />
              <span className="text-sm font-medium">Choose an ultrasound image</span>
              <span className="text-xs text-muted-foreground">or drag a file onto this area</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Ultrasound preview"
                  className="mx-auto max-h-80 w-auto object-contain"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={analyse}
                  disabled={status === "loading"}
                  className="rounded-full"
                >
                  {status === "loading" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ScanLine className="size-4" />
                  )}
                  {status === "loading" ? "Analysing…" : "Run ultrasound screening"}
                </Button>
                <Button variant="outline" className="rounded-full" onClick={reset}>
                  <RefreshCw className="size-4" /> Choose a different image
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {status === "loading" && (
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm text-muted-foreground">
              Running the image through the model…
            </p>
            <Progress value={65} />
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {status === "done" && result && signal !== null && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ultrasound screening signal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-4xl font-semibold tabular-nums text-primary">
                  {signal}
                  <span className="ml-1 text-lg font-normal text-muted-foreground">/ 100</span>
                </p>
                <p className="mt-0.5 text-sm font-medium">{result.prediction}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Model-predicted probability from this image — a screening estimate, not a
                  diagnosis.
                </p>
              </div>

              <dl className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 p-3">
                  <dt className="text-xs text-muted-foreground">Model</dt>
                  <dd className="text-sm font-medium">{result.model}</dd>
                </div>
                <div className="rounded-xl border border-border/70 p-3">
                  <dt className="text-xs text-muted-foreground">Model version</dt>
                  <dd className="text-sm font-medium">{result.model_version}</dd>
                </div>
              </dl>

              <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">What this number means</p>
                <p className="mt-1">
                  It is how strongly this single image matches the PCOS-consistent appearance the
                  model saw during training. Ultrasound appearance is only one of the three
                  Rotterdam criteria, and a clinician interprets it alongside your symptoms and
                  bloodwork.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Grad-CAM */}
          {result.gradcam_png_base64 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What the model looked at</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <figure className="space-y-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl ?? ""}
                      alt="Original ultrasound"
                      className="w-full rounded-xl border border-border/70 object-contain"
                    />
                    <figcaption className="text-xs text-muted-foreground">
                      Original ultrasound
                    </figcaption>
                  </figure>
                  <figure className="space-y-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${result.gradcam_png_base64}`}
                      alt="Grad-CAM heatmap overlay"
                      className="w-full rounded-xl border border-border/70 object-contain"
                    />
                    <figcaption className="text-xs text-muted-foreground">
                      Grad-CAM heatmap
                    </figcaption>
                  </figure>
                </div>
                <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                  Grad-CAM highlights image regions that influenced the model prediction. It does
                  not prove that these regions medically indicate PCOS.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="flex flex-wrap gap-2 py-4">
              <Button asChild className="rounded-full">
                <Link href="/screening/results">See this alongside my clinical result</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/reliability">How reliable is this?</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
