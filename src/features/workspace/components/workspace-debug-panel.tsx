"use client";

import {
  BugIcon,
  CircleDotIcon,
  PlayIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useOptionalWebContainer } from "@/features/workspace/components/webcontainer-provider";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useProjectFile } from "@/features/workspace/hooks/use-project-files";
import {
  isDebuggableScriptPath,
  startDebugSession,
  stopDebugSession,
} from "@/features/workspace/lib/debug-session";
import {
  loadFileContentDraft,
  resolveSeedContent,
} from "@/features/workspace/lib/file-content-drafts";
import { useDebugStore } from "@/features/workspace/store/debug-store";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceDebugPanelProps = {
  projectId: string;
};

export function WorkspaceDebugPanel({ projectId }: WorkspaceDebugPanelProps) {
  const webcontainer = useOptionalWebContainer();
  const { openTab } = useEditorTabs(projectId);
  const setPendingEditorReveal = useWorkspaceStore(
    (s) => s.setPendingEditorReveal,
  );
  const currentFilePath = useWorkspaceStore((s) => s.currentFilePath);

  const breakpointsByPath = useDebugStore((s) => s.breakpointsByPath);
  const breakpoints = useMemo(() => {
    const list: { path: string; line: number }[] = [];
    for (const [path, lines] of Object.entries(breakpointsByPath)) {
      for (const line of lines) list.push({ path, line });
    }
    return list.sort(
      (a, b) => a.path.localeCompare(b.path) || a.line - b.line,
    );
  }, [breakpointsByPath]);
  const status = useDebugStore((s) => s.status);
  const output = useDebugStore((s) => s.output);
  const error = useDebugStore((s) => s.error);
  const exitCode = useDebugStore((s) => s.exitCode);
  const commandLine = useDebugStore((s) => s.commandLine);
  const removeBreakpoint = useDebugStore((s) => s.removeBreakpoint);
  const clearBreakpoints = useDebugStore((s) => s.clearBreakpoints);
  const clearOutput = useDebugStore((s) => s.clearOutput);
  const getBreakpointsForPath = useDebugStore((s) => s.getBreakpointsForPath);

  const activePath =
    currentFilePath && isDebuggableScriptPath(currentFilePath)
      ? currentFilePath
      : null;

  const file = useProjectFile(projectId, activePath ?? "");
  const source = useMemo(() => {
    if (!activePath || !file) return null;
    const draft = loadFileContentDraft(projectId, activePath);
    return resolveSeedContent(
      file.content ?? "",
      file.updatedAt ?? 0,
      draft,
    );
  }, [activePath, file, projectId]);

  const running = status === "running";
  const wcReady = Boolean(webcontainer?.ready) && !webcontainer?.needsInstall;

  const onRun = () => {
    if (!activePath || source == null) return;
    void startDebugSession({
      path: activePath,
      source,
      breakpoints: getBreakpointsForPath(activePath),
    });
  };

  const onOpenBreakpoint = (path: string, line: number) => {
    setPendingEditorReveal({ path, line, column: 1 });
    openTab({ kind: "file", path }, { mode: "preview" });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-ws-border-subtle px-2">
        <BugIcon className="size-3.5 text-ws-text-muted" strokeWidth={1.75} />
        <span className="text-[11px] font-medium text-ws-text">Debug</span>
        <span className="text-[10px] text-ws-text-muted">
          {status === "idle"
            ? "Idle"
            : status === "running"
              ? "Running"
              : status === "error"
                ? "Error"
                : exitCode != null
                  ? `Exited ${exitCode}`
                  : "Exited"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {running ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 gap-1 px-2 text-[10px]"
              onClick={() => stopDebugSession()}
            >
              <SquareIcon className="size-2.5" />
              Stop
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-6 gap-1 bg-ws-accent px-2 text-[10px] text-white hover:bg-ws-accent-hover"
              disabled={!activePath || source == null || !wcReady}
              onClick={onRun}
              title={
                !wcReady
                  ? "WebContainer not ready"
                  : !activePath
                    ? "Open a .js / .jsx / .ts / .tsx file"
                    : "Run with breakpoints"
              }
            >
              <PlayIcon className="size-2.5" />
              Run
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-ws-text-muted"
            onClick={() => clearOutput()}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(12rem,18rem)_1fr]">
        <div className="flex min-h-0 flex-col border-b border-ws-border-subtle md:border-r md:border-b-0">
          <div className="flex h-7 shrink-0 items-center gap-2 px-2.5 text-[10px] font-medium text-ws-text-muted">
            Breakpoints
            {breakpoints.length > 0 ? (
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1 text-ws-text-muted hover:text-ws-text"
                onClick={() => clearBreakpoints()}
                title="Clear all breakpoints"
              >
                <Trash2Icon className="size-3" />
                Clear
              </button>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {breakpoints.length === 0 ? (
              <p className="px-2.5 py-2 text-[11px] leading-relaxed text-ws-text-muted">
                Click the gutter left of a line number (or press{" "}
                <kbd className="rounded bg-ws-hover px-1">F9</kbd>) in a{" "}
                <code>.js</code> / <code>.jsx</code> / <code>.ts</code> /{" "}
                <code>.tsx</code> file. Then open DevTools (F12) and hit Run.
              </p>
            ) : (
              <ul>
                {breakpoints.map((bp) => (
                  <li key={`${bp.path}:${bp.line}`}>
                    <button
                      type="button"
                      onClick={() => onOpenBreakpoint(bp.path, bp.line)}
                      className="flex w-full items-center gap-2 px-2.5 py-1 text-left text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
                    >
                      <CircleDotIcon className="size-3 shrink-0 text-ws-danger-soft" />
                      <span className="min-w-0 flex-1 truncate">{bp.path}</span>
                      <span className="shrink-0 tabular-nums">:{bp.line}</span>
                      <span
                        role="button"
                        tabIndex={0}
                        className="shrink-0 text-[10px] hover:text-ws-danger-soft"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBreakpoint(bp.path, bp.line);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            removeBreakpoint(bp.path, bp.line);
                          }
                        }}
                      >
                        ×
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="flex h-7 shrink-0 items-center gap-2 px-2.5 text-[10px] font-medium text-ws-text-muted">
            Console
            {commandLine ? (
              <span className="min-w-0 truncate font-normal opacity-80">
                {commandLine}
              </span>
            ) : null}
          </div>
          <pre
            className={cn(
              "min-h-0 flex-1 overflow-auto px-2.5 py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary",
            )}
          >
            {error ? (
              <span className="text-ws-danger-soft">{error}\n</span>
            ) : null}
            {output || (
              <span className="text-ws-text-muted">
                {activePath
                  ? wcReady
                    ? `Ready to debug ${activePath}. Set breakpoints, open DevTools (F12), then Run.`
                    : "Waiting for WebContainer…"
                  : "Open a .js / .jsx / .ts / .tsx file to debug. For live Vite/React UI, you can also use Preview + browser DevTools."}
              </span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
