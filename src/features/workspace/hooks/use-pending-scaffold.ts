"use client";

import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useOptionalWebContainer } from "@/features/workspace/components/webcontainer-provider";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

/**
 * When a project was created with a pending CLI scaffold (e.g. create-next-app),
 * open the terminal and run it once WebContainer is ready. Files sync back after.
 */
export function usePendingScaffold(projectId: string) {
  const project = useProject({ projectId });
  const webcontainer = useOptionalWebContainer();
  const clearPendingScaffold = useMutation(api.projects.clearPendingScaffold);
  const requestTerminalCommand = useWorkspaceStore(
    (s) => s.requestTerminalCommand,
  );
  const attemptedRef = useRef<string | null>(null);

  const command = project?.pendingScaffoldCommand;

  useEffect(() => {
    if (!command || !webcontainer) return;
    if (attemptedRef.current === projectId) return;

    void webcontainer
      .ensureReady()
      .then(() => {
        if (attemptedRef.current === projectId) return;
        attemptedRef.current = projectId;

        toast.message("Scaffolding project", {
          description: `Running \`${command}\` in the terminal`,
          duration: 6_000,
        });
        requestTerminalCommand(command);
        void clearPendingScaffold({
          projectId: projectId as Id<"projects">,
        }).catch(() => {
          attemptedRef.current = null;
        });
      })
      .catch(() => {
        // Boot errors surface in the terminal status banner.
      });
  }, [
    clearPendingScaffold,
    command,
    projectId,
    requestTerminalCommand,
    webcontainer,
  ]);
}
