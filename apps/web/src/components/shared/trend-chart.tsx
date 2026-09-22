"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistoryEntry } from "@/lib/history";

const COLOR_LINE = "#ab3e70"; // brand mauve — safe here since this line carries no severity signal
const COLOR_MUTED = "#c3c2b7";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TrendChart({ entries }: { entries: HistoryEntry[] }) {
  const data = [...entries]
    .filter((e) => e.result && !e.result.isInsufficientData)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((e) => ({
      date: formatDate(e.createdAt),
      probabilityPct: Math.round(e.result!.riskProbability * 100),
    }));

  if (data.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Your trajectory will appear after additional assessments.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_LINE} stopOpacity={0.25} />
              <stop offset="100%" stopColor={COLOR_LINE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: COLOR_MUTED }} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <ReferenceLine y={30} stroke={COLOR_MUTED} strokeDasharray="2 2" />
          <ReferenceLine y={60} stroke={COLOR_MUTED} strokeDasharray="2 2" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof data)[number];
              return (
                <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                  <p className="font-medium">{p.date}</p>
                  <p className="text-muted-foreground">Screening signal: {p.probabilityPct} / 100</p>
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="probabilityPct" stroke={COLOR_LINE} strokeWidth={2} fill="url(#riskFill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        This trend reflects changes in the information provided to PCOSense. It does not mean that
        PCOS is developing or worsening.
      </p>
    </div>
  );
}
