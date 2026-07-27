"use client";

import {
  ExternalLinkIcon,
  GlobeIcon,
  Maximize2Icon,
  MonitorIcon,
  RefreshCwIcon,
  RotateCwIcon,
  SmartphoneIcon,
  TabletIcon,
  TerminalIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { reloadPreview } from "@webcontainer/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOptionalPreviewServer } from "@/features/workspace/components/preview-server-provider";
import { useOptionalWebContainer } from "@/features/workspace/components/webcontainer-provider";
import {
  useProjectFile,
  useProjectFileMetadata,
  useProjectAllFileContents,
} from "@/features/workspace/hooks/use-project-files";
import {
  getPreviewDevice,
  PREVIEW_DEVICES,
  type PreviewDeviceId,
} from "@/features/workspace/lib/preview-devices";
import {
  isPreviewBridgeMessage,
} from "@/features/workspace/lib/preview-runtime-bridge";
import {
  isPreviewableFile,
} from "@/features/workspace/lib/preview-utils";
import { detectPreviewHost } from "@/features/workspace/lib/preview-host";
import { loadFileContentDraft } from "@/features/workspace/lib/file-content-drafts";
import {
  packageJsonHasRiskyNext,
  rewriteWebContainerNextError,
  WEBCONTAINER_NEXT_VERSION,
} from "@/features/workspace/lib/webcontainer/next-compat";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspacePreviewPanelProps = {
  /** Unsaved buffer for the currently open file, merged into the project build. */
  code?: string;
  filePath?: string;
  projectId: string;
  /** False when the Code tab is showing — skip esbuild work; keep HMR iframe alive. */
  active?: boolean;
};

type PreviewError = {
  source: "build" | "runtime" | "network";
  message: string;
  stack?: string;
  /** Product-level hint (e.g. WebContainer Next.js limit). */
  kind?: "next-webcontainer";
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
  active = true,
}: WorkspacePreviewPanelProps) {
  const metadata = useProjectFileMetadata(projectId);
  const packageJsonDoc = useProjectFile(projectId, "package.json");
  const previewServer = useOptionalPreviewServer();
  const webcontainer = useOptionalWebContainer();

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deviceId, setDeviceId] = useState<PreviewDeviceId>("responsive");
  const [rotated, setRotated] = useState(false);
  const [urlPath, setUrlPath] = useState("/");
  const [urlDraft, setUrlDraft] = useState("/");
  const previewUrlPath = useWorkspaceStore((s) => s.previewUrlPath);
  const setPreviewUrlPath = useWorkspaceStore((s) => s.setPreviewUrlPath);
  const setFollowingUserId = useWorkspaceStore((s) => s.setFollowingUserId);
  const showConsolePanel = useWorkspaceStore((s) => s.showConsolePanel);

  useEffect(() => {
    if (previewUrlPath !== urlPath) {
      setUrlPath(previewUrlPath);
      setUrlDraft(previewUrlPath);
    }
  }, [previewUrlPath, urlPath]);

  const commitPreviewPath = (next: string) => {
    const normalized = normalizePreviewPath(next);
    setUrlPath(normalized);
    setUrlDraft(normalized);
    setPreviewUrlPath(normalized);
    setFollowingUserId(null);
  };
  const [previewError, setPreviewError] = useState<PreviewError | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const requestIdRef = useRef(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastWrittenRef = useRef<{ path: string; content: string } | null>(
    null,
  );
  const lastPreviewErrorIdRef = useRef<string | null>(null);

  const hot = previewServer?.hot ?? false;
  const serverUrl = previewServer?.url ?? null;
  const serverStatus = previewServer?.status ?? "idle";
  const serverError = previewServer?.error ?? null;
  const useHotReload = hot && serverUrl != null;

  const filePaths = (metadata ?? [])
    .filter((file) => file.kind === "file")
    .map((file) => file.path);

  const packageJson = useMemo(() => {
    if (!packageJsonDoc || packageJsonDoc.kind !== "file") return null;
    const draft = loadFileContentDraft(projectId, "package.json");
    if (draft && draft.updatedAt >= (packageJsonDoc.updatedAt ?? 0)) {
      return draft.content;
    }
    return packageJsonDoc.content ?? null;
  }, [packageJsonDoc, projectId]);

  const hostMode = useMemo(
    () => detectPreviewHost({ packageJson, paths: filePaths }),
    [filePaths, packageJson],
  );
  const requiresWebContainer = hostMode === "webcontainer";
  const needsEsbuildFiles =
    active && hostMode === "esbuild" && !(hot && serverUrl);
  const { files: projectFiles } = useProjectAllFileContents(
    projectId,
    needsEsbuildFiles,
  );

  const canPreviewFile = filePath ? isPreviewableFile(filePath) : false;
  const canPreview =
    hostMode === "webcontainer" ||
    hostMode === "esbuild" ||
    (hostMode === "none" && canPreviewFile);

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

  const consoleEntries = useMemo(
    () => [...(previewServer?.logs ?? []), ...(previewServer?.bridgeLogs ?? [])],
    [previewServer?.bridgeLogs, previewServer?.logs],
  );
  const displayWarnCount = consoleEntries.filter((e) => e.level === "warn").length;
  const displayErrorCount =
    consoleEntries.filter((e) => e.level === "error").length +
    (previewError && !errorDismissed ? 1 : 0);

  const iframeSrc = useMemo(() => {
    if (!useHotReload || !serverUrl) return null;
    try {
      const base = new URL(serverUrl);
      const path = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
      base.pathname = path;
      base.search = "";
      base.hash = "";
      return base.toString();
    } catch {
      return serverUrl;
    }
  }, [serverUrl, urlPath, useHotReload]);

  // Live-write the open buffer into WebContainer so Vite/HMR sees edits.
  useEffect(() => {
    if (!filePath || code === undefined) return;
    if (!webcontainer?.ready) return;

    const last = lastWrittenRef.current;
    if (last && last.path === filePath && last.content === code) return;

    const timer = window.setTimeout(() => {
      lastWrittenRef.current = { path: filePath, content: code };
      void webcontainer.writeFile(filePath, code);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [code, filePath, webcontainer]);

  // Surface preview / server errors in the overlay (rewrite known WC Next crashes).
  useEffect(() => {
    if (!previewServer?.logs.length) return;
    const lastError = [...previewServer.logs]
      .reverse()
      .find((l) => {
        if (l.level !== "error") return false;
        if (l.source === "preview") return true;
        return rewriteWebContainerNextError(l.message) != null;
      });
    if (!lastError || lastError.id === lastPreviewErrorIdRef.current) return;
    lastPreviewErrorIdRef.current = lastError.id;
    const rewritten = rewriteWebContainerNextError(lastError.message, {
      packageJson,
      packageManager: webcontainer?.packageManager ?? "npm",
    });
    setPreviewError({
      source: "runtime",
      message: rewritten ?? lastError.message,
      kind: rewritten ? "next-webcontainer" : undefined,
    });
    setErrorDismissed(false);
  }, [
    packageJson,
    previewServer?.logs,
    webcontainer?.packageManager,
  ]);

  // Surface server start failures as overlay errors.
  useEffect(() => {
    if (serverStatus === "error" && serverError) {
      const rewritten = rewriteWebContainerNextError(serverError, {
        packageJson,
        packageManager: webcontainer?.packageManager ?? "npm",
      });
      setPreviewError({
        source: "build",
        message: rewritten ?? serverError,
        kind: rewritten ? "next-webcontainer" : undefined,
      });
      setErrorDismissed(false);
    }
  }, [
    packageJson,
    serverError,
    serverStatus,
    webcontainer?.packageManager,
  ]);

  // Esbuild fallback — only for static / simple projects, never for Vite/Next.
  useEffect(() => {
    if (useHotReload) {
      setPreviewHtml(null);
      setLoading(false);
      return;
    }

    if (!active) return;

    if (requiresWebContainer) {
      setPreviewHtml(null);
      if (
        serverStatus === "starting" ||
        serverStatus === "idle" ||
        webcontainer?.needsInstall
      ) {
        setLoading(true);
      } else {
        setLoading(false);
      }
      return;
    }

    if (serverStatus === "starting") {
      setLoading(true);
      setPreviewHtml(null);
      return;
    }

    if (!canPreview || (needsEsbuildFiles && projectFiles === undefined)) {
      setPreviewHtml(null);
      setPreviewError(null);
      return;
    }

    const files: Record<string, string> = {};
    for (const file of projectFiles ?? []) {
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
  }, [
    active,
    canPreview,
    code,
    filePath,
    projectFiles,
    refreshKey,
    requiresWebContainer,
    serverStatus,
    useHotReload,
    webcontainer?.needsInstall,
  ]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isPreviewBridgeMessage(event.data)) return;
      if (event.data.type !== "runtime-error") return;

      const raw = event.data.stack
        ? `${event.data.message}\n${event.data.stack}`
        : event.data.message;
      const rewritten = rewriteWebContainerNextError(raw, {
        packageJson,
        packageManager: webcontainer?.packageManager ?? "npm",
      });
      setPreviewError({
        source: "runtime",
        message: rewritten ?? event.data.message,
        stack: rewritten ? undefined : event.data.stack,
        kind: rewritten ? "next-webcontainer" : undefined,
      });
      setErrorDismissed(false);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [packageJson, webcontainer?.packageManager]);

  const showRiskyNextBanner =
    useHotReload &&
    packageJsonHasRiskyNext(packageJson) &&
    !(previewError?.kind === "next-webcontainer" && !errorDismissed);

  const onSubmitUrl = (event: React.FormEvent) => {
    event.preventDefault();
    commitPreviewPath(urlDraft);
    if (!useHotReload) {
      setRefreshKey((value) => value + 1);
    }
  };

  const onRefresh = () => {
    if (useHotReload && iframeRef.current) {
      void reloadPreview(iframeRef.current).catch(() => {
        setRefreshKey((value) => value + 1);
      });
      return;
    }
    if (useHotReload) {
      previewServer?.restart();
      return;
    }
    setRefreshKey((value) => value + 1);
  };

  const showErrorOverlay = previewError != null && !errorDismissed;
  const isStarting =
    !useHotReload &&
    (serverStatus === "starting" ||
      (requiresWebContainer &&
        (serverStatus === "idle" || Boolean(webcontainer?.needsInstall))));
  const showLoading =
    (useHotReload && !iframeSrc) ||
    isStarting ||
    (!useHotReload && !requiresWebContainer && loading && !previewHtml);

  const wcWaitingMessage = webcontainer?.needsInstall
    ? "Installing dependencies…"
    : previewServer?.commandLine
      ? `Starting \`${previewServer.commandLine}\`…`
      : serverStatus === "unavailable" && requiresWebContainer
        ? webcontainer?.error
          ? `WebContainer unavailable — ${webcontainer.error}`
          : "WebContainer preview unavailable. Open Terminal and run install, then refresh."
        : "Starting preview server…";

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

  if (metadata === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-[13px] text-ws-text-muted">
        Loading project…
      </div>
    );
  }

  if (needsEsbuildFiles && projectFiles === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-[13px] text-ws-text-muted">
        Loading preview files…
      </div>
    );
  }

  if (!canPreview && !useHotReload && serverStatus !== "starting") {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-ws-text-muted">
        {hostMode === "none" ? (
          <span>
            This project has no HTTP preview. Use the Terminal for Node scripts,
            or add a Vite / Next.js app to preview in the browser.
          </span>
        ) : (
          <span>
            Add an <code className="mx-1">index.html</code> or a Vite / Next.js
            app to preview this project.
          </span>
        )}
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
            onBlur={() => commitPreviewPath(urlDraft)}
            spellCheck={false}
            aria-label="Preview URL"
            className="h-6 border-ws-border-subtle bg-ws-bg px-2 font-mono text-[11px] text-ws-text-secondary shadow-none focus-visible:ring-ws-accent"
          />
        </form>

        {useHotReload ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
            title={
              previewServer?.commandLine
                ? `Hot reload · ${previewServer.commandLine}`
                : "Hot reload via WebContainer"
            }
          >
            <ZapIcon className="size-3" strokeWidth={2} />
            HMR
            {previewServer?.port != null ? ` :${previewServer.port}` : ""}
          </span>
        ) : serverStatus === "starting" ? (
          <span className="shrink-0 text-[10px] text-ws-text-muted">
            Starting…
          </span>
        ) : null}

        {useHotReload && iframeSrc ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Open preview in new tab"
            aria-label="Open preview in new tab"
            onClick={() => window.open(iframeSrc, "_blank", "noopener,noreferrer")}
            className="size-7 shrink-0 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <ExternalLinkIcon className="size-3.5" strokeWidth={1.75} />
          </Button>
        ) : null}

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
          title="Open console"
          aria-label="Open console"
          onClick={() => showConsolePanel()}
          className="relative size-7 shrink-0 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <TerminalIcon className="size-3.5" strokeWidth={1.75} />
          {displayErrorCount + displayWarnCount > 0 ? (
            <span
              className={cn(
                "absolute top-0.5 right-0.5 size-1.5 rounded-full",
                displayErrorCount > 0 ? "bg-ws-danger-bg" : "bg-amber-500",
              )}
            />
          ) : null}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh preview"
          disabled={showLoading && !useHotReload}
          onClick={onRefresh}
          className="size-7 shrink-0 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <RefreshCwIcon
            className={cn("size-3.5", showLoading && "animate-spin")}
          />
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {showRiskyNextBanner ? (
          <div
            role="status"
            className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-ws-text"
          >
            <span className="font-medium text-amber-800 dark:text-amber-300">
              Next.js 15.5+ / 16 may crash this preview.
            </span>{" "}
            WebContainer cannot run those versions yet. Pin{" "}
            <code className="rounded bg-ws-bg px-1 py-0.5 font-mono text-[10px]">
              next@{WEBCONTAINER_NEXT_VERSION}
            </code>{" "}
            in the terminal for a working preview.
          </div>
        ) : null}
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
            {useHotReload && iframeSrc ? (
              <iframe
                key={`${refreshKey}:${iframeSrc}`}
                ref={iframeRef}
                title="Project preview"
                src={iframeSrc}
                allow="cross-origin-isolated"
                className="h-full w-full border-0 bg-white"
              />
            ) : previewHtml ? (
              <iframe
                key={`${refreshKey}:${urlPath}`}
                title="Project preview"
                srcDoc={previewHtml}
                sandbox="allow-scripts allow-same-origin"
                className="h-full w-full border-0 bg-white"
              />
            ) : showLoading ? (
              <div className="flex h-full min-h-40 items-center justify-center px-6 text-center text-[13px] text-ws-text-muted">
                {requiresWebContainer || serverStatus === "starting"
                  ? wcWaitingMessage
                  : "Building preview…"}
              </div>
            ) : requiresWebContainer && !useHotReload ? (
              <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 px-6 text-center text-[13px] text-ws-text-muted">
                <p>
                  {serverError ??
                    "Waiting for WebContainer preview (Vite / Next.js)."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 h-7 text-[11px]"
                  onClick={() => previewServer?.restart()}
                >
                  Restart preview
                </Button>
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
                onRefresh={onRefresh}
              />
            ) : null}
          </div>
        </div>
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
    error.kind === "next-webcontainer"
      ? "Preview runtime limit"
      : error.source === "build"
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
