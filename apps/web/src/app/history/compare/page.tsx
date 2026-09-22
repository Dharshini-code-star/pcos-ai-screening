import { redirect } from "next/navigation";
import Link from "next/link";
import { getHistory } from "@/lib/history";
import { compareEntries } from "@/lib/compare";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/shared/risk-badge";
import { Button } from "@/components/ui/button";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { user, entries } = await getHistory();
  if (!user) redirect("/login");

  const { a, b } = await searchParams;
  const entryA = entries.find((e) => e.id === a);
  const entryB = entries.find((e) => e.id === b);

  if (!entryA || !entryB) {
    return (
      <div data-animate-group className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Pick two results to compare</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select two saved results from your history to see what changed.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/history">Back to history</Link>
        </Button>
      </div>
    );
  }

  const cmp = compareEntries(entryA, entryB);
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  return (
    <div data-animate-group className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Why did my screening signal change?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Comparing {fmt(cmp.earlier.createdAt)} → {fmt(cmp.later.createdAt)}
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="whitespace-nowrap text-muted-foreground">{fmt(cmp.earlier.createdAt)}</span>
              {cmp.earlier.result && !cmp.earlier.result.isInsufficientData && <RiskBadge band={cmp.earlier.result.riskBand} />}
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="whitespace-nowrap text-muted-foreground">{fmt(cmp.later.createdAt)}</span>
              {cmp.later.result && !cmp.later.result.isInsufficientData && <RiskBadge band={cmp.later.result.riskBand} />}
            </div>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {cmp.narrative.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Answers that changed</CardTitle>
        </CardHeader>
        <CardContent>
          {cmp.featureDiffs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No answers changed between these two results.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Question</th>
                    <th className="pb-2 pr-4 font-medium">Before</th>
                    <th className="pb-2 font-medium">After</th>
                  </tr>
                </thead>
                <tbody>
                  {cmp.featureDiffs.map((d) => (
                    <tr key={d.name} className="border-b last:border-0">
                      <td className="py-2 pr-4">{d.label}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{d.before}</td>
                      <td className="py-2 font-medium">{d.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {cmp.shapDeltas.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Biggest shifts in influence</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {cmp.shapDeltas.slice(0, 6).map((d) => (
                <li key={d.feature} className="flex items-center justify-between">
                  <span>{d.label}</span>
                  <span className={d.delta > 0 ? "text-rose-600" : "text-blue-600"}>
                    {d.delta > 0 ? "+" : ""}
                    {d.delta.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              These factors contributed to the model&apos;s screening result. They are not proof that
              a specific answer caused a change in your health.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
