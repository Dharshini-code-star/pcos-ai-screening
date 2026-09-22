import Link from "next/link";
import { Check, Info, ShieldCheck, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CONFIDENCE_NOT_CERTAINTY,
  type InformationLevel,
  type ReliabilityAssessment,
} from "@/lib/reliability";

const LEVEL_STYLES: Record<InformationLevel, string> = {
  high: "bg-emerald-50 text-emerald-800 border-emerald-200",
  moderate: "bg-amber-50 text-amber-800 border-amber-200",
  limited: "bg-brand-blush-50 text-brand-mauve-700 border-brand-pink-300/70",
};

/**
 * Compact reliability summary for the result page. The full explanation
 * lives at /reliability — this links there rather than duplicating it.
 */
export function ReliabilityPanel({
  reliability,
  showLink = true,
}: {
  reliability: ReliabilityAssessment;
  showLink?: boolean;
}) {
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <CardTitle className="text-base">How much can this result tell you?</CardTitle>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-medium",
            LEVEL_STYLES[reliability.level]
          )}
        >
          {reliability.levelLabel}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modalities */}
        <div className="grid gap-2 sm:grid-cols-2">
          {reliability.modalities.map((m) => (
            <div
              key={m.key}
              className="flex items-start gap-2 rounded-xl border border-border/70 p-3"
            >
              {m.available ? (
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Why this level */}
        <div>
          <p className="text-xs font-medium">Why this level</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {reliability.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>

        <p className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <strong className="text-foreground">{CONFIDENCE_NOT_CERTAINTY}</strong>{" "}
            {reliability.nextStep}
          </span>
        </p>

        {showLink && (
          <Link
            href="/reliability"
            className="inline-block text-xs font-medium text-primary underline underline-offset-2"
          >
            What the AI knows, and what it can&apos;t tell you →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
