import { Progress } from "@/components/ui/progress";
import { CONFIDENCE_LABEL, confidenceLevel } from "@/lib/signals";

export function ConfidenceMeter({ score, missingCount = 0 }: { score: number; missingCount?: number }) {
  const pct = Math.round(score * 100);
  const level = confidenceLevel(score);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Data confidence</span>
        <span className="font-medium">{CONFIDENCE_LABEL[level]}</span>
      </div>
      <Progress value={pct} />
      <p className="text-xs text-muted-foreground">
        Confidence reflects how much relevant information was available to the screening model.
        It is not medical certainty.
        {level !== "high" && missingCount > 0 && (
          <> More information would be needed for a stronger screening assessment.</>
        )}
      </p>
    </div>
  );
}
