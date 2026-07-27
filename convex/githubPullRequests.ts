"use node";

import { v } from "convex/values";
import { RequestError } from "@octokit/request-error";

import { action } from "./_generated/server";
import { formatGitHubApiError } from "./lib/github";
import {
  mapGitHubComment,
  requireProjectGitHubAccess,
} from "./lib/githubProjectAccess";

function throwGitHubError(error: unknown, fallback: string): never {
  const formatted = formatGitHubApiError(error);
  throw new Error(formatted ?? fallback);
}

function mapPullRequestSummary(pr: {
  number: number;
  title: string;
  state: string;
  draft?: boolean;
  merged_at?: string | null;
  user: { login: string; avatar_url: string } | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  head: { ref: string };
  base: { ref: string };
}) {
  return {
    number: pr.number,
    title: pr.title,
    state: pr.state as "open" | "closed",
    draft: pr.draft ?? false,
    merged: Boolean(pr.merged_at),
    authorLogin: pr.user?.login ?? "ghost",
    authorAvatarUrl: pr.user?.avatar_url ?? "",
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    url: pr.html_url,
    headBranch: pr.head.ref,
    baseBranch: pr.base.ref,
  };
}

function mapPullRequestFile(file: {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
  previous_filename?: string;
}) {
  return {
    filename: file.filename,
    previousFilename: file.previous_filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    patch: file.patch ?? "",
  };
}

function mapPullRequestReview(review: {
  id: number;
  user: { login: string; avatar_url: string } | null;
  state: string;
  body: string;
  submitted_at?: string;
  html_url: string;
}) {
  return {
    id: review.id,
    authorLogin: review.user?.login ?? "ghost",
    authorAvatarUrl: review.user?.avatar_url ?? "",
    state: review.state,
    body: review.body,
    submittedAt: review.submitted_at ?? "",
    url: review.html_url,
  };
}

function mapPullRequestReviewComment(comment: {
  id: number;
  path: string;
  line?: number | null;
  original_line?: number | null;
  side?: string | null;
  body: string;
  user: { login: string; avatar_url: string } | null;
  created_at: string;
  html_url: string;
}) {
  return {
    id: comment.id,
    path: comment.path,
    line: comment.line ?? comment.original_line ?? 0,
    side: comment.side ?? "RIGHT",
    body: comment.body,
    authorLogin: comment.user?.login ?? "ghost",
    authorAvatarUrl: comment.user?.avatar_url ?? "",
    createdAt: comment.created_at,
    url: comment.html_url,
  };
}

export const listPullRequests = action({
  args: {
    projectId: v.id("projects"),
    state: v.optional(
      v.union(v.literal("open"), v.literal("closed"), v.literal("all")),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { octokit, owner, repo } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );
    const perPage = Math.min(Math.max(args.limit ?? 30, 1), 50);

    try {
      const { data } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: args.state ?? "open",
        per_page: perPage,
        sort: "updated",
        direction: "desc",
      });

      return data.map(mapPullRequestSummary);
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to load pull requests");
    }
  },
});

export const getPullRequest = action({
  args: {
    projectId: v.id("projects"),
    pullNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const { octokit, owner, repo } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );

    try {
      const [
        { data: pr },
        { data: comments },
        { data: files },
        { data: reviews },
        { data: reviewComments },
      ] = await Promise.all([
        octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: args.pullNumber,
        }),
        octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: args.pullNumber,
          per_page: 100,
        }),
        octokit.rest.pulls.listFiles({
          owner,
          repo,
          pull_number: args.pullNumber,
          per_page: 100,
        }),
        octokit.rest.pulls.listReviews({
          owner,
          repo,
          pull_number: args.pullNumber,
          per_page: 100,
        }),
        octokit.rest.pulls.listReviewComments({
          owner,
          repo,
          pull_number: args.pullNumber,
          per_page: 100,
        }),
      ]);

      return {
        ...mapPullRequestSummary(pr),
        body: pr.body ?? "",
        headSha: pr.head.sha,
        mergeable: pr.mergeable,
        mergeableState: pr.mergeable_state ?? "unknown",
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        comments: comments.map(mapGitHubComment),
        files: files.map(mapPullRequestFile),
        reviews: reviews.map(mapPullRequestReview),
        reviewComments: reviewComments.map(mapPullRequestReviewComment),
      };
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to load pull request");
    }
  },
});

