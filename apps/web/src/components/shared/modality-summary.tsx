import Link from "next/link";
import { Activity, ScanLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { screeningSignal } from "@/lib/signals";
import type { StoredUltrasound } from "@/lib/screening-storage";

/**
 * Shows which modalities contributed to this result.
 *
 * When both are present the two signals are shown SEPARATELY rather than
 * merged. PCOSense only reports a single fused number when a fusion model
 * trained on genuinely paired data exists — see
 * services/ml/scripts/train_fusion.py for why that is not the case today.
 * Inventing a blend (e.g. 60/40) would not be defensible.
 */
export function ModalitySummary({
  clinicalProbability,
  ultrasound,
}: {
  clinicalProbability: number | null;
  ultrasound: StoredUltrasound | null;
}) {
  const clinicalSignal = clinicalProbability !== null ? screeningSignal(clinicalProbability) : null;
  const usSignal = ultrasound ? screeningSignal(ultrasound.probability) : null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">Information used</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/70 p-3">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <p className="text-sm font-medium">Clinical information</p>
            </div>
            {clinicalSignal !== null ? (
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-primary">
                {clinicalSignal}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span>
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-muted-foreground">Not available</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">From your questionnaire answers.</p>
          </div>

          <div className="rounded-xl border border-border/70 p-3">
            <div className="flex items-center gap-2">
              <ScanLine className="size-4 text-primary" />
              <p className="text-sm font-medium">Ultrasound</p>
            </div>
            {usSignal !== null ? (
              <>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums text-primary">
                  {usSignal}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ultrasound?.prediction} · {ultrasound?.model}
                </p>
              </>
            ) : (
              <>
                <p className="mt-1.5 text-sm text-muted-foreground">Not available</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional — screening does not require one.
                </p>
              </>
            )}
          </div>
        </div>

        {clinicalSignal !== null && usSignal !== null ? (
          <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              These two signals are shown separately, not merged into one number.{" "}
            </span>
            Combining them requires a fusion model trained on people who had both a questionnaire
            and an ultrasound with a shared outcome. No such paired dataset is available here, so
            PCOSense reports each modality on its own rather than inventing a combined score.
          </p>
        ) : usSignal === null ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              Have an ultrasound image? You can add it as a second, independent signal.
            </p>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href="/screening/ultrasound">Add ultrasound</Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
