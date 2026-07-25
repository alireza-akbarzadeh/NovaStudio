"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { getClerkGitHubToken, parseRepoUrl } from "./lib/github";
import { fetchRepoFiles } from "./lib/githubFetch";

/**
 * Starts a GitHub clone: creates the project immediately and returns.
 * The heavy import runs in the background via Inngest (`processCloneJob`).
 */
export const cloneFromGitHub = action({
  args: {
    repoUrl: v.string(),
    branch: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ projectId: Id<"projects">; importJobToken: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const token = await getClerkGitHubToken(identity.subject);
    if (!token) {
      throw new Error(
        "GitHub is not connected. Link your GitHub account from your profile.",
      );
    }

    const { owner, repo } = parseRepoUrl(args.repoUrl);
    const branch = args.branch?.trim() || "main";

    return await ctx.runMutation(
      internal.githubImportMutations.createImportProject,
      {
        ownerId: identity.subject,
        name: args.name?.trim() || repo,
        githubRepoUrl: `${owner}/${repo}`,
        githubBranch: branch,
        email: identity.email ?? undefined,
        displayName: identity.name ?? identity.nickname ?? undefined,
        imageUrl: identity.pictureUrl ?? undefined,
      },
    );
  },
});

/**
 * Background import worker. Called from Inngest with the per-project job token.
 */
export const processCloneJob = action({
  args: {
    projectId: v.id("projects"),
    jobToken: v.string(),
  },
  handler: async (ctx, args): Promise<{ ok: true; fileCount: number }> => {
    const project = await ctx.runQuery(
      internal.githubImportMutations.getImportJob,
      { projectId: args.projectId },
    );

    if (!project) {
      throw new Error("Project not found");
    }

    if (!project.importJobToken || project.importJobToken !== args.jobToken) {
      throw new Error("Unauthorized");
    }

    if (project.importStatus !== "importing") {
      return { ok: true, fileCount: 0 };
    }

    if (!project.githubRepoUrl || !project.githubBranch) {
      await ctx.runMutation(internal.githubImportMutations.failImport, {
        projectId: args.projectId,
      });
      throw new Error("Project is missing GitHub repository details");
    }

    const { owner, repo } = parseRepoUrl(project.githubRepoUrl);
    const branch = project.githubBranch;

    try {
      const token = await getClerkGitHubToken(project.ownerId);
      if (!token) {
        throw new Error(
          "GitHub is not connected. Link your GitHub account from your profile.",
        );
      }

      const { files, commitSha } = await fetchRepoFiles(
        token,
        owner,
        repo,
        branch,
      );

      if (files.length === 0) {
        throw new Error("No importable files found in this repository.");
      }

      await ctx.runMutation(internal.githubImportMutations.importFiles, {
        projectId: args.projectId,
        files,
      });
      await ctx.runMutation(internal.githubImportMutations.completeImport, {
        projectId: args.projectId,
        commitSha,
      });

      return { ok: true, fileCount: files.length };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "The GitHub clone job failed.";
      await ctx.runMutation(internal.githubImportMutations.failImport, {
        projectId: args.projectId,
        reason,
      });
      throw error;
    }
  },
});
