"use client";

import { useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { useOptionalPreviewServer } from "@/features/workspace/components/preview-server-provider";
import type { PreviewServerLog } from "@/features/workspace/hooks/use-preview-server";
import { cn } from "@/lib/utils";

type WorkspaceConsolePanelProps = {
  projectId: string;
};

export function WorkspaceConsolePanel(_props: WorkspaceConsolePanelProps) {
  const previewServer = useOptionalPreviewServer();
  const listRef = useRef<HTMLDivElement>(null);

  const hot = previewServer?.hot ?? false;
  const entries = useMemo(() => {
    if (!previewServer) return [];
    return [...previewServer.logs, ...previewServer.bridgeLogs]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-200);
  }, [previewServer]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  const errorCount = entries.filter((entry) => entry.level === "error").length;
  const warnCount = entries.filter((entry) => entry.level === "warn").length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-ws-panel">
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-ws-border-subtle px-3">
        <span className="text-[11px] font-medium text-ws-text">Console</span>
        <span className="tabular-nums text-[10px] text-ws-text-muted">
          {entries.length}
        </span>
        {hot ? (
          <span className="text-[10px] text-ws-text-muted">· server + preview</span>
        ) : null}
        {errorCount > 0 ? (
          <span className="rounded-full bg-ws-danger-bg px-1.5 text-[9px] text-white">
            {errorCount}
          </span>
        ) : null}
        {warnCount > 0 ? (
          <span className="rounded-full bg-amber-500 px-1.5 text-[9px] text-white">
            {warnCount}
          </span>
        ) : null}
        <div className="ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => previewServer?.clearLogs()}
            disabled={entries.length === 0}
            className="h-6 px-2 text-[10px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            Clear
          </Button>
        </div>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-auto px-3 py-2">
        {entries.length === 0 ? (
          <p className="px-1 py-3 text-[11px] text-ws-text-muted">
            {hot
              ? "No console output yet. Dev server logs and preview errors appear here."
              : "No console output yet. Logs from the preview appear here."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((entry) => (
              <ConsoleEntryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ConsoleEntryRow({ entry }: { entry: PreviewServerLog }) {
  return (
    <li
      className={cn(
        "whitespace-pre-wrap break-words font-mono text-[11px] leading-snug",
        entry.level === "error" && "text-ws-danger-soft",
        entry.level === "warn" && "text-amber-500",
        entry.level === "info" && "text-ws-link",
        entry.level === "log" && "text-ws-text-secondary",
      )}
    >
      <span className="mr-1.5 text-[10px] uppercase text-ws-text-muted">
        {entry.level}
      </span>
      {entry.message}
    </li>
  );
}
