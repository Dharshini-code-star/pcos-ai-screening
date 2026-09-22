import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SIGNAL_LEVEL_LABEL, type SignalCategory, type SignalLevel } from "@/lib/signals";

const LEVEL_STYLES: Record<SignalLevel, string> = {
  elevated: "bg-rose-50 text-rose-800 border-rose-200",
  pattern: "bg-amber-50 text-amber-800 border-amber-200",
  emerging: "bg-brand-blush-50 text-brand-mauve-700 border-brand-pink-300/70",
  none: "bg-emerald-50 text-emerald-800 border-emerald-200",
  insufficient: "bg-muted text-muted-foreground border-border",
};

export function EarlySignalProfile({ categories }: { categories: SignalCategory[] }) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">Your Early Signal Profile</CardTitle>
        <p className="text-xs text-muted-foreground">
          Screening signals grouped by pattern — not diagnoses, and not conditions you have.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((c) => (
          <div key={c.key} className="rounded-xl border border-border/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{c.title}</h3>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  LEVEL_STYLES[c.level]
                )}
              >
                {SIGNAL_LEVEL_LABEL[c.level]}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{c.explanation}</p>
            <dl className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {c.inputs.map((i) => (
                <div key={i.label} className="flex items-baseline justify-between gap-2 text-xs">
                  <dt className="text-muted-foreground">{i.label}</dt>
                  <dd className={cn("font-medium", i.notable && "text-brand-mauve-700")}>{i.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
