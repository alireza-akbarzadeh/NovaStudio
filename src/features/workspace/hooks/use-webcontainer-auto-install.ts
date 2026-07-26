"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useOptionalWebContainer } from "@/features/workspace/components/webcontainer-provider";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

/**
 * When WebContainer is ready and the project has package.json but no
 * node_modules, open the terminal and run the detected install once.
 * Skipped while a CLI scaffold (create-next-app) is still pending.
 */
export function useWebContainerAutoInstall(projectId: string) {
  const project = useProject({ projectId });
  const webcontainer = useOptionalWebContainer();
  const requestTerminalCommand = useWorkspaceStore(
    (s) => s.requestTerminalCommand,
  );
  const attemptedForRef = useRef<string | null>(null);

  const ready = webcontainer?.ready ?? false;
  const needsInstall = webcontainer?.needsInstall ?? false;
  const installAttempted = webcontainer?.installAttempted ?? false;
  const installCommand = webcontainer?.installCommand;
  const markInstallAttempted = webcontainer?.markInstallAttempted;
  const pendingScaffold = Boolean(project?.pendingScaffoldCommand);

  useEffect(() => {
    if (pendingScaffold) return;
    if (!ready || !needsInstall || installAttempted) return;
    if (!installCommand || !markInstallAttempted) return;
    if (attemptedForRef.current === projectId) return;

    attemptedForRef.current = projectId;
    markInstallAttempted();

    toast.message("Installing dependencies", {
      description: `Running \`${installCommand}\` in the WebContainer`,
    });
    requestTerminalCommand(installCommand);
  }, [
    installAttempted,
    installCommand,
    markInstallAttempted,
    needsInstall,
    pendingScaffold,
    projectId,
    ready,
    requestTerminalCommand,
  ]);
}
