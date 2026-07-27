"use client";

import { useAction } from "convex/react";
import { useCallback, useState } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";

export type GitHubWorkflowRun = {
  id: number;
  runNumber: number;
  workflowId: number;
  name: string;
  event: string;
  status: string;
  conclusion: string | null;
  url: string;
  headBranch: string;
  headSha: string;
  createdAt: string;
  updatedAt: string;
};

export function useGitHubCi(projectId: string) {
  const listRunsAction = useAction(api.githubCi.listWorkflowRuns);
  const [isListing, setIsListing] = useState(false);

  const listWorkflowRuns = useCallback(async () => {
    setIsListing(true);
    try {
      return await listRunsAction({
        projectId: projectId as Id<"projects">,
        limit: 30,
      });
    } catch (error) {
      throw new Error(
        parseConvexErrorMessage(error, "Failed to load workflow runs"),
      );
    } finally {
      setIsListing(false);
    }
  }, [listRunsAction, projectId]);

  return { listWorkflowRuns, isListing };
}
