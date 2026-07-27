"use client";

import { useAction } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";

export type LinearIssueScope = "mine" | "team" | "cycle";

export type LinearTaskStage = "todo" | "started" | "done";

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

export type LinearMember = {
  id: string;
  name: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

export type LinearWorkflowState = {
  id: string;
  name: string;
  type: string;
  color?: string;
  position?: number;
};

export type LinearAssignee = {
  id: string;
  name: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export type LinearIssueSummary = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  updatedAt: string;
  state?: { id: string; name: string; type: string; color?: string };
  assignee?: LinearAssignee | null;
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

export function memberLabel(member: {
  name: string;
  displayName?: string | null;
}) {
  return member.displayName?.trim() || member.name;
}

export function pickStageState(
  states: LinearWorkflowState[],
  stage: LinearTaskStage,
): LinearWorkflowState | null {
  const sorted = [...states].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  if (stage === "todo") {
    return (
      sorted.find((s) => s.type === "unstarted") ??
      sorted.find((s) => s.type === "backlog") ??
      sorted.find((s) => s.type === "triage") ??
      null
    );
  }
  if (stage === "started") {
    return sorted.find((s) => s.type === "started") ?? null;
  }
  return sorted.find((s) => s.type === "completed") ?? null;
}

export function stageFromStateType(type?: string): LinearTaskStage | null {
  if (!type) return null;
  if (type === "completed") return "done";
  if (type === "started") return "started";
  if (type === "unstarted" || type === "backlog" || type === "triage") {
    return "todo";
  }
  return null;
}

export function useLinearIssues(projectId: string) {
  const listTeamsAction = useAction(api.linearActions.listTeams);
  const listMembersAction = useAction(api.linearActions.listMembers);
  const getActiveCycleAction = useAction(api.linearActions.getActiveCycle);
  const listIssuesAction = useAction(api.linearActions.listIssues);
  const getIssueAction = useAction(api.linearActions.getIssue);
  const createIssueAction = useAction(api.linearActions.createIssue);
  const updateIssueStateAction = useAction(api.linearActions.updateIssueState);
  const updateIssueAction = useAction(api.linearActions.updateIssue);
  const linkProjectIssueAction = useAction(api.linearActions.linkProjectIssue);

  const [isListingTeams, setIsListingTeams] = useState(false);
  const [isListingMembers, setIsListingMembers] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
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

  const listMembers = useCallback(
    async (teamId: string) => {
      setIsListingMembers(true);
      try {
        return (await listMembersAction({ teamId })) as LinearMember[];
      } catch (error) {
        throw new Error(
          parseConvexErrorMessage(error, "Failed to load team members"),
        );
      } finally {
        setIsListingMembers(false);
      }
    },
    [listMembersAction],
  );

  const getActiveCycle = useCallback(
    async (teamId: string) => {
      try {
        return (await getActiveCycleAction({
          teamId,
        })) as LinearCycleSummary | null;
      } catch {
        return null;
      }
    },
    [getActiveCycleAction],
  );

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
          parseConvexErrorMessage(error, "Failed to load Linear tasks"),
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
          parseConvexErrorMessage(error, "Failed to load Linear task"),
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
      assigneeId?: string;
      initialStage?: LinearTaskStage;
    }) => {
      setIsCreating(true);
      try {
        const issue = await createIssueAction(args);
        toast.success(`Created ${issue.identifier}`);
        return issue as LinearIssueSummary;
      } catch (error) {
        toast.error(
          parseConvexErrorMessage(error, "Failed to create task"),
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
          result.stateName ? `Moved to ${result.stateName}` : "State updated",
        );
        return result;
      } catch (error) {
        toast.error(
          parseConvexErrorMessage(error, "Failed to update task state"),
        );
        throw error;
      } finally {
        setIsUpdatingState(false);
      }
    },
    [updateIssueStateAction],
  );

  const updateAssignee = useCallback(
    async (issueId: string, assigneeId: string | null) => {
      setIsUpdatingAssignee(true);
      try {
        const result = await updateIssueAction({ issueId, assigneeId });
        toast.success(
          result.assignee
            ? `Assigned to ${memberLabel(result.assignee)}`
            : "Unassigned",
        );
        return result;
      } catch (error) {
        toast.error(
          parseConvexErrorMessage(error, "Failed to update assignee"),
        );
        throw error;
      } finally {
        setIsUpdatingAssignee(false);
      }
    },
    [updateIssueAction],
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
          parseConvexErrorMessage(error, "Failed to link Linear task"),
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
    listMembers,
    getActiveCycle,
    listIssues,
    getIssue,
    createIssue,
    updateIssueState,
    updateAssignee,
    linkToProject,
    isListingTeams,
    isListingMembers,
    isListing,
    isLoadingDetail,
    isCreating,
    isUpdatingState,
    isUpdatingAssignee,
    isLinking,
  };
}
