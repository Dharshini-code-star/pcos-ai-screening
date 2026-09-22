"use client";

import { useState } from "react";
import { Check, FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLINICAL_GROUPS, type ClinicalData } from "@/lib/clinical";

export function ClinicalDataForm({
  assessmentId,
  initialValues,
}: {
  assessmentId: string;
  initialValues: ClinicalData;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initialValues).map(([k, v]) => [k, String(v)]))
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    const clinical: ClinicalData = {};
    for (const [k, v] of Object.entries(values)) {
      const n = Number(v);
      if (v !== "" && Number.isFinite(n)) clinical[k] = n;
    }
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/clinical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinical }),
      });
      if (!res.ok) throw new Error("save failed");
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <FlaskConical className="size-4 text-primary" />
        <CardTitle className="text-base">Optional clinical data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
          <p>
            Only enter values you <strong>already have</strong> from a healthcare professional or
            laboratory. Nothing here is required, and these values are not used by the screening
            model — they are carried into your doctor-ready summary as context.
          </p>
          <p className="mt-2">
            These measurements can provide additional clinical context, but PCOS diagnosis requires
            clinical assessment and exclusion of other causes.
          </p>
        </div>

        {CLINICAL_GROUPS.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-sm font-semibold">{group.title}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.fields.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={f.name} className="text-xs">
                    {f.label} <span className="text-muted-foreground">({f.unit})</span>
                  </Label>
                  <Input
                    id={f.name}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="Optional"
                    value={values[f.name] ?? ""}
                    onChange={(e) => {
                      setStatus("idle");
                      setValues((prev) => ({ ...prev, [f.name]: e.target.value }));
                    }}
                  />
                  {f.note && <p className="text-[11px] leading-snug text-muted-foreground">{f.note}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={status === "saving"} className="rounded-full">
            {status === "saving" && <Loader2 className="size-4 animate-spin" />}
            {status === "saved" && <Check className="size-4" />}
            {status === "saved" ? "Saved to report" : "Save to my report"}
          </Button>
          {status === "error" && (
            <span className="text-xs text-destructive">Couldn&apos;t save — try again.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
