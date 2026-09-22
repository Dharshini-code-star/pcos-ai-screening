"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Apple, Droplets, Footprints, HelpCircle, Moon, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WhyThis } from "@/components/guidance/why-this";
import { readLastAssessment } from "@/lib/screening-storage";
import {
  buildGuidancePlan,
  GUIDANCE_DISCLAIMER,
  GUIDANCE_GOALS,
  MEAL_EXAMPLES,
  type GuidanceGoal,
} from "@/lib/guidance";
import type { AssessRequest } from "@/lib/ml/types";

const CARD_ICONS = {
  food: Apple,
  movement: Footprints,
  hydration: Droplets,
  sleep: Moon,
} as const;

const GOAL_KEY = "pcos:guidance:goal";
const WEEKLY_KEY = "pcos:guidance:weekly";

/** Monday-based week stamp, so checked goals reset naturally each week. */
function currentWeekStamp(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private-browsing / blocked storage — guidance still renders, the
    // checkboxes just won't survive a reload.
  }
}

export function GuidancePlan({ serverAnswers }: { serverAnswers: AssessRequest | null }) {
  const [answers, setAnswers] = useState<AssessRequest | null | undefined>(
    serverAnswers ?? undefined
  );
  const [goal, setGoal] = useState<GuidanceGoal>("general");
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    // Local, browser-only state read once on mount: the saved goal, this
    // week's ticked goals, and (for users who haven't saved an assessment)
    // the screening result still sitting in sessionStorage.
    const storedGoal = readStored<GuidanceGoal | null>(GOAL_KEY, null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedGoal) setGoal(storedGoal);

    const weekly = readStored<{ weekOf: string; completed: string[] }>(WEEKLY_KEY, {
      weekOf: "",
      completed: [],
    });
    if (weekly.weekOf === currentWeekStamp()) setCompleted(weekly.completed);

    if (!serverAnswers) {
      setAnswers(readLastAssessment()?.answers ?? null);
    }
  }, [serverAnswers]);

  const plan = useMemo(() => (answers ? buildGuidancePlan(answers, goal) : null), [answers, goal]);

  function chooseGoal(next: GuidanceGoal) {
    setGoal(next);
    writeStored(GOAL_KEY, next);
  }

  function toggleGoal(id: string) {
    setCompleted((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeStored(WEEKLY_KEY, { weekOf: currentWeekStamp(), completed: next });
      return next;
    });
  }

  if (answers === undefined) return null;

  if (answers === null || !plan) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
        <HelpCircle className="mx-auto size-8 text-muted-foreground" />
        <h2 className="mt-3 text-lg font-semibold">Complete a screening first</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your guidance is built from the answers you give in the screening.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/screening">Start screening</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Goal picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What would you like to focus on?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {GUIDANCE_GOALS.map((g) => (
              <Button
                key={g.value}
                type="button"
                size="sm"
                variant={goal === g.value ? "default" : "outline"}
                className="rounded-full"
                onClick={() => chooseGoal(g.value)}
              >
                {g.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's focus */}
      <Card className="border-brand-pink-300/70 bg-brand-blush-50">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Target className="size-4 text-primary" />
          <CardTitle className="text-base">Today&apos;s focus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-brand-mauve-700">{plan.focus.text}</p>
          <WhyThis reason={plan.focus.reason} />
        </CardContent>
      </Card>

      {/* Four daily cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {plan.cards.map((c) => {
          const Icon = CARD_ICONS[c.key];
          return (
            <Card key={c.key}>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-blush-100 text-brand-mauve-600">
                  <Icon className="size-4" />
                </span>
                <CardTitle className="text-base">{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{c.recommendation}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Why? </span>
                  {c.why}
                </p>
                <p className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Today: </span>
                  {c.action}
                </p>
                <WhyThis reason={c.reason} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your weekly goals</CardTitle>
          <p className="text-xs text-muted-foreground">
            Kept on this device, and they reset at the start of each week.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.weeklyGoals.map((g) => (
            <div key={g.id} className="flex items-start gap-3">
              <Checkbox
                id={`goal-${g.id}`}
                checked={completed.includes(g.id)}
                onCheckedChange={() => toggleGoal(g.id)}
                className="mt-0.5 shrink-0"
              />
              <Label
                htmlFor={`goal-${g.id}`}
                className={
                  completed.includes(g.id)
                    ? "text-sm font-normal text-muted-foreground line-through"
                    : "text-sm font-normal"
                }
              >
                {g.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Meal examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Balanced meal examples</CardTitle>
          <p className="text-xs text-muted-foreground">
            Examples to borrow from — not mandatory meals, and not a list of foods to avoid.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {MEAL_EXAMPLES.map((m, i) => (
              <li key={i} className="flex flex-col text-sm sm:flex-row sm:items-baseline sm:gap-2">
                <span className="text-xs font-medium text-muted-foreground sm:w-20 sm:shrink-0">
                  {m.meal}
                </span>
                <span>{m.example}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        {GUIDANCE_DISCLAIMER}
      </p>
    </div>
  );
}
