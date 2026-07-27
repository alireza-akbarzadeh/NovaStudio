"use client";

import {
  PreviewMessageType,
  type PreviewMessage,
  type WebContainerProcess,
} from "@webcontainer/api";
import { useCallback, useEffect, useRef, useState } from "react";

import { useOptionalWebContainer } from "@/features/workspace/components/webcontainer-provider";
import { useProjectFile, useProjectFileMetadata } from "@/features/workspace/hooks/use-project-files";
import { loadFileContentDraft } from "@/features/workspace/lib/file-content-drafts";
import {
  isPreviewBridgeMessage,
  type PreviewConsoleLevel,
} from "@/features/workspace/lib/preview-runtime-bridge";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { getWebContainer } from "@/features/workspace/lib/webcontainer/boot";
import {
  hasNodeModules,
} from "@/features/workspace/lib/webcontainer/sync";
import {
  buildDevServerCommand,
  detectDevScript,
  inferServerLogLevel,
  injectPreviewBridge,
  spawnDevServer,
  stripAnsi,
  type DevServerCommand,
} from "@/features/workspace/lib/webcontainer/dev-server";

export type PreviewServerStatus =
  | "idle"
  | "starting"
  | "ready"
  | "error"
  | "unavailable";

export type PreviewServerLog = {
  id: string;
  level: PreviewConsoleLevel;
  message: string;
  timestamp: number;
  source: "server" | "preview";
};

export type UsePreviewServerResult = {
  status: PreviewServerStatus;
  url: string | null;
  port: number | null;
  error: string | null;
  commandLine: string | null;
  logs: PreviewServerLog[];
  /** Console output forwarded from the preview iframe bridge. */
  bridgeLogs: PreviewServerLog[];
  /** True when WC-backed hot reload is active. */
  hot: boolean;
  restart: () => void;
  clearLogs: () => void;
  /** Consume a WC preview-message (errors forwarded from the iframe). */
  pushPreviewMessage: (message: PreviewMessage) => void;
};

const MAX_LOGS = 200;
/** Give Vite/Next time to install-compile before failing the preview. */
const SERVER_READY_TIMEOUT_MS = 90_000;

function logId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Auto-starts `npm run dev` (or detected script) inside WebContainer once
 * dependencies are installed. Falls back to "unavailable" when there is no
 * suitable script — the preview panel then uses the esbuild path.
 */
