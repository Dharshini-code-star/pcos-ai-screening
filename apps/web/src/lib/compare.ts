import { ALL_QUESTIONS } from "@/lib/questionnaire";
import type { HistoryEntry } from "@/lib/history";

export interface FeatureDiff {
  name: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

export interface ShapDelta {
  feature: string;
  label: string;
  before: number;
  after: number;
  delta: number;
}

export interface Comparison {
  earlier: HistoryEntry;
  later: HistoryEntry;
  featureDiffs: FeatureDiff[];
  shapDeltas: ShapDelta[];
  probabilityDeltaPct: number | null;
  narrative: string[];
}

function displayAnswer(name: string, value: unknown): string {
  if (value === null || value === undefined) return "Not answered";
  const q = ALL_QUESTIONS.find((q) => q.name === name);
  if (q?.type === "boolean") {
    return value ? (q.trueLabel ?? "Yes") : (q.falseLabel ?? "No");
  }
  return String(value);
}

export function compareEntries(a: HistoryEntry, b: HistoryEntry): Comparison {
  const [earlier, later] = new Date(a.createdAt) <= new Date(b.createdAt) ? [a, b] : [b, a];

  const featureDiffs: FeatureDiff[] = ALL_QUESTIONS.map((q) => {
    const before = displayAnswer(q.name, (earlier.answers as unknown as Record<string, unknown>)[q.name]);
    const after = displayAnswer(q.name, (later.answers as unknown as Record<string, unknown>)[q.name]);
    return { name: q.name, label: q.label, before, after, changed: before !== after };
  }).filter((d) => d.changed);

  const shapDeltas: ShapDelta[] = [];
  if (earlier.result && later.result) {
    const beforeMap = new Map(earlier.result.shapValues.map((s) => [s.feature, s]));
    for (const after of later.result.shapValues) {
      const before = beforeMap.get(after.feature);
      if (!before) continue;
      const delta = after.contribution - before.contribution;
      shapDeltas.push({ feature: after.feature, label: after.label, before: before.contribution, after: after.contribution, delta });
    }
    shapDeltas.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  }

  const probabilityDeltaPct =
    earlier.result && later.result && !earlier.result.isInsufficientData && !later.result.isInsufficientData
      ? Math.round(later.result.riskProbability * 100) - Math.round(earlier.result.riskProbability * 100)
      : null;

  const narrative: string[] = [];
  if (probabilityDeltaPct !== null && earlier.result && later.result) {
    const earlierSignal = Math.round(earlier.result.riskProbability * 100);
    const laterSignal = Math.round(later.result.riskProbability * 100);
    if (probabilityDeltaPct === 0) {
      narrative.push("Your screening signal stayed about the same.");
    } else {
      narrative.push(
        `Your screening signal ${probabilityDeltaPct > 0 ? "increased" : "decreased"} since your previous assessment, from ${earlierSignal} to ${laterSignal} out of 100.`
      );
    }
    if (earlier.result.riskBand !== later.result.riskBand) {
      narrative.push(
        `Your signal band moved from ${earlier.result.riskBand} to ${later.result.riskBand}.`
      );
    }
    const topMovers = shapDeltas.slice(0, 2).filter((d) => Math.abs(d.delta) > 0.01);
    if (topMovers.length > 0) {
      const parts = topMovers.map(
        (m) =>
          `${m.label.toLowerCase()} (${m.delta > 0 ? "contributed more toward a higher signal" : "contributed more toward a lower signal"})`
      );
      narrative.push(`The changes that contributed most to the model's screening result: ${parts.join(", ")}.`);
    }
    narrative.push(
      "These are changes in the information you provided, not evidence that a condition developed or improved."
    );
  } else {
    narrative.push("One or both assessments didn't have enough information for a full comparison.");
  }

  return { earlier, later, featureDiffs, shapDeltas, probabilityDeltaPct, narrative };
}
