import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { UltrasoundScreening } from "@/components/ultrasound/ultrasound-screening";
import { UltrasoundResearchVisual } from "@/components/ultrasound/ultrasound-research-visual";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Ultrasound screening — PCOSense",
};

async function getUltrasoundInfo() {
  const url = process.env.ML_SERVICE_URL;
  if (!url) return null;
  try {
    const res = await fetch(`${url}/ultrasound-info`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as {
      available: boolean;
      metadata: {
        architecture?: string;
        dataset?: string;
        held_out_test?: { auroc: number; accuracy: number; n_test_images: number };
        shortcut_audit?: {
          shortcut_detected: boolean;
          interpretation: string;
          non_anatomical_baseline?: { test_auroc: number };
        };
        limitations?: string;
      } | null;
    };
  } catch {
    return null;
  }
}

export default async function UltrasoundPage() {
  const info = await getUltrasoundInfo();
  const modelReady = info?.available ?? false;

  return (
    <div data-animate-group className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Ultrasound screening</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        AI-assisted analysis of an ovarian ultrasound image. Optional — the questionnaire
        screening works perfectly well without it.
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <FlaskConical className="mt-0.5 size-4 shrink-0" />
        <p>
          This AI-assisted ultrasound result is for research/screening support only and is not a
          medical diagnosis.
        </p>
      </div>

      <UltrasoundResearchVisual />

      {!modelReady && (
        <Card className="mt-4 border-amber-300">
          <CardHeader>
            <CardTitle className="text-base">Ultrasound model not available yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              The trained model artifact hasn&apos;t been generated on this machine, so uploads
              will return an error rather than a made-up score. PCOSense never substitutes a
              placeholder probability.
            </p>
            <p className="rounded-xl bg-muted/50 p-3 font-mono text-xs">
              cd services/ml
              <br />
              python scripts/prepare_ultrasound.py
              <br />
              python scripts/train_ultrasound.py
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <UltrasoundScreening />
      </div>

      {info?.metadata && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">About this model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            {info.metadata.architecture && (
              <p>
                <span className="font-medium text-foreground">Architecture: </span>
                {info.metadata.architecture}
              </p>
            )}
            {info.metadata.dataset && (
              <p>
                <span className="font-medium text-foreground">Trained on: </span>
                {info.metadata.dataset}
              </p>
            )}
            {info.metadata.held_out_test && (
              <p>
                <span className="font-medium text-foreground">Held-out test: </span>
                AUROC {info.metadata.held_out_test.auroc.toFixed(3)} on{" "}
                {info.metadata.held_out_test.n_test_images} images —{" "}
                <span className="font-medium text-amber-800">
                  not a meaningful performance figure, see below
                </span>
              </p>
            )}
            {info.metadata.shortcut_audit?.shortcut_detected && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
                <p className="font-medium">
                  This model scores perfectly for the wrong reason
                </p>
                <p className="mt-1">
                  A check using only image size and brightness — no anatomy at all — reaches AUROC{" "}
                  {info.metadata.shortcut_audit.non_anatomical_baseline?.test_auroc.toFixed(3) ??
                    "1.000"}{" "}
                  on the same test split. The two class folders in this public dataset differ by
                  acquisition source (resolution and brightness), so the model can separate them
                  without learning anything about ovaries. Treat its output as a technical
                  demonstration of the pipeline, not as evidence it can detect PCOS.
                </p>
              </div>
            )}
            {info.metadata.limitations && (
              <p className="rounded-xl bg-muted/50 p-3">{info.metadata.limitations}</p>
            )}
          </CardContent>
        </Card>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Haven&apos;t done the questionnaire yet?{" "}
        <Link href="/screening" className="underline underline-offset-2">
          Start the clinical screening
        </Link>{" "}
        — it doesn&apos;t require an ultrasound.
      </p>
    </div>
  );
}
