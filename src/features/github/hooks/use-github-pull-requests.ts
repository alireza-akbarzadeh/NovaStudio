"use client";

import { useAction } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";

export type GitHubPullRequestSummary = {
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  merged: boolean;
  authorLogin: string;
  authorAvatarUrl: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  headBranch: string;
  baseBranch: string;
};

export type GitHubPullRequestFile = {
  filename: string;
  previousFilename?: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
};

export type GitHubPullRequestReview = {
  id: number;
  authorLogin: string;
  authorAvatarUrl: string;
  state: string;
  body: string;
  submittedAt: string;
  url: string;
};

export type GitHubPullRequestReviewComment = {
  id: number;
  path: string;
  line: number;
  side: string;
  body: string;
  authorLogin: string;
  authorAvatarUrl: string;
  createdAt: string;
  url: string;
  inReplyToId?: number;
};

export type GitHubPullRequestDetail = GitHubPullRequestSummary & {
  body: string;
  headSha: string;
  mergeable: boolean | null;
  mergeableState: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: Array<{
    id: number;
    body: string;
    authorLogin: string;
    authorAvatarUrl: string;
    createdAt: string;
    url: string;
  }>;
  files: GitHubPullRequestFile[];
  reviews: GitHubPullRequestReview[];
  reviewComments: GitHubPullRequestReviewComment[];
};

export type PullRequestStateFilter = "open" | "closed" | "all";
export type PullRequestReviewEvent = "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
export type PullRequestMergeMethod = "merge" | "squash" | "rebase";

export function useGitHubPullRequests(projectId: string) {
  const listAction = useAction(api.githubPullRequests.listPullRequests);
  const getAction = useAction(api.githubPullRequests.getPullRequest);
  const createAction = useAction(api.githubPullRequests.createPullRequest);
  const commentAction = useAction(api.githubPullRequests.createPullRequestComment);
  const reviewAction = useAction(api.githubPullRequests.createPullRequestReview);
  const reviewCommentAction = useAction(
    api.githubPullRequests.createPullRequestReviewComment,
  );
  const mergeAction = useAction(api.githubPullRequests.mergePullRequest);

  const [isListing, setIsListing] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isReviewCommenting, setIsReviewCommenting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const listPullRequests = useCallback(
    async (state: PullRequestStateFilter = "open") => {
      setIsListing(true);
      try {
        return await listAction({
          projectId: projectId as Id<"projects">,
          state,
          limit: 40,
        });
      } catch (error) {
        throw new Error(
          parseConvexErrorMessage(error, "Failed to load pull requests"),
        );
      } finally {
        setIsListing(false);
      }
    },
    [listAction, projectId],
  );

  const getPullRequest = useCallback(
    async (pullNumber: number) => {
      setIsLoadingDetail(true);
      try {
        return await getAction({
          projectId: projectId as Id<"projects">,
          pullNumber,
        });
      } catch (error) {
        throw new Error(
          parseConvexErrorMessage(error, "Failed to load pull request"),
        );
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [getAction, projectId],
  );

  const createPullRequest = useCallback(
    async (args: {
      title: string;
      head: string;
      base: string;
      body?: string;
      draft?: boolean;
    }) => {
      setIsCreating(true);
      try {
        const pr = await createAction({
          projectId: projectId as Id<"projects">,
          ...args,
        });
        toast.success(`Opened pull request #${pr.number}`);
        return pr;
      } catch (error) {
        toast.error(
          parseConvexErrorMessage(error, "Failed to create pull request"),
        );
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [createAction, projectId],
  );

  const createComment = useCallback(
    async (pullNumber: number, body: string) => {
      setIsCommenting(true);
      try {
        const comment = await commentAction({
          projectId: projectId as Id<"projects">,
          pullNumber,
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
    [commentAction, projectId],
  );

  const submitReview = useCallback(
    async (
      pullNumber: number,
      event: PullRequestReviewEvent,
      body?: string,
    ) => {
      setIsReviewing(true);
      try {
        const review = await reviewAction({
          projectId: projectId as Id<"projects">,
          pullNumber,
          event,
          body,
        });
        const label =
          event === "APPROVE"
            ? "Approved"
            : event === "REQUEST_CHANGES"
              ? "Requested changes"
              : "Review submitted";
        toast.success(label);
        return review;
      } catch (error) {
        toast.error(parseConvexErrorMessage(error, "Failed to submit review"));
        throw error;
      } finally {
        setIsReviewing(false);
      }
    },
    [projectId, reviewAction],
  );

  const createReviewComment = useCallback(
    async (args: {
      pullNumber: number;
      body: string;
      path?: string;
      line?: number;
      side?: "LEFT" | "RIGHT";
      commitId?: string;
      inReplyTo?: number;
    }) => {
      setIsReviewCommenting(true);
      try {
        const comment = await reviewCommentAction({
          projectId: projectId as Id<"projects">,
          pullNumber: args.pullNumber,
          path: args.path ?? "",
          line: args.line ?? 1,
          body: args.body,
          side: args.side,
          commitId: args.commitId,
          inReplyTo: args.inReplyTo,
        });
        toast.success(args.inReplyTo ? "Reply posted" : "Review comment posted");
        return comment;
      } catch (error) {
        toast.error(
          parseConvexErrorMessage(error, "Failed to post review comment"),
        );
        throw error;
      } finally {
        setIsReviewCommenting(false);
      }
    },
    [projectId, reviewCommentAction],
  );

  const mergePullRequest = useCallback(
    async (
      pullNumber: number,
      mergeMethod: PullRequestMergeMethod = "merge",
    ) => {
      setIsMerging(true);
      try {
        const result = await mergeAction({
          projectId: projectId as Id<"projects">,
          pullNumber,
          mergeMethod,
        });
        toast.success("Pull request merged");
        return result;
      } catch (error) {
        toast.error(
          parseConvexErrorMessage(error, "Failed to merge pull request"),
        );
        throw error;
      } finally {
        setIsMerging(false);
      }
    },
    [mergeAction, projectId],
  );

  return {
    listPullRequests,
    getPullRequest,
    createPullRequest,
    createComment,
    submitReview,
    createReviewComment,
    mergePullRequest,
    isListing,
    isLoadingDetail,
    isCreating,
    isCommenting,
    isReviewing,
    isReviewCommenting,
    isMerging,
  };
}
