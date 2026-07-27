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
import { useProject } from "@/features/projects/hooks/use-projects";
import {
  useProjectFileMetadata,
  useProjectFiles,
} from "@/features/workspace/hooks/use-project-files";
import { loadFileContentDraft } from "@/features/workspace/lib/file-content-drafts";
import type { PackageManager } from "@/features/workspace/lib/terminal/package-scripts";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import {
  bootWebContainer,
  getCrossOriginIsolationError,
  getWebContainer,
  teardownWebContainer,
} from "@/features/workspace/lib/webcontainer/boot";
import { syncManifestsToProject } from "@/features/workspace/lib/webcontainer/lockfile-sync";
import { filterFilesForWebContainerMount } from "@/features/workspace/lib/webcontainer/mount-filter";
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
  /** Boot + mount the project into WebContainer (no-op when already ready). */
  ensureReady: () => Promise<void>;
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
  /** Write a single file into the container (for live HMR). */
  writeFile: (path: string, content: string) => Promise<void>;
};

export function useWebContainer(projectId: string): UseWebContainerResult {
  const project = useProject({ projectId });
  const metadata = useProjectFileMetadata(projectId);
  const files = useProjectFiles(projectId);
  const writeFileAtPath = useMutation(api.projectFiles.writeFileAtPath);

  const terminalOpen = useWorkspaceStore((s) => s.terminalOpen);
  const bottomPanelTab = useWorkspaceStore((s) => s.bottomPanelTab);
  const editorPanelView = useWorkspaceStore((s) => s.editorPanelView);
  const terminalCommandRequest = useWorkspaceStore(
    (s) => s.terminalCommandRequest,
  );

  const [status, setStatus] = useState<WebContainerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [installAttempted, setInstallAttempted] = useState(false);

  const mountedProjectRef = useRef<string | null>(null);
  const lastSyncHashRef = useRef<string>("");
  const filesRef = useRef(files);
  const bootPromiseRef = useRef<Promise<void> | null>(null);
  filesRef.current = files;

  const packageManager = detectPackageManager(
    (metadata ?? []).map((f) => f.path),
  );
  const installCommand = installCommandLine(packageManager);

  const applyDrafts = useCallback(
    (rows: NonNullable<typeof files>) => {
      return rows.map((file) => {
        if (file.kind !== "file") return file;
        const draft = loadFileContentDraft(projectId, file.path);
        if (draft && draft.updatedAt >= (file.updatedAt ?? 0)) {
          return { ...file, content: draft.content };
        }
        return file;
      });
    },
    [projectId],
  );

  const waitForProjectFiles = useCallback(async () => {
    if (filesRef.current !== undefined) {
      return filesRef.current;
    }

    await new Promise<void>((resolve) => {
      const started = Date.now();
      const timer = window.setInterval(() => {
        if (filesRef.current !== undefined) {
          window.clearInterval(timer);
          resolve();
          return;
        }
        if (Date.now() - started > 120_000) {
          window.clearInterval(timer);
          resolve();
        }
      }, 100);
    });

    if (filesRef.current === undefined) {
      throw new Error("Project files are still loading");
    }

    return filesRef.current;
  }, []);

  const runBoot = useCallback(async () => {
    const isolationError = getCrossOriginIsolationError();
    if (isolationError) {
      setStatus("error");
      setError(isolationError);
      throw new Error(isolationError);
    }

    const projectFiles = await waitForProjectFiles();
    setStatus((current) => (current === "ready" ? current : "booting"));
    setError(null);

    const wc = await bootWebContainer();

    if (mountedProjectRef.current !== projectId) {
      setStatus("mounting");
      const withDrafts = applyDrafts(projectFiles);
      const mountable = filterFilesForWebContainerMount(withDrafts);
      await mountProject(wc, mountable);
      mountedProjectRef.current = projectId;
      lastSyncHashRef.current = hashFileSnapshot(withDrafts);
      setInstallAttempted(false);
    }

    const hasPkg = projectFiles.some(
      (f) => f.kind === "file" && f.path === "package.json",
    );
    const installed = hasPkg ? await hasNodeModules(wc) : true;
    setNeedsInstall(hasPkg && !installed);
    setStatus("ready");
  }, [applyDrafts, projectId, waitForProjectFiles]);

  const ensureReady = useCallback(async () => {
    if (status === "ready") return;
    if (status === "error") {
      throw new Error(error ?? "WebContainer failed to start");
    }

    if (!bootPromiseRef.current) {
      bootPromiseRef.current = runBoot().catch((err) => {
        bootPromiseRef.current = null;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to boot WebContainer",
        );
        throw err;
      });
    }

    await bootPromiseRef.current;
  }, [error, runBoot, status]);

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
      await ensureReady();
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
    [ensureReady],
  );

  const writeFile = useCallback(
    async (path: string, content: string) => {
      try {
        await ensureReady();
        const wc = getWebContainer();
        if (!wc) return;
        await writeProjectFile(wc, path, content);
      } catch {
        // Best-effort; install or teardown may race.
      }
    },
    [ensureReady],
  );

  const wantsBoot =
    (terminalOpen && bottomPanelTab === "terminal") ||
    editorPanelView === "preview" ||
    Boolean(terminalCommandRequest) ||
    Boolean(project?.pendingScaffoldCommand);

  useEffect(() => {
    if (!wantsBoot || status === "ready" || status === "error") return;
    void ensureReady().catch(() => {
      // Error state is set inside ensureReady / runBoot.
    });
  }, [ensureReady, status, wantsBoot]);

  useEffect(() => {
    return () => {
      mountedProjectRef.current = null;
      bootPromiseRef.current = null;
      void teardownWebContainer();
    };
  }, [projectId]);

  useEffect(() => {
    if (status !== "ready" || files === undefined) return;
    if (mountedProjectRef.current !== projectId) return;

    const withDrafts = applyDrafts(files);
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
  }, [applyDrafts, files, projectId, status]);

  return {
    status,
    error,
    ready: status === "ready",
    ensureReady,
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
    writeFile,
  };
}

function hashFileSnapshot(
  files: { path: string; kind: string; content?: string; updatedAt?: number }[],
): string {
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
