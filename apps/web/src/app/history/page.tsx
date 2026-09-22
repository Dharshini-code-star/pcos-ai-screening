import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { getHistory } from "@/lib/history";
import { compareEntries } from "@/lib/compare";
import { TrendChart } from "@/components/shared/trend-chart";
import { HistoryList } from "@/components/history/history-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HistoryPage() {
  const { user, entries } = await getHistory();
  if (!user) redirect("/login");

  // §2 — auto-compare the two most recent assessments so the "why did it
  // change" story is visible without the user having to pick two manually.
  const [latest, previous] = entries;
  const autoCompare = latest && previous ? compareEntries(previous, latest) : null;

  return (
    <div data-animate-group className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Screening history</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Select any two results below to see exactly what changed between them.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Screening Signal Trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart entries={entries} />
        </CardContent>
      </Card>

      {autoCompare && (
        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <TrendingUp className="size-4 text-primary" />
            <CardTitle className="text-base">Why did my screening signal change?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {autoCompare.narrative.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            {autoCompare.featureDiffs.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium">What changed in your answers</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {autoCompare.featureDiffs.slice(0, 5).map((d) => (
                    <li key={d.name}>
                      {d.label}: <span className="text-muted-foreground">{d.before}</span> →{" "}
                      <span className="font-medium text-foreground">{d.after}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/history/compare?a=${previous.id}&b=${latest.id}`}>
                Full comparison <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <HistoryList entries={entries} />
      </div>
    </div>
  );
}
