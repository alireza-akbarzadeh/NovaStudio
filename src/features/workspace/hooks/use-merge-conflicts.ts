"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useMergeConflicts(projectId: string) {
  return useQuery(api.projectMergeConflicts.listByProject, {
    projectId: projectId as Id<"projects">,
  });
}

export function useResolveMergeConflict(projectId: string) {
  const resolve = useMutation(api.projectMergeConflicts.resolveConflict);

  return useCallback(
    async (
      conflictId: Id<"projectMergeConflicts">,
      resolution: "local" | "remote" | "both",
    ) => {
      try {
        const result = await resolve({ conflictId, resolution });
        toast.success(`Resolved ${result.path}`, {
          description:
            result.remainingCount > 0
              ? `${result.remainingCount} conflict${result.remainingCount === 1 ? "" : "s"} remaining`
              : "All merge conflicts resolved",
        });
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to resolve conflict";
        toast.error(message);
        throw error;
      }
    },
    [resolve],
  );
}
