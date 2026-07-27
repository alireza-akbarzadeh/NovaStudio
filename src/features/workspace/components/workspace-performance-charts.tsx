"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { PerformanceHistoryPoint } from "@/features/workspace/hooks/use-workspace-performance-stats";
import { formatBytes } from "@/features/workspace/lib/format-bytes";
import { cn } from "@/lib/utils";

const memoryChartConfig = {
  heapMb: {
    label: "JS heap",
    color: "var(--ws-accent-soft)",
  },
  contentMb: {
    label: "File content",
    color: "hsl(var(--chart-2))",
  },
  draftsMb: {
    label: "Drafts",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const tabsChartConfig = {
  tabs: {
    label: "Open tabs",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const breakdownChartConfig = {
  heap: {
    label: "JS heap",
    color: "var(--ws-accent-soft)",
  },
  content: {
    label: "File content",
    color: "hsl(var(--chart-2))",
  },
  drafts: {
    label: "Drafts",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

function formatMbTooltip(value: unknown) {
  const mb = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(mb)) return "—";
  return formatBytes(mb * 1024 * 1024);
}

export function PerformanceMetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "warn" | "good";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-ws-border-subtle bg-ws-hover/40 px-2.5 py-2",
        accent === "warn" && "border-ws-danger-soft/30 bg-ws-danger-soft/5",
        accent === "good" && "border-ws-accent/30 bg-ws-accent/5",
      )}
    >
      <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-[15px] font-semibold text-ws-text tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-[10px] text-ws-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function PerformanceMemoryTimeline({
  history,
}: {
  history: PerformanceHistoryPoint[];
}) {
  if (history.length < 2) {
    return (
      <div className="flex h-[168px] items-center justify-center rounded-lg border border-dashed border-ws-border-subtle bg-ws-hover/20 px-4 text-center text-[11px] text-ws-text-muted">
        Collecting samples… chart appears after a few seconds.
      </div>
    );
  }

  return (
    <ChartContainer
      config={memoryChartConfig}
      className="aspect-auto h-[168px] w-full"
      initialDimension={{ width: 480, height: 168 }}
    >
      <AreaChart
        data={history}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="perfHeap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-heapMb)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--color-heapMb)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="perfContent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-contentMb)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-contentMb)" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="perfDrafts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-draftsMb)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-draftsMb)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.25} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tick={{ fill: "var(--ws-text-muted)", fontSize: 10 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={36}
          tick={{ fill: "var(--ws-text-muted)", fontSize: 10 }}
          tickFormatter={(v) => `${Math.round(Number(v))}`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="border-ws-border bg-ws-panel text-ws-text"
              formatter={(value, name) => [
                formatMbTooltip(value),
                memoryChartConfig[name as keyof typeof memoryChartConfig]
                  ?.label ?? name,
              ]}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="heapMb"
          stackId="memory"
          stroke="var(--color-heapMb)"
          fill="url(#perfHeap)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="contentMb"
          stackId="memory"
          stroke="var(--color-contentMb)"
          fill="url(#perfContent)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="draftsMb"
          stackId="memory"
          stroke="var(--color-draftsMb)"
          fill="url(#perfDrafts)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function PerformanceTabsTimeline({
  history,
}: {
  history: PerformanceHistoryPoint[];
}) {
  if (history.length < 2) return null;

  return (
    <ChartContainer
      config={tabsChartConfig}
      className="aspect-auto h-[96px] w-full"
      initialDimension={{ width: 480, height: 96 }}
    >
      <LineChart
        data={history}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
        <XAxis
          dataKey="label"
          hide
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={24}
          allowDecimals={false}
          tick={{ fill: "var(--ws-text-muted)", fontSize: 10 }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="border-ws-border bg-ws-panel text-ws-text"
            />
          }
        />
        <Line
          type="monotone"
          dataKey="tabs"
          stroke="var(--color-tabs)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function PerformanceMemoryBreakdown({
  heapBytes,
  contentBytes,
  draftsBytes,
}: {
  heapBytes: number;
  contentBytes: number;
  draftsBytes: number;
}) {
  const data = [
    {
      name: "Now",
      heap: heapBytes / (1024 * 1024),
      content: contentBytes / (1024 * 1024),
      drafts: draftsBytes / (1024 * 1024),
    },
  ];

  const totalMb = data[0].heap + data[0].content + data[0].drafts;
  if (totalMb <= 0) return null;

  return (
    <ChartContainer
      config={breakdownChartConfig}
      className="aspect-auto h-[88px] w-full"
      initialDimension={{ width: 480, height: 88 }}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.2} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" hide width={0} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="border-ws-border bg-ws-panel text-ws-text"
              formatter={(value, name) => [
                formatMbTooltip(value),
                breakdownChartConfig[name as keyof typeof breakdownChartConfig]
                  ?.label ?? name,
              ]}
            />
          }
        />
        <Bar
          dataKey="heap"
          stackId="breakdown"
          fill="var(--color-heap)"
          radius={[4, 0, 0, 4]}
        />
        <Bar dataKey="content" stackId="breakdown" fill="var(--color-content)" />
        <Bar
          dataKey="drafts"
          stackId="breakdown"
          fill="var(--color-drafts)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
