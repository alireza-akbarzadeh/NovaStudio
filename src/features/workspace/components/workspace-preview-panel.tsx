"use client";

import {
  ChevronDownIcon,
  GlobeIcon,
  Maximize2Icon,
  MonitorIcon,
  RefreshCwIcon,
  RotateCwIcon,
  SmartphoneIcon,
  TabletIcon,
  TerminalIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectFiles } from "@/features/workspace/hooks/use-project-files";
import {
  getPreviewDevice,
  PREVIEW_DEVICES,
  type PreviewDeviceId,
} from "@/features/workspace/lib/preview-devices";
import {
  isPreviewBridgeMessage,
  type PreviewConsoleLevel,
} from "@/features/workspace/lib/preview-runtime-bridge";
import {
  isPreviewableFile,
  isProjectPreviewable,
} from "@/features/workspace/lib/preview-utils";
import { cn } from "@/lib/utils";

type WorkspacePreviewPanelProps = {
  /** Unsaved buffer for the currently open file, merged into the project build. */
  code?: string;
  filePath?: string;
  projectId: string;
};

type ConsoleEntry = {
  id: string;
  level: PreviewConsoleLevel;
  message: string;
  timestamp: number;
};

type PreviewError = {
  source: "build" | "runtime" | "network";
  message: string;
  stack?: string;
};

const DEVICE_ICONS: Record<
  PreviewDeviceId,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  responsive: Maximize2Icon,
  mobile: SmartphoneIcon,
  tablet: TabletIcon,
  desktop: MonitorIcon,
};

