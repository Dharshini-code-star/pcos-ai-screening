import Link from "next/link";
import { Brain, HelpCircle, Layers, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { CONFIDENCE_NOT_CERTAINTY } from "@/lib/reliability";

const FLOW = [
  {
    icon: Brain,
    title: "AI screening result",
    body: "A model compares your answers to patterns in its training data and produces a screening signal from 0 to 100. It is a pattern-matching score, not a measurement of your body.",
  },
  {
    icon: Layers,
    title: "Information available",
    body: "The more relevant information the model has — answered questions, and optionally an ultrasound image — the more there is behind the result. Missing information is shown to you rather than hidden.",
  },
  {
    icon: HelpCircle,
    title: "Model uncertainty",
    body: "Skipped questions, unusual answer combinations, or a single modality all make the result less certain. PCOSense lowers the stated information level instead of presenting every result as equally solid.",
  },
  {
    icon: Stethoscope,
    title: "Responsible next step",
    body: "Whatever the number, the next step is a conversation with a healthcare professional if anything concerns you. A screening tool decides nothing on its own.",
  },
];

const KNOWS = [
  "The questionnaire answers you gave — cycle pattern, symptoms, lifestyle, height and weight.",
  "How those answers compare to patterns in the dataset the model was trained on.",
  "Visual patterns in an ultrasound image, but only if you chose to upload one.",
];

const MISSING = [
  "Hormone levels, unless you typed lab values in yourself — and even then they are shown as context, never scored.",
  "Your medical history, medications, family history, and anything a clinician would ask in person.",
  "Ultrasound findings, unless you uploaded an image.",
];

const CANNOT = [
  "It cannot diagnose PCOS. Diagnosis needs the Rotterdam criteria: clinical assessment, bloodwork, and often an ultrasound, interpreted by a clinician.",
  "It cannot rule other conditions in or out. Thyroid problems and other causes can look similar and must be excluded by a professional.",
  "It cannot tell you whether you will develop PCOS in future.",
  "It cannot tell you that a factor caused anything — the explanations show association, not causation.",
];

const WHEN_CLINICAL = [
  "Your periods are irregular or absent.",
  "You notice new or worsening symptoms such as excess hair growth, acne, or hair thinning.",
  "You are having difficulty conceiving.",
  "Anything about your health is worrying you — regardless of what this tool showed.",
];

export default function ReliabilityPage() {
  return (
    <div data-animate-group className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">How reliable is this?</h1>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        PCOSense does not give itself a reliability score. Instead it shows what information went
        into your result, what is missing, and how cautiously to read it.
      </p>

      <DisclaimerBanner className="mt-4" />

      <Card className="mt-6 border-brand-pink-300/70 bg-brand-blush-50">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-brand-mauve-700">{CONFIDENCE_NOT_CERTAINTY}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            A high information level means the model had a lot to work with — not that the result
            is medically correct.
          </p>
        </CardContent>
      </Card>

      {/* The flow */}
      <div data-animate-group className="mt-6 grid gap-3 sm:grid-cols-2">
        {FLOW.map((f, i) => (
          <Card key={f.title}>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-blush-100 text-brand-mauve-600">
                <f.icon className="size-4" />
              </span>
              <CardTitle className="text-base">
                <span className="mr-1.5 text-xs text-muted-foreground">{i + 1}</span>
                {f.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">What the AI knows</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {KNOWS.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">What information is missing</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {MISSING.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">What the model cannot tell you</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {CANNOT.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">When clinical evaluation is important</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {WHEN_CLINICAL.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
          <Button asChild className="rounded-full">
            <Link href="/doctor">Find healthcare support</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