export const createPullRequest = action({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    head: v.string(),
    base: v.string(),
    body: v.optional(v.string()),
    draft: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    const head = args.head.trim();
    const base = args.base.trim();
    if (!title) throw new Error("Pull request title is required");
    if (!head) throw new Error("Head branch is required");
    if (!base) throw new Error("Base branch is required");
    if (head === base) {
      throw new Error("Head and base branches must be different");
    }

    const { octokit, owner, repo } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );

    try {
      const { data: pr } = await octokit.rest.pulls.create({
        owner,
        repo,
        title,
        head,
        base,
        body: args.body?.trim() || undefined,
        draft: args.draft ?? false,
      });

      return mapPullRequestSummary(pr);
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to create pull request");
    }
  },
});

export const createPullRequestComment = action({
  args: {
    projectId: v.id("projects"),
    pullNumber: v.number(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (!body) {
      throw new Error("Comment cannot be empty");
    }

    const { octokit, owner, repo } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );

    try {
      const { data: comment } = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: args.pullNumber,
        body,
      });

      return mapGitHubComment(comment);
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to post comment");
    }
  },
});

export const createPullRequestReview = action({
  args: {
    projectId: v.id("projects"),
    pullNumber: v.number(),
    event: v.union(
      v.literal("APPROVE"),
      v.literal("REQUEST_CHANGES"),
      v.literal("COMMENT"),
    ),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const body = args.body?.trim() ?? "";
    if (args.event === "REQUEST_CHANGES" && !body) {
      throw new Error("Add a comment when requesting changes");
    }

    const { octokit, owner, repo } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );

    try {
      const { data: review } = await octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number: args.pullNumber,
        event: args.event,
        body: body || undefined,
      });

      return mapPullRequestReview(review);
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to submit review");
    }
  },
});

export const createPullRequestReviewComment = action({
  args: {
    projectId: v.id("projects"),
    pullNumber: v.number(),
    body: v.string(),
    path: v.string(),
    line: v.number(),
    side: v.optional(v.union(v.literal("LEFT"), v.literal("RIGHT"))),
    commitId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    const path = args.path.trim();
    if (!body) throw new Error("Comment cannot be empty");
    if (!path) throw new Error("File path is required");
    if (!Number.isFinite(args.line) || args.line < 1) {
      throw new Error("Line number must be at least 1");
    }

    const { octokit, owner, repo } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );

    let commitId = args.commitId?.trim();
    if (!commitId) {
      const { data: pr } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: args.pullNumber,
      });
      commitId = pr.head.sha;
    }

    try {
      const { data: comment } = await octokit.rest.pulls.createReviewComment({
        owner,
        repo,
        pull_number: args.pullNumber,
        body,
        commit_id: commitId,
        path,
        line: args.line,
        side: args.side ?? "RIGHT",
      });

      return mapPullRequestReviewComment(comment);
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to post review comment");
    }
  },
});

export const mergePullRequest = action({
  args: {
    projectId: v.id("projects"),
    pullNumber: v.number(),
    mergeMethod: v.optional(
      v.union(v.literal("merge"), v.literal("squash"), v.literal("rebase")),
    ),
    commitTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { octokit, owner, repo } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );

    try {
      const { data } = await octokit.rest.pulls.merge({
        owner,
        repo,
        pull_number: args.pullNumber,
        merge_method: args.mergeMethod ?? "merge",
        commit_title: args.commitTitle?.trim() || undefined,
      });

      if (!data.merged) {
        throw new Error(data.message ?? "Pull request could not be merged");
      }

      return {
        merged: true as const,
        sha: data.sha,
        message: data.message,
      };
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to merge pull request");
    }
  },
});
