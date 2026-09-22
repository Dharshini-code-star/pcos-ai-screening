"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QUESTIONNAIRE_STEPS, REQUIRED_FIELDS, type Question } from "@/lib/questionnaire";
import { saveLastAssessment } from "@/lib/screening-storage";
import type { AssessRequest, AssessResponse } from "@/lib/ml/types";

type Answers = Partial<Record<string, number | boolean>>;

function BooleanQuestion({ q, value, onChange }: { q: Question; value: boolean | undefined; onChange: (v: boolean) => void }) {
  return (
    <div className="space-y-2">
      <Label>{q.label}</Label>
      {q.help && <p className="text-xs text-muted-foreground">{q.help}</p>}
      <div className="flex gap-2">
        <Button type="button" variant={value === false ? "default" : "outline"} onClick={() => onChange(false)} className="flex-1 rounded-full">
          {q.falseLabel ?? "No"}
        </Button>
        <Button type="button" variant={value === true ? "default" : "outline"} onClick={() => onChange(true)} className="flex-1 rounded-full">
          {q.trueLabel ?? "Yes"}
        </Button>
      </div>
    </div>
  );
}

function NumberQuestion({ q, value, onChange }: { q: Question; value: number | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={q.name}>
        {q.label} {q.unit && <span className="text-muted-foreground">({q.unit})</span>}
      </Label>
      {q.help && <p className="text-xs text-muted-foreground">{q.help}</p>}
      <Input
        id={q.name}
        type="number"
        min={q.min}
        max={q.max}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        placeholder={q.required ? "Required" : "Optional — skip if unsure"}
      />
    </div>
  );
}

// §12 — a clearly-labelled demo profile for the hackathon walkthrough. These
// are only questionnaire INPUTS: the real model still computes the result, so
// nothing here fabricates a screening outcome.
const DEMO_PATIENT: Answers = {
  age: 27,
  height_cm: 160,
  weight_kg: 78,
  cycle_regularity: true,
  period_duration_days: 7,
  weight_gain: true,
  hair_growth: true,
  skin_darkening: true,
  hair_loss: false,
  pimples: true,
  fast_food: true,
  regular_exercise: false,
};

export function QuestionnaireForm() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const step = QUESTIONNAIRE_STEPS[stepIndex];
  const isLastStep = stepIndex === QUESTIONNAIRE_STEPS.length - 1;
  const progressPct = Math.round(((stepIndex + 1) / QUESTIONNAIRE_STEPS.length) * 100);

  const stepMissingRequired = step.questions.some((q) => q.required && answers[q.name] === undefined);

  function setAnswer(name: string, value: number | boolean | undefined) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[name];
      else next[name] = value;
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const payload: AssessRequest = {
        age: answers.age as number,
        height_cm: answers.height_cm as number,
        weight_kg: answers.weight_kg as number,
        cycle_regularity: answers.cycle_regularity as boolean,
        period_duration_days: (answers.period_duration_days as number) ?? null,
        weight_gain: (answers.weight_gain as boolean) ?? null,
        hair_growth: (answers.hair_growth as boolean) ?? null,
        skin_darkening: (answers.skin_darkening as boolean) ?? null,
        hair_loss: (answers.hair_loss as boolean) ?? null,
        pimples: (answers.pimples as boolean) ?? null,
        fast_food: (answers.fast_food as boolean) ?? null,
        regular_exercise: (answers.regular_exercise as boolean) ?? null,
      };

      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("The screening service didn't respond. Please try again in a moment.");
      }

      const result: AssessResponse = await res.json();
      saveLastAssessment({ answers: payload, result });
      router.push("/screening/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const missingCount = REQUIRED_FIELDS.filter((f) => answers[f] === undefined).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {stepIndex + 1} of {QUESTIONNAIRE_STEPS.length}</span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} />
      </div>

      {isDemo && (
        <div className="rounded-full border border-brand-pink-300/70 bg-brand-blush-50 px-3 py-1.5 text-xs font-medium text-brand-mauve-700">
          Demo Patient — example answers, not your own data
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold">{step.title}</h2>
        {step.description && <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>}
      </div>

      <div className="space-y-5">
        {step.questions.map((q) =>
          q.type === "boolean" ? (
            <BooleanQuestion key={q.name} q={q} value={answers[q.name] as boolean | undefined} onChange={(v) => setAnswer(q.name, v)} />
          ) : (
            <NumberQuestion key={q.name} q={q} value={answers[q.name] as number | undefined} onChange={(v) => setAnswer(q.name, v)} />
          )
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" className="rounded-full" onClick={() => setStepIndex((i) => Math.max(0, i - 1))} disabled={stepIndex === 0 || submitting}>
          <ArrowLeft className="size-4" /> Back
        </Button>

        {isLastStep ? (
          <Button type="button" className="rounded-full" onClick={handleSubmit} disabled={missingCount > 0 || submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            See my result
          </Button>
        ) : (
          <Button type="button" className="rounded-full" onClick={() => setStepIndex((i) => i + 1)} disabled={stepMissingRequired}>
            Next <ArrowRight className="size-4" />
          </Button>
        )}
      </div>

      {missingCount > 0 && isLastStep && (
        <p className="text-right text-xs text-muted-foreground">
          Go back and fill in {missingCount} required field{missingCount > 1 ? "s" : ""} to continue.
        </p>
      )}

      {!isDemo && (
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => {
              setAnswers(DEMO_PATIENT);
              setIsDemo(true);
              setStepIndex(QUESTIONNAIRE_STEPS.length - 1);
            }}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Load Demo Patient (example answers for a walkthrough)
          </button>
        </div>
      )}
    </div>
  );
}
