"use client";

import { useMutation } from "convex/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useProjectFiles } from "@/features/workspace/hooks/use-project-files";
import { loadFileContentDraft } from "@/features/workspace/lib/file-content-drafts";
import type { PackageManager } from "@/features/workspace/lib/terminal/package-scripts";
import {
  bootWebContainer,
  getCrossOriginIsolationError,
  getWebContainer,
  teardownWebContainer,
} from "@/features/workspace/lib/webcontainer/boot";
import { syncManifestsToProject } from "@/features/workspace/lib/webcontainer/lockfile-sync";
import {
  detectPackageManager,
  installArgs,
  installCommandLine,
  isInstallLikeCommand,
  isScaffoldCommand,
  normalizeNodeCliArgs,
} from "@/features/workspace/lib/webcontainer/package-manager";
import { spawnAndStream } from "@/features/workspace/lib/webcontainer/spawn";
import {
  hasNodeModules,
  mountProject,
  writeProjectFile,
} from "@/features/workspace/lib/webcontainer/sync";
import { syncTreeToProject } from "@/features/workspace/lib/webcontainer/tree-sync";

export type WebContainerStatus =
  | "idle"
  | "booting"
  | "mounting"
  | "ready"
  | "error";

export type WebContainerSpawnWrite = (chunk: string) => void;

export type UseWebContainerResult = {
  status: WebContainerStatus;
  error: string | null;
  ready: boolean;
  spawn: (
    command: string,
    args: string[],
    options: {
      cwd: string;
      onChunk: WebContainerSpawnWrite;
      onStdin?: (write: (data: string) => void) => void;
      onStdinEnd?: () => void;
      cols?: number;
      rows?: number;
      signal?: AbortSignal;
    },
  ) => Promise<number>;
  /** Detected install command line, e.g. `npm install`. */
  installCommand: string;
  packageManager: PackageManager;
  /** True when root package.json exists and node_modules is missing. */
  needsInstall: boolean;
  /** Mark that auto-install was attempted for this project session. */
  markInstallAttempted: () => void;
  installAttempted: boolean;
  /** Re-check whether node_modules exists (call after install). */
  refreshInstallState: () => Promise<void>;
  /** Persist package.json + lockfiles from WC → Convex. */
  syncManifests: () => Promise<string[]>;
  /** Persist scaffolded project files from WC → Convex (skips node_modules). */
  syncTree: () => Promise<string[]>;
  shouldSyncAfterCommand: (args: string[]) => boolean;
  shouldSyncTreeAfterCommand: (binary: string, args: string[]) => boolean;
};

