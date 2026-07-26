"use client";

import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isImportTimedOut } from "@/features/projects/lib/import-status";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

type ImportWatchProject = Pick<
  WorkspaceProject,
  "id" | "importStatus" | "importStartedAt"
>;

/**
 * When a GitHub clone is still "importing" past the timeout, mark it failed
 * so the user can retry instead of waiting indefinitely.
 */
export function useExpireStaleImports(projects: ImportWatchProject[] | undefined) {
  const failStaleImport = useMutation(
    api.githubImportMutations.failStaleImport,
  );
  const attemptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!projects?.length) return;

    const tick = () => {
      for (const project of projects) {
        if (
          project.importStatus !== "importing" ||
          !isImportTimedOut({
            importStatus: project.importStatus,
            importStartedAt: project.importStartedAt,
          })
        ) {
          continue;
        }
        if (attemptedRef.current.has(project.id)) continue;
        attemptedRef.current.add(project.id);
        void failStaleImport({
          projectId: project.id as Id<"projects">,
        }).catch(() => {
          attemptedRef.current.delete(project.id);
        });
      }
    };

    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [failStaleImport, projects]);
}
