"use node";

import { v } from "convex/values";
import { RequestError } from "@octokit/request-error";

import { action } from "./_generated/server";
import { formatGitHubApiError } from "./lib/github";
import {
  mapGitHubComment,
  mapGitHubLabel,
  requireProjectGitHubAccess,
} from "./lib/githubProjectAccess";

function throwGitHubError(error: unknown, fallback: string): never {
  const formatted = formatGitHubApiError(error);
  throw new Error(formatted ?? fallback);
}

function extractLabels(
  labels: Array<
    | string
    | { name?: string | null; color?: string | null }
  >,
) {
  return labels
    .filter(
      (label): label is { name: string; color: string } =>
        typeof label === "object" &&
        label !== null &&
        typeof label.name === "string" &&
        typeof label.color === "string",
    )
    .map(mapGitHubLabel);
}

function mapIssueSummary(issue: {
  number: number;
  title: string;
  state: string;
  user: { login: string; avatar_url: string } | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  comments: number;
  labels?: Array<string | { name?: string | null; color?: string | null }>;
}) {
  return {
    number: issue.number,
    title: issue.title,
    state: issue.state as "open" | "closed",
    authorLogin: issue.user?.login ?? "ghost",
    authorAvatarUrl: issue.user?.avatar_url ?? "",
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    url: issue.html_url,
    commentCount: issue.comments,
    labels: extractLabels(issue.labels ?? []),
  };
}

export const listIssues = action({
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
      const { data } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: args.state ?? "open",
        per_page: perPage,
        sort: "updated",
        direction: "desc",
      });

      return data
        .filter((issue) => !issue.pull_request)
        .map(mapIssueSummary);
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to load GitHub issues");
    }
  },
});

export const getIssue = action({
  args: {
    projectId: v.id("projects"),
    issueNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const { octokit, owner, repo } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );

    try {
      const [{ data: issue }, { data: comments }] = await Promise.all([
        octokit.rest.issues.get({
          owner,
          repo,
          issue_number: args.issueNumber,
        }),
        octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: args.issueNumber,
          per_page: 100,
        }),
      ]);

      if (issue.pull_request) {
        throw new Error("This number refers to a pull request, not an issue");
      }

      return {
        ...mapIssueSummary(issue),
        body: issue.body ?? "",
        comments: comments.map(mapGitHubComment),
      };
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to load GitHub issue");
    }
  },
});

export const createIssue = action({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title) {
      throw new Error("Issue title is required");
    }

    const { octokit, owner, repo } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );

    try {
      const { data: issue } = await octokit.rest.issues.create({
        owner,
        repo,
        title,
        body: args.body?.trim() || undefined,
      });

      return mapIssueSummary(issue);
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to create GitHub issue");
    }
  },
});

export const createIssueComment = action({
  args: {
    projectId: v.id("projects"),
    issueNumber: v.number(),
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
        issue_number: args.issueNumber,
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

export const updateIssueState = action({
  args: {
    projectId: v.id("projects"),
    issueNumber: v.number(),
    state: v.union(v.literal("open"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const { octokit, owner, repo } = await requireProjectGitHubAccess(
      ctx,
      args.projectId,
    );

    try {
      const { data: issue } = await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: args.issueNumber,
        state: args.state,
      });

      if (issue.pull_request) {
        throw new Error("This number refers to a pull request, not an issue");
      }

      return mapIssueSummary(issue);
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to update issue");
    }
  },
});
