"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RiskBadge } from "@/components/shared/risk-badge";
import { CONFIDENCE_LABEL, confidenceLevel } from "@/lib/signals";
import type { HistoryEntry } from "@/lib/history";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  return (
    <div className="space-y-3">
      {selected.length === 2 && (
        <div className="sticky top-16 z-10 flex items-center justify-between rounded-full border border-brand-pink-300/70 bg-brand-blush-50 p-1.5 pl-4 shadow-sm">
          <span className="text-sm text-brand-mauve-700">2 results selected</span>
          <Button size="sm" className="rounded-full" onClick={() => router.push(`/history/compare?a=${selected[0]}&b=${selected[1]}`)}>
            Compare
          </Button>
        </div>
      )}

      {entries.map((e) => (
        <Card key={e.id}>
          <CardContent className="flex items-start gap-3 py-4">
            <Checkbox
              checked={selected.includes(e.id)}
              onCheckedChange={() => toggle(e.id)}
              aria-label="Select for comparison"
              className="mt-1 shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{formatDate(e.createdAt)}</p>
                {e.result && !e.result.isInsufficientData && <RiskBadge band={e.result.riskBand} />}
              </div>
              {e.result && (
                <p className="text-xs text-muted-foreground">
                  {e.result.isInsufficientData
                    ? "Insufficient information"
                    : `Screening signal ${Math.round(e.result.riskProbability * 100)} / 100 · ${CONFIDENCE_LABEL[confidenceLevel(e.result.confidenceScore)].toLowerCase()}`}
                </p>
              )}
            </div>
            <Button asChild variant="ghost" size="icon" aria-label="View doctor report" className="shrink-0 rounded-full">
              <Link href={`/report/${e.id}`}>
                <FileText className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}

      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">No saved results yet.</p>
      )}
    </div>
  );
}
