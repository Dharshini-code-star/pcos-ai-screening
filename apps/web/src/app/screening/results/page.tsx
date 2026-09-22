"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, HelpCircle, ListChecks, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfidenceMeter } from "@/components/shared/confidence-meter";
import { ShapContributionChart } from "@/components/shared/shap-contribution-chart";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { SignalScore } from "@/components/shared/signal-score";
import { EarlySignalProfile } from "@/components/shared/early-signal-profile";
import { SaveResultButton } from "@/components/screening/save-result-button";
import {
  readLastAssessment,
  readUltrasoundResult,
  type StoredAssessment,
  type StoredUltrasound,
} from "@/lib/screening-storage";
import { ModalitySummary } from "@/components/shared/modality-summary";
import { ReliabilityPanel } from "@/components/reliability/reliability-panel";
import { buildReliability } from "@/lib/reliability";
import { buildSignalProfile, NEXT_BEST_STEP } from "@/lib/signals";
import type { SignalBand } from "@/lib/signals";

export default function ScreeningResultsPage() {
  const [stored, setStored] = useState<StoredAssessment | null | undefined>(undefined);
  const [ultrasound, setUltrasound] = useState<StoredUltrasound | null>(null);

  useEffect(() => {
    // sessionStorage is a browser-only external store read once on mount to
    // hydrate client state; there's no update subscription to model this as.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStored(readLastAssessment());
    setUltrasound(readUltrasoundResult());
  }, []);

  if (stored === undefined) return null;

  if (stored === null) {
    return (
      <div data-animate-group className="mx-auto max-w-xl px-4 py-16 text-center">
        <HelpCircle className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-3 text-xl font-semibold">No result to show</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start the questionnaire to see your screening signal here.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/screening">Start screening</Link>
        </Button>
      </div>
    );
  }

  const { answers, result } = stored;
  const band = result.risk_band as SignalBand;
  const categories = buildSignalProfile(answers);
  const reliability = buildReliability({
    clinical: result,
    ultrasoundProbability: ultrasound?.probability ?? null,
    missingFields: result.missing_fields,
  });

  return (
    <div data-animate-group className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Your screening result</h1>

      {result.is_insufficient_data ? (
        <Card className="mt-6 border-amber-300">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <AlertCircle className="size-5 text-amber-600" />
            <CardTitle className="text-base">Not enough information for a reliable signal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              You left too many optional questions blank (or your answers were unusual enough)
              for the model to give a confident read. More information would be needed for a
              stronger screening assessment.
            </p>
            <ConfidenceMeter score={result.confidence_score} missingCount={result.missing_fields.length} />
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/screening">Answer more questions</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Screening signal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SignalScore riskProbability={result.risk_probability} band={band} />
            <ConfidenceMeter score={result.confidence_score} missingCount={result.missing_fields.length} />
          </CardContent>
        </Card>
      )}

      <ModalitySummary
        clinicalProbability={result.is_insufficient_data ? null : result.risk_probability}
        ultrasound={ultrasound}
      />

      <EarlySignalProfile categories={categories} />

      <ReliabilityPanel reliability={reliability} />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Why this result?</CardTitle>
        </CardHeader>
        <CardContent>
          <ShapContributionChart contributions={result.shap_values} />
        </CardContent>
      </Card>

      {!result.is_insufficient_data && (
        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <ListChecks className="size-4 text-primary" />
            <CardTitle className="text-base">Your next best step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{NEXT_BEST_STEP[band]}</p>
            <div className="rounded-xl border border-border/70 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Stethoscope className="size-4 text-primary" />
                Discuss your result with a healthcare professional
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                A clinician can evaluate what a screening tool cannot.
              </p>
              <Button asChild variant="outline" className="mt-3 rounded-full">
                <Link href="/doctor">Find healthcare support</Link>
              </Button>
            </div>
            <div className="rounded-xl border border-brand-pink-300/70 bg-brand-blush-50 p-4">
              <p className="text-sm font-medium text-brand-mauve-700">
                Turn this into day-to-day habits
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                General lifestyle guidance shaped by your answers — not a treatment plan.
              </p>
              <Button asChild className="mt-3 rounded-full">
                <Link href="/guidance">
                  Create My Guidance Plan <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DisclaimerBanner className="mt-6" />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SaveResultButton answers={answers} />
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/whatif">
            What-if <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/screening">Retake screening</Link>
        </Button>
      </div>
    </div>
  );
}
