"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ShapContribution } from "@/lib/ml/types";

// Diverging pair from the design system's validated dataviz palette:
// blue = pulls risk down, red = pulls risk up. Neutral gray for the zero line.
// (Light-mode values only — this app doesn't wire a dark mode toggle yet.)
const COLOR_HIGHER = "#e34948";
const COLOR_LOWER = "#2a78d6";
const COLOR_MUTED = "#c3c2b7";

function formatValue(c: ShapContribution): string {
  if (c.is_imputed) return "not answered";
  if (typeof c.value === "boolean") return c.value ? "Yes" : "No";
  if (typeof c.value === "number") return String(c.value);
  return "—";
}

export function ShapContributionChart({ contributions, topN = 8 }: { contributions: ShapContribution[]; topN?: number }) {
  const top = [...contributions]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, topN)
    .map((c) => ({ ...c, displayValue: formatValue(c) }))
    .reverse(); // Recharts renders bottom-to-top for a vertical category axis

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: COLOR_HIGHER }} />
          Pushed signal up
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: COLOR_LOWER }} />
          Pushed signal down
        </span>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: COLOR_MUTED }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={130}
              tick={{ fontSize: 11, fill: "var(--foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine x={0} stroke={COLOR_MUTED} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const c = payload[0].payload as (typeof top)[number];
                return (
                  <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                    <p className="font-medium">{c.label}</p>
                    <p className="text-muted-foreground">Your answer: {c.displayValue}</p>
                    <p className="mt-1">
                      Contributed toward a {c.direction === "higher_risk" ? "higher" : "lower"} screening
                      signal
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="contribution" radius={4} isAnimationActive={false}>
              {top.map((c) => (
                <Cell
                  key={c.feature}
                  fill={c.direction === "higher_risk" ? COLOR_HIGHER : COLOR_LOWER}
                  fillOpacity={c.is_imputed ? 0.35 : 1}
                />
              ))}
              <LabelList
                dataKey="displayValue"
                position="insideRight"
                fill="var(--background)"
                fontSize={10}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        These factors <strong>contributed to the model&apos;s screening result</strong> — they are
        associations, not proven causes, and a factor pushing the signal up does not mean it causes
        PCOS. Faded bars are questions you left blank, where a typical value was assumed.
      </p>
    </div>
  );
}
