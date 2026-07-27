"use client";

import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useProjectLinearLink(projectId: string) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const link = useQuery(
    api.linear.getProjectLink,
    isAuthenticated
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );
  const unlinkMutation = useMutation(api.linear.unlinkProjectIssue);
  const linkAction = useAction(api.linearActions.linkProjectIssue);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const linkIssue = useCallback(
    async (issueIdentifier: string) => {
      setIsLinking(true);
      try {
        const result = await linkAction({
          projectId: projectId as Id<"projects">,
          issueIdentifier,
        });
        toast.success(`Linked ${result.issueIdentifier}`);
        return result;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to link Linear issue",
        );
        throw error;
      } finally {
        setIsLinking(false);
      }
    },
    [linkAction, projectId],
  );

  const unlinkIssue = useCallback(async () => {
    setIsUnlinking(true);
    try {
      await unlinkMutation({ projectId: projectId as Id<"projects"> });
      toast.success("Linear issue unlinked");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unlink Linear issue",
      );
    } finally {
      setIsUnlinking(false);
    }
  }, [projectId, unlinkMutation]);

  return {
    link: link ?? null,
    isLoading: isAuthLoading || (isAuthenticated && link === undefined),
    isLinking,
    isUnlinking,
    linkIssue,
    unlinkIssue,
  };
}
