"use client";

import { ActivityIcon, GaugeIcon, RefreshCwIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  PerformanceMemoryBreakdown,
  PerformanceMemoryTimeline,
  PerformanceMetricCard,
  PerformanceTabsTimeline,
} from "@/features/workspace/components/workspace-performance-charts";
import { useWorkspacePerformanceStats } from "@/features/workspace/hooks/use-workspace-performance-stats";
import { formatBytes } from "@/features/workspace/lib/format-bytes";
import { cn } from "@/lib/utils";

type WorkspacePerformancePanelProps = {
  projectId: string;
};

function StatRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-2.5 py-1.5 text-[11px]">
      <span className="text-ws-text-muted">{label}</span>
      <div className="min-w-0 text-right">
        <span className="font-mono text-ws-text">{value}</span>
        {hint ? (
          <p className="mt-0.5 text-[10px] text-ws-text-muted">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-ws-border-subtle last:border-b-0">
      <h3 className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-ws-text-muted uppercase">
        {icon}
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

export function WorkspacePerformancePanel({
  projectId,
}: WorkspacePerformancePanelProps) {
  const [refreshNonce, setRefreshNonce] = useState(0);
  const stats = useWorkspacePerformanceStats(projectId, {
    enabled: true,
    pollMs: 2000,
    refreshNonce,
  });

  const contentProgress =
    stats.contentStats && stats.contentStats.fileCount > 0
      ? Math.round(
          (stats.contentStats.loadedFiles / stats.contentStats.fileCount) *
            100,
        )
      : null;

  const heapPressure = stats.jsHeap
    ? stats.jsHeap.usedBytes / stats.jsHeap.limitBytes
    : 0;

  const latest = stats.history.at(-1);
  const heapTrend =
    stats.history.length >= 2
      ? stats.history.at(-1)!.heapMb - stats.history.at(-2)!.heapMb
      : 0;

  const summary = useMemo(
    () => ({
      heapBytes: stats.jsHeap?.usedBytes ?? 0,
      contentBytes: stats.contentStats?.bytes ?? 0,
      draftsBytes: stats.draftStats.bytes,
    }),
    [stats.contentStats?.bytes, stats.draftStats.bytes, stats.jsHeap?.usedBytes],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-ws-panel">
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-ws-border-subtle px-2">
        <GaugeIcon className="size-3.5 text-ws-accent-soft" strokeWidth={1.75} />
        <span className="text-[11px] font-medium text-ws-text">Performance</span>
        <span className="rounded bg-ws-accent/15 px-1.5 py-0.5 text-[9px] font-medium text-ws-accent-soft">
          Dev
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto h-6 px-2 text-[10px] text-ws-text-muted"
          onClick={() => setRefreshNonce((n) => n + 1)}
        >
          <RefreshCwIcon className="size-3" />
          Refresh
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-3 gap-2 p-2">
          <PerformanceMetricCard
            label="JS heap"
            value={
              stats.jsHeap ? formatBytes(stats.jsHeap.usedBytes) : "N/A"
            }
            hint={
              stats.jsHeap
                ? `${Math.round(heapPressure * 100)}% of limit`
                : "Chromium only"
            }
            accent={
              heapPressure > 0.85
                ? "warn"
                : heapPressure > 0
                  ? "default"
                  : undefined
            }
          />
          <PerformanceMetricCard
            label="File content"
            value={
              stats.contentStats
                ? formatBytes(stats.contentStats.bytes)
                : stats.contentsLoading
                  ? "Loading…"
                  : "…"
            }
            hint={
              contentProgress != null
                ? `${contentProgress}% loaded`
                : undefined
            }
          />
          <PerformanceMetricCard
            label="Open tabs"
            value={stats.editorStats.openTabs.toLocaleString()}
            hint={
              latest
                ? heapTrend >= 0
                  ? `Heap +${heapTrend.toFixed(1)} MB`
                  : `Heap ${heapTrend.toFixed(1)} MB`
                : `${stats.editorStats.fileTabs} file tabs`
            }
            accent={stats.webcontainer.ready ? "good" : "default"}
          />
        </div>

        <Section
          title="Memory timeline"
          icon={<ActivityIcon className="size-3" />}
        >
          <div className="px-2 pb-2">
            <PerformanceMemoryTimeline history={stats.history} />
          </div>
        </Section>

        <Section title="Current breakdown">
          <div className="px-2 pb-2">
            <PerformanceMemoryBreakdown
              heapBytes={summary.heapBytes}
              contentBytes={summary.contentBytes}
              draftsBytes={summary.draftsBytes}
            />
          </div>
        </Section>

        <Section title="Editor activity">
          <div className="px-2 pb-2">
            <PerformanceTabsTimeline history={stats.history} />
          </div>
        </Section>

        <Section title="Project">
          <StatRow
            label="Tree entries"
            value={
              stats.treeStats
                ? `${stats.treeStats.total.toLocaleString()} (${stats.treeStats.fileCount.toLocaleString()} files)`
                : "…"
            }
          />
          <StatRow
            label="Content load"
            value={
              stats.contentsLoading
                ? contentProgress != null
                  ? `${contentProgress}%`
                  : "Loading…"
                : stats.filesLoaded
                  ? "Complete"
                  : "…"
            }
          />
          <StatRow
            label="Edit drafts"
            value={`${stats.draftStats.count} / ${stats.draftStats.cap}`}
            hint={formatBytes(stats.draftStats.bytes)}
          />
        </Section>

        <Section title="WebContainer">
          <StatRow
            label="Status"
            value={stats.webcontainer.status}
            hint={
              stats.webcontainer.error ??
              (stats.webcontainer.ready ? "Ready" : undefined)
            }
          />
          <StatRow
            label="Needs install"
            value={stats.webcontainer.needsInstall ? "Yes" : "No"}
          />
        </Section>

        {stats.jsHeap ? (
          <Section title="Heap gauge">
            <div className="px-2.5 pb-3">
              <div className="mb-1 flex justify-between text-[10px] text-ws-text-muted">
                <span>{formatBytes(stats.jsHeap.usedBytes)} used</span>
                <span>{formatBytes(stats.jsHeap.limitBytes)} limit</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ws-hover">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width]",
                    heapPressure > 0.85
                      ? "bg-ws-danger-soft"
                      : "bg-ws-accent-soft",
                  )}
                  style={{
                    width: `${Math.min(100, heapPressure * 100).toFixed(1)}%`,
                  }}
                />
              </div>
            </div>
          </Section>
        ) : null}
      </div>
    </div>
  );
}
