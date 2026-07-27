"use client";

import { useAction } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";

export type LinearIssueScope = "mine" | "team" | "cycle";

export type LinearTeamSummary = {
  id: string;
  name: string;
  key: string;
};

export type LinearCycleSummary = {
  id: string;
  name: string;
  number: number;
  endsAt?: string | null;
};

export type LinearWorkflowState = {
  id: string;
  name: string;
  type: string;
  color?: string;
};

export type LinearIssueSummary = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  updatedAt: string;
  state?: { id: string; name: string; type: string; color?: string };
  assignee?: { name: string } | null;
  cycle?: { id: string; name: string; number: number } | null;
};

export type LinearIssueDetail = LinearIssueSummary & {
  description?: string | null;
  createdAt: string;
  team: {
    id: string;
    name: string;
    key: string;
    states: { nodes: LinearWorkflowState[] };
  };
};

export function useLinearIssues(projectId: string) {
  const listTeamsAction = useAction(api.linearActions.listTeams);
  const listIssuesAction = useAction(api.linearActions.listIssues);
  const getIssueAction = useAction(api.linearActions.getIssue);
  const createIssueAction = useAction(api.linearActions.createIssue);
  const updateIssueStateAction = useAction(api.linearActions.updateIssueState);
  const linkProjectIssueAction = useAction(api.linearActions.linkProjectIssue);

  const [isListingTeams, setIsListingTeams] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const listTeams = useCallback(async () => {
    setIsListingTeams(true);
    try {
      return (await listTeamsAction({})) as LinearTeamSummary[];
    } catch (error) {
      throw new Error(
        parseConvexErrorMessage(error, "Failed to load Linear teams"),
      );
    } finally {
      setIsListingTeams(false);
    }
  }, [listTeamsAction]);

  const listIssues = useCallback(
    async (teamId: string, scope: LinearIssueScope) => {
      setIsListing(true);
      try {
        return await listIssuesAction({
          teamId,
          scope,
          limit: 40,
        });
      } catch (error) {
        throw new Error(
          parseConvexErrorMessage(error, "Failed to load Linear issues"),
        );
      } finally {
        setIsListing(false);
      }
    },
    [listIssuesAction],
  );

  const getIssue = useCallback(
    async (issueIdentifier: string) => {
      setIsLoadingDetail(true);
      try {
        return (await getIssueAction({
          issueIdentifier,
        })) as LinearIssueDetail;
      } catch (error) {
        throw new Error(
          parseConvexErrorMessage(error, "Failed to load Linear issue"),
        );
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [getIssueAction],
  );

  const createIssue = useCallback(
    async (args: {
      teamId: string;
      title: string;
      description?: string;
      addToActiveCycle?: boolean;
    }) => {
      setIsCreating(true);
      try {
        const issue = await createIssueAction(args);
        toast.success(`Created ${issue.identifier}`);
        return issue as LinearIssueSummary;
      } catch (error) {
        toast.error(
          parseConvexErrorMessage(error, "Failed to create Linear issue"),
        );
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [createIssueAction],
  );

  const updateIssueState = useCallback(
    async (issueId: string, stateId: string) => {
      setIsUpdatingState(true);
      try {
        const result = await updateIssueStateAction({ issueId, stateId });
        toast.success(
          result.stateName
            ? `Moved to ${result.stateName}`
            : "Issue state updated",
        );
        return result;
      } catch (error) {
        toast.error(
          parseConvexErrorMessage(error, "Failed to update Linear issue"),
        );
        throw error;
      } finally {
        setIsUpdatingState(false);
      }
    },
    [updateIssueStateAction],
  );

  const linkToProject = useCallback(
    async (issueIdentifier: string) => {
      setIsLinking(true);
      try {
        const result = await linkProjectIssueAction({
          projectId: projectId as Id<"projects">,
          issueIdentifier,
        });
        toast.success(`Linked ${result.issueIdentifier} to project`);
        return result;
      } catch (error) {
        toast.error(
          parseConvexErrorMessage(error, "Failed to link Linear issue"),
        );
        throw error;
      } finally {
        setIsLinking(false);
      }
    },
    [linkProjectIssueAction, projectId],
  );

  return {
    listTeams,
    listIssues,
    getIssue,
    createIssue,
    updateIssueState,
    linkToProject,
    isListingTeams,
    isListing,
    isLoadingDetail,
    isCreating,
    isUpdatingState,
    isLinking,
  };
}
