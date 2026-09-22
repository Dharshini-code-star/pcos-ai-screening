import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";

/**
 * §5 — Research roadmap. Nothing here is measured, offered, or implied to be
 * available in PCOSense today. Every row is explicitly marked as research
 * that is not validated for routine PCOS screening.
 */
const CURRENT = [
  "Menstrual cycle pattern",
  "Self-reported symptom signals",
  "BMI and lifestyle inputs",
];

const FUTURE = [
  {
    title: "Hormonal biomarkers",
    what: "Blood measurements such as androgens and AMH.",
    why: "They quantify what a questionnaire can only ask about indirectly.",
  },
  {
    title: "Metabolomics",
    what: "Patterns across many small molecules in blood or urine.",
    why: "Researchers are looking for metabolic signatures that appear before symptoms are obvious.",
  },
  {
    title: "microRNA",
    what: "Small circulating molecules that influence how genes are expressed.",
    why: "Some studies report differing microRNA patterns in PCOS groups.",
  },
  {
    title: "DNA methylation",
    what: "Chemical marks on DNA that change how genes are switched on or off.",
    why: "It may help explain why PCOS appears to run in families.",
  },
  {
    title: "Wearable physiological signals",
    what: "Continuous data such as resting heart rate, sleep, and temperature trends.",
    why: "Passive tracking could pick up cycle irregularity earlier than recall-based questions.",
  },
  {
    title: "Multimodal AI",
    what: "Models that combine questionnaire, biomarker, and wearable inputs together.",
    why: "Each signal alone is weak; combined signals may be more informative.",
  },
];

export function ResearchFrontier() {
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <FlaskConical className="size-4 text-primary" />
        <CardTitle className="text-base">Future research: PCOSense molecular signals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
          This is a research roadmap, not a feature list. PCOSense does <strong>not</strong> measure
          any of the signals below, and none of them are validated for routine PCOS screening.
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">What PCOSense uses today</p>
          <div className="flex flex-wrap gap-2">
            {CURRENT.map((c) => (
              <Badge key={c} variant="secondary">
                {c}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">What research is exploring next</p>
          <div className="space-y-3">
            {FUTURE.map((f) => (
              <div key={f.title} className="rounded-xl border border-border/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-medium">{f.title}</h4>
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    Research / not validated for routine PCOS screening
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">What it is: </span>
                  {f.what}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Why researchers are interested: </span>
                  {f.why}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
