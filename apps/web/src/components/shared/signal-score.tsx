"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { screeningSignal, SIGNAL_BAND_LABEL, type SignalBand } from "@/lib/signals";

/**
 * §7 — the headline number, deliberately framed as a 0-100 screening signal
 * rather than "X% chance of PCOS". The underlying model output is unchanged;
 * only how it is presented and explained differs.
 */
export function SignalScore({
  riskProbability,
  band,
}: {
  riskProbability: number;
  band: SignalBand;
}) {
  const [open, setOpen] = useState(false);
  const signal = screeningSignal(riskProbability);

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-semibold tabular-nums text-primary">{signal}</p>
        <span className="text-lg text-muted-foreground">/ 100</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground"
          aria-label="What is a screening signal?"
        >
          <Info className="size-4" />
        </button>
      </div>
      <p className="mt-0.5 text-sm font-medium">{SIGNAL_BAND_LABEL[band]}</p>
      <p className="mt-1 text-xs text-muted-foreground">Screening estimate — not a diagnosis.</p>

      {open && (
        <div className="mt-3 rounded-xl border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Why a screening signal, not a percentage?</p>
          <p className="mt-1">
            This number scales how strongly your answers match patterns the model learned from its
            training data. It is <strong>not</strong> the probability that you have or will develop
            PCOS, and it is not a clinical measurement. PCOS can only be diagnosed by a clinician
            using the Rotterdam criteria, which requires clinical, biochemical, and ultrasound
            assessment.
          </p>
        </div>
      )}
    </div>
  );
}