export function useWebContainer(projectId: string): UseWebContainerResult {
  const files = useProjectFiles(projectId);
  const writeFileAtPath = useMutation(api.projectFiles.writeFileAtPath);

  const [status, setStatus] = useState<WebContainerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [installAttempted, setInstallAttempted] = useState(false);

  const mountedProjectRef = useRef<string | null>(null);
  const lastSyncHashRef = useRef<string>("");
  const filesRef = useRef(files);
  filesRef.current = files;

  const packageManager = detectPackageManager(
    (files ?? []).map((f) => f.path),
  );
  const installCommand = installCommandLine(packageManager);

  const syncManifests = useCallback(async () => {
    const wc = getWebContainer();
    if (!wc) return [];

    return syncManifestsToProject(wc, async (path, content) => {
      await writeFileAtPath({
        projectId: projectId as Id<"projects">,
        path,
        content,
      });
    });
  }, [projectId, writeFileAtPath]);

  const syncTree = useCallback(async () => {
    const wc = getWebContainer();
    if (!wc) return [];

    return syncTreeToProject(wc, async (path, content) => {
      await writeFileAtPath({
        projectId: projectId as Id<"projects">,
        path,
        content,
      });
    });
  }, [projectId, writeFileAtPath]);

  const refreshInstallState = useCallback(async () => {
    const wc = getWebContainer();
    if (!wc) return;
    const fileList = filesRef.current;
    const hasPkg = (fileList ?? []).some(
      (f) => f.kind === "file" && f.path === "package.json",
    );
    if (!hasPkg) {
      setNeedsInstall(false);
      return;
    }
    const installed = await hasNodeModules(wc);
    setNeedsInstall(!installed);
  }, []);

  const spawn = useCallback(
    async (
      command: string,
      args: string[],
      options: {
        cwd: string;
        onChunk: WebContainerSpawnWrite;
        onStdin?: (write: (data: string) => void) => void;
        onStdinEnd?: () => void;
        cols?: number;
        rows?: number;
        signal?: AbortSignal;
      },
    ) => {
      const wc = getWebContainer();
      if (!wc) {
        throw new Error("WebContainer is not ready");
      }
      const normalizedArgs = normalizeNodeCliArgs(command, args);
      return spawnAndStream(wc, command, normalizedArgs, {
        cwd: options.cwd,
        onChunk: options.onChunk,
        onStdin: options.onStdin,
        onStdinEnd: options.onStdinEnd,
        cols: options.cols,
        rows: options.rows,
        signal: options.signal,
      });
    },
    [],
  );

  // Boot + mount when project files are available
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (files === undefined) return;

      const isolationError = getCrossOriginIsolationError();
      if (isolationError) {
        setStatus("error");
        setError(isolationError);
        return;
      }

      setStatus((s) => (s === "ready" ? s : "booting"));
      setError(null);

      try {
        const wc = await bootWebContainer();
        if (cancelled) return;

        // Remount when switching projects
        if (mountedProjectRef.current !== projectId) {
          setStatus("mounting");
          const withDrafts = files.map((file) => {
            if (file.kind !== "file") return file;
            const draft = loadFileContentDraft(projectId, file.path);
            if (draft && draft.updatedAt >= (file.updatedAt ?? 0)) {
              return { ...file, content: draft.content };
            }
            return file;
          });
          await mountProject(wc, withDrafts);
          if (cancelled) return;
          mountedProjectRef.current = projectId;
          lastSyncHashRef.current = hashFileSnapshot(withDrafts);
          setInstallAttempted(false);
        }

        const hasPkg = files.some(
          (f) => f.kind === "file" && f.path === "package.json",
        );
        const installed = hasPkg ? await hasNodeModules(wc) : true;
        if (cancelled) return;
        setNeedsInstall(hasPkg && !installed);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to boot WebContainer",
        );
      }
    }

    void setup();

    return () => {
      cancelled = true;
    };
  }, [files, projectId]);

  // Tear down when leaving the workspace (projectId unmount of provider)
  useEffect(() => {
    return () => {
      mountedProjectRef.current = null;
      void teardownWebContainer();
    };
  }, [projectId]);

  // Incremental sync: push Convex / draft updates into WC
  useEffect(() => {
    if (status !== "ready" || files === undefined) return;
    if (mountedProjectRef.current !== projectId) return;

    const withDrafts = files.map((file) => {
      if (file.kind !== "file") return file;
      const draft = loadFileContentDraft(projectId, file.path);
      if (draft && draft.updatedAt >= (file.updatedAt ?? 0)) {
        return { ...file, content: draft.content };
      }
      return file;
    });

    const hash = hashFileSnapshot(withDrafts);
    if (hash === lastSyncHashRef.current) return;
    lastSyncHashRef.current = hash;

    const wc = getWebContainer();
    if (!wc) return;

    let cancelled = false;
    void (async () => {
      for (const file of withDrafts) {
        if (cancelled || file.kind !== "file") continue;
        try {
          await writeProjectFile(wc, file.path, file.content ?? "");
        } catch {
          // Best-effort sync; install may lock files briefly.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [files, projectId, status]);

  return {
    status,
    error,
    ready: status === "ready",
    spawn,
    installCommand,
    packageManager,
    needsInstall,
    markInstallAttempted: () => setInstallAttempted(true),
    installAttempted,
    refreshInstallState,
    syncManifests,
    syncTree,
    shouldSyncAfterCommand: isInstallLikeCommand,
    shouldSyncTreeAfterCommand: isScaffoldCommand,
  };
}

function hashFileSnapshot(
  files: { path: string; kind: string; content?: string; updatedAt?: number }[],
): string {
  // Lightweight change detector — path + length + updatedAt
  return files
    .filter((f) => f.kind === "file")
    .map(
      (f) =>
        `${f.path}:${f.updatedAt ?? 0}:${(f.content ?? "").length}`,
    )
    .sort()
    .join("|");
}

export { installArgs };
