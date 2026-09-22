import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskBand } from "@/lib/ml/types";

const RISK_BAND_STYLES: Record<RiskBand, string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  moderate: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  elevated: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
};

// Signal-framed labels (§7): the band describes the screening signal, never
// a condition the person has.
const RISK_BAND_LABELS: Record<RiskBand, string> = {
  low: "Low screening signal",
  moderate: "Emerging screening signal",
  elevated: "Elevated screening signal",
};

export function RiskBadge({ band, className }: { band: RiskBand; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("px-3 py-1 text-sm font-medium", RISK_BAND_STYLES[band], className)}
    >
      {RISK_BAND_LABELS[band]}
    </Badge>
  );
}
