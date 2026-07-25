"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

import type { Doc } from "@/convex/_generated/dataModel";
import { useProjectsDialog } from "@/features/projects/components/projects-dialog";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

/**
 * Open a workspace project: close the projects dialog first, skip no-op
 * navigations, and reset editor chrome so the switch feels immediate.
 */
export function useOpenWorkspaceProject() {
  const router = useRouter();
  const pathname = usePathname();
  const { closeProjects } = useProjectsDialog();
  const [isPending, startTransition] = useTransition();

  const openProject = useCallback(
    (project: Pick<Doc<"projects">, "_id"> | string) => {
      const projectId = typeof project === "string" ? project : project._id;
      const href = `/projects/${projectId}`;

      // Drop the modal immediately so navigation doesn't feel stuck underneath.
      closeProjects();

      const alreadyOpen =
        pathname === href ||
        pathname === `${href}/` ||
        pathname.startsWith(`${href}/`);

      if (alreadyOpen) return;

      // Clear previous workspace tabs before the new shell mounts.
      useWorkspaceStore.getState().resetEditorTabs(projectId);

      startTransition(() => {
        router.push(href);
      });
    },
    [closeProjects, pathname, router],
  );

  const leaveToProjectsHub = useCallback(() => {
    closeProjects();
    startTransition(() => {
      router.push("/projects");
    });
  }, [closeProjects, router]);

  return { openProject, leaveToProjectsHub, isPending };
}