export function WorkspacePreviewPanel({
  code,
  filePath,
  projectId,
}: WorkspacePreviewPanelProps) {
  const projectFiles = useProjectFiles(projectId);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deviceId, setDeviceId] = useState<PreviewDeviceId>("responsive");
  const [rotated, setRotated] = useState(false);
  const [urlPath, setUrlPath] = useState("/");
  const [urlDraft, setUrlDraft] = useState("/");
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [previewError, setPreviewError] = useState<PreviewError | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const requestIdRef = useRef(0);

  const filePaths = (projectFiles ?? [])
    .filter((file) => file.kind === "file")
    .map((file) => file.path);
  const canPreviewProject = isProjectPreviewable(filePaths);
  const canPreviewFile = filePath ? isPreviewableFile(filePath) : false;
  const canPreview = canPreviewProject || canPreviewFile;

  const device = getPreviewDevice(deviceId);
  const frameWidth =
    device.width == null
      ? null
      : rotated
        ? device.height
        : device.width;
  const frameHeight =
    device.height == null
      ? null
      : rotated
        ? device.width
        : device.height;

  const warnCount = consoleEntries.filter((e) => e.level === "warn").length;
  const errorCount =
    consoleEntries.filter((e) => e.level === "error").length +
    (previewError && !errorDismissed ? 1 : 0);

  useEffect(() => {
    if (!canPreview || projectFiles === undefined) {
      setPreviewHtml(null);
      setPreviewError(null);
      return;
    }

    const files: Record<string, string> = {};
    for (const file of projectFiles) {
      if (file.kind !== "file") continue;
      files[file.path] = file.content ?? "";
    }

    if (filePath && code !== undefined) {
      files[filePath] = code;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setPreviewError(null);
    setErrorDismissed(false);
    setConsoleEntries([]);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              files,
              activePath: filePath,
            }),
          });

          if (requestId !== requestIdRef.current) return;

          if (!response.ok) {
            let message = "Could not render preview";
            try {
              const data = (await response.json()) as { error?: string };
              if (data.error) message = data.error;
            } catch {
              // keep default
            }
            setPreviewError({
              source: response.status === 422 ? "build" : "network",
              message,
            });
            setPreviewHtml(null);
            return;
          }

          const html = await response.text();
          if (requestId !== requestIdRef.current) return;
          setPreviewHtml(html);
          setPreviewError(null);
        } catch {
          if (requestId !== requestIdRef.current) return;
          setPreviewError({
            source: "network",
            message: "Could not render preview",
          });
          setPreviewHtml(null);
        } finally {
          if (requestId === requestIdRef.current) {
            setLoading(false);
          }
        }
      })();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [canPreview, code, filePath, projectFiles, refreshKey]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isPreviewBridgeMessage(event.data)) return;

      if (event.data.type === "console") {
        const entry: ConsoleEntry = {
          id: `${event.data.timestamp}-${event.data.level}-${Math.random().toString(36).slice(2, 7)}`,
          level: event.data.level,
          message: event.data.message,
          timestamp: event.data.timestamp,
        };
        setConsoleEntries((prev) => [...prev.slice(-199), entry]);
        return;
      }

      if (event.data.type === "runtime-error") {
        setPreviewError({
          source: "runtime",
          message: event.data.message,
          stack: event.data.stack,
        });
        setErrorDismissed(false);
        setConsoleEntries((prev) => [
          ...prev.slice(-199),
          {
            id: `${event.data.timestamp}-error-${Math.random().toString(36).slice(2, 7)}`,
            level: "error",
            message: event.data.stack
              ? `${event.data.message}\n${event.data.stack}`
              : event.data.message,
            timestamp: event.data.timestamp,
          },
        ]);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const onSubmitUrl = (event: React.FormEvent) => {
    event.preventDefault();
    const next = normalizePreviewPath(urlDraft);
    setUrlPath(next);
    setUrlDraft(next);
    setRefreshKey((value) => value + 1);
  };

  const showErrorOverlay = previewError != null && !errorDismissed;

  const frameStyle = useMemo(() => {
    if (frameWidth == null || frameHeight == null) {
      return { width: "100%", height: "100%" } as const;
    }
    return {
      width: frameWidth,
      height: frameHeight,
      maxWidth: "100%",
      maxHeight: "100%",
    } as const;
  }, [frameHeight, frameWidth]);

  if (projectFiles === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-[13px] text-ws-text-muted">
        Loading project…
      </div>
    );
  }

  if (!canPreview) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-[13px] text-ws-text-muted">
        Add an <code className="mx-1">index.html</code>,{" "}
        <code className="mx-1">src/main.tsx</code>, or{" "}
        <code className="mx-1">src/app/page.tsx</code> to preview this project.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-ws-bg">
      <div className="flex h-8 shrink-0 items-center gap-1 border-b border-ws-border-subtle bg-ws-panel px-2">
        <GlobeIcon className="size-3.5 shrink-0 text-ws-text-muted" />
        <form onSubmit={onSubmitUrl} className="min-w-0 flex-1">
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onBlur={() => setUrlDraft(normalizePreviewPath(urlDraft))}
            spellCheck={false}
            aria-label="Preview URL"
            className="h-6 border-ws-border-subtle bg-ws-bg px-2 font-mono text-[11px] text-ws-text-secondary shadow-none focus-visible:ring-ws-accent"
          />
        </form>

        <div className="flex shrink-0 items-center gap-0.5 border-l border-ws-border-subtle pl-1">
          {PREVIEW_DEVICES.map((item) => {
            const Icon = DEVICE_ICONS[item.id];
            const active = deviceId === item.id;
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                size="icon-sm"
                title={item.label}
                aria-label={item.label}
                aria-pressed={active}
                onClick={() => {
                  setDeviceId(item.id);
                  if (item.id === "responsive") setRotated(false);
                }}
                className={cn(
                  "size-7 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                  active && "bg-ws-hover text-ws-text",
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
              </Button>
            );
          })}
          {deviceId === "mobile" || deviceId === "tablet" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={rotated ? "Portrait" : "Landscape"}
              aria-label={rotated ? "Switch to portrait" : "Switch to landscape"}
              aria-pressed={rotated}
              onClick={() => setRotated((value) => !value)}
              className={cn(
                "size-7 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                rotated && "bg-ws-hover text-ws-text",
              )}
            >
              <RotateCwIcon className="size-3.5" strokeWidth={1.75} />
            </Button>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Toggle console"
          aria-label="Toggle console"
          aria-pressed={consoleOpen}
          onClick={() => setConsoleOpen((value) => !value)}
          className={cn(
            "relative size-7 shrink-0 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
            consoleOpen && "bg-ws-hover text-ws-text",
          )}
        >
          <TerminalIcon className="size-3.5" strokeWidth={1.75} />
          {errorCount + warnCount > 0 ? (
            <span
              className={cn(
                "absolute top-0.5 right-0.5 size-1.5 rounded-full",
                errorCount > 0 ? "bg-ws-danger-bg" : "bg-amber-500",
              )}
            />
          ) : null}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh preview"
          disabled={loading}
          onClick={() => setRefreshKey((value) => value + 1)}
          className="size-7 shrink-0 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <RefreshCwIcon className={cn("size-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className={cn(
            "relative min-h-0 flex-1 overflow-auto",
            frameWidth == null
              ? "bg-white"
              : "flex items-start justify-center bg-ws-panel/80 p-3",
          )}
        >
          <div
            className={cn(
              "relative overflow-hidden bg-white",
              frameWidth != null &&
                "shrink-0 rounded-md border border-ws-border-strong shadow-sm",
            )}
            style={frameStyle}
          >
            {previewHtml ? (
              <iframe
                key={`${refreshKey}:${urlPath}`}
                title="Project preview"
                srcDoc={previewHtml}
                sandbox="allow-scripts allow-same-origin"
                className="h-full w-full border-0 bg-white"
              />
            ) : loading ? (
              <div className="flex h-full min-h-40 items-center justify-center text-[13px] text-ws-text-muted">
                Building preview…
              </div>
            ) : (
              <div className="flex h-full min-h-40 items-center justify-center p-6 text-[13px] text-ws-text-muted">
                Preview unavailable
              </div>
            )}

            {showErrorOverlay ? (
              <PreviewErrorOverlay
                error={previewError}
                onDismiss={() => setErrorDismissed(true)}
                onRefresh={() => setRefreshKey((value) => value + 1)}
              />
            ) : null}
          </div>
        </div>

        {consoleOpen ? (
          <PreviewConsolePanel
            entries={consoleEntries}
            onClear={() => setConsoleEntries([])}
            onClose={() => setConsoleOpen(false)}
          />
        ) : null}
      </div>
    </div>
  );
}

