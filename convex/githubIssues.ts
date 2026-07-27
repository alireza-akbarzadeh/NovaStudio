"use node";

import { v } from "convex/values";
import { RequestError } from "@octokit/request-error";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  createOctokit,
  formatGitHubApiError,
  getClerkGitHubToken,
  parseRepoUrl,
} from "./lib/github";

function parseOwnerRepo(githubRepoUrl: string): { owner: string; repo: string } {
  try {
    return parseRepoUrl(githubRepoUrl);
  } catch {
    throw new Error("Invalid GitHub repository URL");
  }
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
  };
}

function mapComment(comment: {
  id: number;
  body?: string | null;
  user: { login: string; avatar_url: string } | null;
  created_at: string;
  html_url: string;
}) {
  return {
    id: comment.id,
    body: comment.body ?? "",
    authorLogin: comment.user?.login ?? "ghost",
    authorAvatarUrl: comment.user?.avatar_url ?? "",
    createdAt: comment.created_at,
    url: comment.html_url,
  };
}

function throwGitHubError(error: unknown, fallback: string): never {
  const formatted = formatGitHubApiError(error);
  throw new Error(formatted ?? fallback);
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const token = await getClerkGitHubToken(identity.subject);
    if (!token) {
      throw new Error("GitHub is not connected.");
    }

    const context = await ctx.runQuery(internal.githubPushMutations.getPushContext, {
      projectId: args.projectId,
    });

    if (!context) {
      throw new Error("Project not found");
    }

    const { project } = context;
    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access to this project");
    }
    if (!project.githubRepoUrl) {
      throw new Error("This project is not linked to a GitHub repository");
    }

    const { owner, repo } = parseOwnerRepo(project.githubRepoUrl);
    const octokit = createOctokit(token);
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const token = await getClerkGitHubToken(identity.subject);
    if (!token) {
      throw new Error("GitHub is not connected.");
    }

    const context = await ctx.runQuery(internal.githubPushMutations.getPushContext, {
      projectId: args.projectId,
    });

    if (!context) {
      throw new Error("Project not found");
    }

    const { project } = context;
    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access to this project");
    }
    if (!project.githubRepoUrl) {
      throw new Error("This project is not linked to a GitHub repository");
    }

    const { owner, repo } = parseOwnerRepo(project.githubRepoUrl);
    const octokit = createOctokit(token);

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
        comments: comments.map(mapComment),
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

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const token = await getClerkGitHubToken(identity.subject);
    if (!token) {
      throw new Error("GitHub is not connected.");
    }

    const context = await ctx.runQuery(internal.githubPushMutations.getPushContext, {
      projectId: args.projectId,
    });

    if (!context) {
      throw new Error("Project not found");
    }

    const { project } = context;
    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access to this project");
    }
    if (!project.githubRepoUrl) {
      throw new Error("This project is not linked to a GitHub repository");
    }

    const { owner, repo } = parseOwnerRepo(project.githubRepoUrl);
    const octokit = createOctokit(token);

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

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const token = await getClerkGitHubToken(identity.subject);
    if (!token) {
      throw new Error("GitHub is not connected.");
    }

    const context = await ctx.runQuery(internal.githubPushMutations.getPushContext, {
      projectId: args.projectId,
    });

    if (!context) {
      throw new Error("Project not found");
    }

    const { project } = context;
    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access to this project");
    }
    if (!project.githubRepoUrl) {
      throw new Error("This project is not linked to a GitHub repository");
    }

    const { owner, repo } = parseOwnerRepo(project.githubRepoUrl);
    const octokit = createOctokit(token);

    try {
      const { data: comment } = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: args.issueNumber,
        body,
      });

      return mapComment(comment);
    } catch (error) {
      if (error instanceof Error && !(error instanceof RequestError)) {
        throw error;
      }
      throwGitHubError(error, "Failed to post comment");
    }
  },
});