export function usePreviewServer(projectId: string): UsePreviewServerResult {
  const webcontainer = useOptionalWebContainer();
  const metadata = useProjectFileMetadata(projectId);
  const packageJsonDoc = useProjectFile(projectId, "package.json");
  const editorPanelView = useWorkspaceStore((s) => s.editorPanelView);
  const previewWanted = editorPanelView === "preview";

  const [status, setStatus] = useState<PreviewServerStatus>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [port, setPort] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commandLine, setCommandLine] = useState<string | null>(null);
  const [logs, setLogs] = useState<PreviewServerLog[]>([]);
  const [bridgeLogs, setBridgeLogs] = useState<PreviewServerLog[]>([]);
  const [restartKey, setRestartKey] = useState(0);

  const processRef = useRef<WebContainerProcess | null>(null);
  const commandRef = useRef<DevServerCommand | null>(null);
  const outputBufferRef = useRef("");
  const startedForRef = useRef<string | null>(null);
  const becameReadyRef = useRef(false);

  const ready = webcontainer?.ready ?? false;
  const needsInstall = webcontainer?.needsInstall ?? false;
  const packageManager = webcontainer?.packageManager ?? "npm";
  const wcError = webcontainer?.error ?? null;
  const wcStatus = webcontainer?.status;

  const appendLog = useCallback(
    (
      level: PreviewConsoleLevel,
      message: string,
      source: PreviewServerLog["source"] = "server",
    ) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      setLogs((prev) => [
        ...prev.slice(-(MAX_LOGS - 1)),
        {
          id: logId(),
          level,
          message: trimmed,
          timestamp: Date.now(),
          source,
        },
      ]);
    },
    [],
  );

  const pushPreviewMessage = useCallback(
    (message: PreviewMessage) => {
      if (message.type === PreviewMessageType.ConsoleError) {
        const text = Array.isArray(message.args)
          ? message.args.map(String).join(" ")
          : "console.error";
        appendLog(
          "error",
          message.stack ? `${text}\n${message.stack}` : text,
          "preview",
        );
        return;
      }

      appendLog(
        "error",
        message.stack
          ? `${message.message}\n${message.stack}`
          : message.message,
        "preview",
      );
    },
    [appendLog],
  );

  const appendBridgeLog = useCallback(
    (level: PreviewConsoleLevel, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      setBridgeLogs((prev) => [
        ...prev.slice(-(MAX_LOGS - 1)),
        {
          id: logId(),
          level,
          message: trimmed,
          timestamp: Date.now(),
          source: "preview" as const,
        },
      ]);
    },
    [],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
    setBridgeLogs([]);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isPreviewBridgeMessage(event.data)) return;

      if (event.data.type === "console") {
        appendBridgeLog(event.data.level, event.data.message);
        return;
      }

      const raw = event.data.stack
        ? `${event.data.message}\n${event.data.stack}`
        : event.data.message;
      appendBridgeLog("error", raw);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [appendBridgeLog]);

  const restart = useCallback(() => {
    setRestartKey((k) => k + 1);
  }, []);

  const flushOutputLines = useCallback(
    (chunk: string) => {
      outputBufferRef.current += chunk;
      const parts = outputBufferRef.current.split("\n");
      outputBufferRef.current = parts.pop() ?? "";
      for (const raw of parts) {
        const line = stripAnsi(raw);
        if (!line.trim()) continue;
        appendLog(inferServerLogLevel(line), line, "server");
      }
    },
    [appendLog],
  );

  // Resolve package.json (+ drafts) → decide whether a WC preview is possible
  const packageJson = (() => {
    if (!packageJsonDoc || packageJsonDoc.kind !== "file") return null;
    const draft = loadFileContentDraft(projectId, "package.json");
    if (draft && draft.updatedAt >= (packageJsonDoc.updatedAt ?? 0)) {
      return draft.content;
    }
    return packageJsonDoc.content ?? null;
  })();

  const scriptName = packageJson ? detectDevScript(packageJson) : null;

  const filesReady = metadata !== undefined;

  // Lifecycle: start / stop the preview server
  useEffect(() => {
    let cancelled = false;
    const unsubs: Array<() => void> = [];

    async function stopProcess() {
      const proc = processRef.current;
      processRef.current = null;
      if (proc) {
        try {
          proc.kill();
        } catch {
          // already dead
        }
      }
    }

    async function start() {
      if (!previewWanted) {
        setStatus("idle");
        setError(null);
        setUrl(null);
        setPort(null);
        setCommandLine(null);
        await stopProcess();
        return;
      }

      if (wcStatus === "error" || wcError) {
        setStatus("unavailable");
        setError(wcError);
        setUrl(null);
        setPort(null);
        return;
      }

      if (!filesReady) {
        setStatus("idle");
        return;
      }

      if (!scriptName) {
        setStatus("unavailable");
        setCommandLine(null);
        setUrl(null);
        setPort(null);
        setError(null);
        await stopProcess();
        return;
      }

      if (!webcontainer) {
        setStatus("unavailable");
        return;
      }

      try {
        await webcontainer.ensureReady();
      } catch (err) {
        setStatus("unavailable");
        setError(
          err instanceof Error ? err.message : "WebContainer failed to start",
        );
        return;
      }

      const wcAfterBoot = getWebContainer();
      if (!wcAfterBoot) {
        setStatus("unavailable");
        return;
      }

      const hasPkg = Boolean(packageJson);
      const installed = hasPkg ? await hasNodeModules(wcAfterBoot) : true;
      if (cancelled) return;

      if (hasPkg && !installed) {
        setStatus("starting");
        setError(null);
        setUrl(null);
        setPort(null);
        setCommandLine(null);
        return;
      }

      const wc = wcAfterBoot;

      const command = buildDevServerCommand(
        packageManager,
        scriptName,
        packageJson,
      );
      commandRef.current = command;
      setCommandLine(command.commandLine);
      setStatus("starting");
      setError(null);
      setUrl(null);
      setPort(null);
      outputBufferRef.current = "";
      startedForRef.current = projectId;
      becameReadyRef.current = false;

      await stopProcess();
      if (cancelled) return;

      try {
        await injectPreviewBridge(wc);
      } catch {
        // Non-fatal — preview-message + server logs still work.
      }
      if (cancelled) return;

      const onServerReady = (readyPort: number, readyUrl: string) => {
        if (cancelled) return;
        becameReadyRef.current = true;
        setPort(readyPort);
        setUrl(readyUrl);
        setStatus("ready");
        setError(null);
        appendLog(
          "info",
          `Preview server ready on port ${readyPort}`,
          "server",
        );
      };

      const onPort = (
        changedPort: number,
        type: "open" | "close",
        portUrl: string,
      ) => {
        if (cancelled) return;
        if (type === "close" && processRef.current) {
          setUrl((current) => {
            if (current && current.includes(`:${changedPort}`)) {
              becameReadyRef.current = false;
              setStatus("starting");
              setPort(null);
              return null;
            }
            return current;
          });
        } else if (type === "open" && !cancelled) {
          becameReadyRef.current = true;
          setPort(changedPort);
          setUrl(portUrl);
          setStatus("ready");
        }
      };

      const onPreviewMessage = (message: PreviewMessage) => {
        if (cancelled) return;
        pushPreviewMessage(message);
      };

      unsubs.push(wc.on("server-ready", onServerReady));
      unsubs.push(wc.on("port", onPort));
      unsubs.push(wc.on("preview-message", onPreviewMessage));

      const readyTimeout = window.setTimeout(() => {
        if (cancelled || becameReadyRef.current) return;
        setStatus("error");
        setError(
          "Preview server did not become ready in time. Check the console, run install in the terminal, or restart.",
        );
        appendLog(
          "error",
          "Preview server timed out waiting for server-ready",
          "server",
        );
      }, SERVER_READY_TIMEOUT_MS);
      unsubs.push(() => window.clearTimeout(readyTimeout));

      try {
        appendLog("info", `Starting \`${command.commandLine}\`…`, "server");
        const process = await spawnDevServer(wc, command, {
          onChunk: flushOutputLines,
        });
        if (cancelled) {
          process.kill();
          return;
        }
        processRef.current = process;

        void process.exit.then((code) => {
          if (cancelled) return;
          if (processRef.current !== process) return;
          processRef.current = null;
          setUrl(null);
          setPort(null);
          if (code === 0) {
            setStatus("unavailable");
            appendLog("info", "Preview server exited", "server");
          } else {
            setStatus("error");
            setError(
              `Preview server exited with code ${code}. Check the console for details.`,
            );
            appendLog(
              "error",
              `Preview server exited with code ${code}`,
              "server",
            );
          }
        });
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(
          err instanceof Error
            ? err.message
            : "Failed to start preview server",
        );
        appendLog(
          "error",
          err instanceof Error ? err.message : "Failed to start preview server",
          "server",
        );
      }
    }

    void start();

    return () => {
      cancelled = true;
      for (const unsub of unsubs) {
        try {
          unsub();
        } catch {
          // ignore
        }
      }
      void stopProcess();
    };
  }, [
    appendLog,
    filesReady,
    flushOutputLines,
    needsInstall,
    packageJson,
    packageManager,
    projectId,
    pushPreviewMessage,
    previewWanted,
    ready,
    restartKey,
    scriptName,
    webcontainer,
    wcError,
    wcStatus,
  ]);

  return {
    status,
    url,
    port,
    error,
    commandLine,
    logs,
    bridgeLogs,
    hot: status === "ready" && url != null,
    restart,
    clearLogs,
    pushPreviewMessage,
  };
}