function normalizePreviewPath(value: string): string {
  const trimmed = value.trim() || "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function PreviewErrorOverlay({
  error,
  onDismiss,
  onRefresh,
}: {
  error: PreviewError;
  onDismiss: () => void;
  onRefresh: () => void;
}) {
  const title =
    error.source === "build"
      ? "Build error"
      : error.source === "runtime"
        ? "Runtime error"
        : "Preview error";

  return (
    <div className="absolute inset-0 z-10 flex items-start justify-center overflow-auto bg-black/40 p-4 backdrop-blur-[1px]">
      <div
        role="alert"
        className="w-full max-w-lg rounded-md border border-ws-danger bg-ws-danger-surface p-3 shadow-lg"
      >
        <div className="mb-2 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-ws-danger-soft">
              {title}
            </p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ws-text">
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss error"
            onClick={onDismiss}
            className="size-6 shrink-0 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onRefresh}
            className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
          >
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-7 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

function PreviewConsolePanel({
  entries,
  onClear,
  onClose,
}: {
  entries: ConsoleEntry[];
  onClear: () => void;
  onClose: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <div className="flex max-h-44 shrink-0 flex-col border-t border-ws-border-subtle bg-ws-panel">
      <div className="flex h-7 shrink-0 items-center gap-2 border-b border-ws-border-subtle px-2">
        <ChevronDownIcon className="size-3 text-ws-text-muted" />
        <span className="text-[11px] font-medium text-ws-text">Console</span>
        <span className="tabular-nums text-[10px] text-ws-text-muted">
          {entries.length}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={entries.length === 0}
            className="h-6 px-1.5 text-[10px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close console"
            onClick={onClose}
            className="size-6 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      </div>
      <div ref={listRef} className="min-h-0 flex-1 overflow-auto px-2 py-1">
        {entries.length === 0 ? (
          <p className="px-1 py-3 text-[11px] text-ws-text-muted">
            No console output yet. Logs from the preview appear here.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  "whitespace-pre-wrap break-words font-mono text-[11px] leading-snug",
                  entry.level === "error" && "text-ws-danger-soft",
                  entry.level === "warn" && "text-amber-500",
                  entry.level === "info" && "text-ws-link",
                  (entry.level === "log") && "text-ws-text-secondary",
                )}
              >
                <span className="mr-1.5 text-[10px] uppercase text-ws-text-muted">
                  {entry.level}
                </span>
                {entry.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
