"use client";

import { useAction } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";

export type GitHubIssueSummary = {
  number: number;
  title: string;
  state: "open" | "closed";
  authorLogin: string;
  authorAvatarUrl: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  commentCount: number;
  labels: Array<{ name: string; color: string }>;
};

export type GitHubIssueComment = {
  id: number;
  body: string;
  authorLogin: string;
  authorAvatarUrl: string;
  createdAt: string;
  url: string;
};

export type GitHubIssueDetail = GitHubIssueSummary & {
  body: string;
  comments: GitHubIssueComment[];
};

export type IssueStateFilter = "open" | "closed" | "all";

export function useGitHubIssues(projectId: string) {
  const listIssuesAction = useAction(api.githubIssues.listIssues);
  const getIssueAction = useAction(api.githubIssues.getIssue);
  const createIssueAction = useAction(api.githubIssues.createIssue);
  const createCommentAction = useAction(api.githubIssues.createIssueComment);
  const updateIssueStateAction = useAction(api.githubIssues.updateIssueState);

  const [isListing, setIsListing] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);

  const listIssues = useCallback(
    async (state: IssueStateFilter = "open") => {
      setIsListing(true);
      try {
        return await listIssuesAction({
          projectId: projectId as Id<"projects">,
          state,
          limit: 40,
        });
      } catch (error) {
        throw new Error(parseConvexErrorMessage(error, "Failed to load issues"));
      } finally {
        setIsListing(false);
      }
    },
    [listIssuesAction, projectId],
  );

  const getIssue = useCallback(
    async (issueNumber: number) => {
      setIsLoadingDetail(true);
      try {
        return await getIssueAction({
          projectId: projectId as Id<"projects">,
          issueNumber,
        });
      } catch (error) {
        throw new Error(parseConvexErrorMessage(error, "Failed to load issue"));
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [getIssueAction, projectId],
  );

  const createIssue = useCallback(
    async (args: { title: string; body?: string }) => {
      setIsCreating(true);
      try {
        const issue = await createIssueAction({
          projectId: projectId as Id<"projects">,
          title: args.title,
          body: args.body,
        });
        toast.success(`Created issue #${issue.number}`);
        return issue;
      } catch (error) {
        toast.error(parseConvexErrorMessage(error, "Failed to create issue"));
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [createIssueAction, projectId],
  );

  const createComment = useCallback(
    async (issueNumber: number, body: string) => {
      setIsCommenting(true);
      try {
        const comment = await createCommentAction({
          projectId: projectId as Id<"projects">,
          issueNumber,
          body,
        });
        toast.success("Comment posted");
        return comment;
      } catch (error) {
        toast.error(parseConvexErrorMessage(error, "Failed to post comment"));
        throw error;
      } finally {
        setIsCommenting(false);
      }
    },
    [createCommentAction, projectId],
  );

  const updateIssueState = useCallback(
    async (issueNumber: number, state: "open" | "closed") => {
      setIsUpdatingState(true);
      try {
        const issue = await updateIssueStateAction({
          projectId: projectId as Id<"projects">,
          issueNumber,
          state,
        });
        toast.success(state === "closed" ? "Issue closed" : "Issue reopened");
        return issue;
      } catch (error) {
        toast.error(parseConvexErrorMessage(error, "Failed to update issue"));
        throw error;
      } finally {
        setIsUpdatingState(false);
      }
    },
    [projectId, updateIssueStateAction],
  );

  return {
    listIssues,
    getIssue,
    createIssue,
    createComment,
    updateIssueState,
    isListing,
    isLoadingDetail,
    isCreating,
    isCommenting,
    isUpdatingState,
  };
}
