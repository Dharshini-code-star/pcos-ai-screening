"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Badge } from "@/components/ui/badge";
import { readLastAssessment } from "@/lib/screening-storage";
import type { AssessRequest, AssessResponse } from "@/lib/ml/types";

export function WhatIfSimulator() {
  const [baseline, setBaseline] = useState<AssessRequest | null | undefined>(undefined);
  const [baselineResult, setBaselineResult] = useState<AssessResponse | null>(null);

  const [weightKg, setWeightKg] = useState(60);
  const [fastFood, setFastFood] = useState(false);
  const [regularExercise, setRegularExercise] = useState(false);

  const [result, setResult] = useState<AssessResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // sessionStorage read once on mount to hydrate the simulator's starting point.
    const stored = readLastAssessment();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBaseline(stored?.answers ?? null);
    if (stored) {
      setBaselineResult(stored.result);
      setWeightKg(stored.answers.weight_kg);
      setFastFood(!!stored.answers.fast_food);
      setRegularExercise(!!stored.answers.regular_exercise);
    }
  }, []);

  const payload: AssessRequest | null = useMemo(() => {
    if (!baseline) return null;
    return { ...baseline, weight_kg: weightKg, fast_food: fastFood, regular_exercise: regularExercise };
  }, [baseline, weightKg, fastFood, regularExercise]);

  useEffect(() => {
    if (!payload) return;
    // Debounced fetch triggered by payload changes — the loading flag marks
    // the in-flight request, not a mirror of some other reactive value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/whatif", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) setResult(await res.json());
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [payload]);

  if (baseline === undefined) return null;

  if (baseline === null) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Complete a screening first — the simulator starts from your latest answers.
        </p>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/screening">Start screening</Link>
        </Button>
      </div>
    );
  }

  const bmi = weightKg / (baseline.height_cm / 100) ** 2;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adjust lifestyle factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Weight</Label>
              <span className="text-sm text-muted-foreground">{weightKg} kg · BMI {bmi.toFixed(1)}</span>
            </div>
            <Slider value={[weightKg]} min={30} max={150} step={1} onValueChange={([v]) => setWeightKg(v)} />
          </div>

          <div className="space-y-2">
            <Label>Frequent fast food consumption</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={!fastFood ? "default" : "outline"} onClick={() => setFastFood(false)} className="flex-1 rounded-full">No</Button>
              <Button type="button" size="sm" variant={fastFood ? "default" : "outline"} onClick={() => setFastFood(true)} className="flex-1 rounded-full">Yes</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Regular exercise</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={!regularExercise ? "default" : "outline"} onClick={() => setRegularExercise(false)} className="flex-1 rounded-full">No</Button>
              <Button type="button" size="sm" variant={regularExercise ? "default" : "outline"} onClick={() => setRegularExercise(true)} className="flex-1 rounded-full">Yes</Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Every other answer (symptoms, cycle) stays fixed at your last screening — only
            these lifestyle factors change here.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Simulated result</CardTitle>
            <Badge variant="secondary">Hypothetical</Badge>
          </div>
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent className="space-y-4">
          {result && !result.is_insufficient_data ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-semibold tabular-nums">
                  {Math.round(result.risk_probability * 100)}
                  <span className="ml-1 text-base font-normal text-muted-foreground">/ 100</span>
                </p>
                <RiskBadge band={result.risk_band} />
              </div>
              {baselineResult && !baselineResult.is_insufficient_data && (
                <p className="text-sm text-muted-foreground">
                  Your saved screening signal was {Math.round(baselineResult.risk_probability * 100)} — this
                  scenario is{" "}
                  {Math.round(result.risk_probability * 100) - Math.round(baselineResult.risk_probability * 100) >= 0 ? "+" : ""}
                  {Math.round(result.risk_probability * 100) - Math.round(baselineResult.risk_probability * 100)} from that.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Calculating…</p>
          )}
          <p className="text-xs text-muted-foreground">
            This is a hypothetical, not a prediction of what will happen if you make these
            changes — it shows how the model&apos;s association with these factors shifts the
            estimate, nothing more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
