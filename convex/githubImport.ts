"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { getClerkGitHubToken, parseRepoUrl } from "./lib/github";
import { fetchRepoFiles } from "./lib/githubFetch";
import { getOrgContext } from "./lib/orgContext";

const WRITE_BATCH_SIZE = 40;

/** Match client `IMPORT_TIMEOUT_MS` — fail hung clones instead of running for hours. */
const IMPORT_TIMEOUT_MS = 5 * 60 * 1000;

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
    const { orgId } = getOrgContext(identity);

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
        ...(orgId ? { orgId } : {}),
      },
    );
  },
});

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

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

    const startedAt = project.importStartedAt ?? Date.now();
    const elapsed = Date.now() - startedAt;
    if (elapsed >= IMPORT_TIMEOUT_MS) {
      await ctx.runMutation(internal.githubImportMutations.failImport, {
        projectId: args.projectId,
        reason:
          "The GitHub clone timed out after 5 minutes. Retry the import from the project card.",
      });
      throw new Error("GitHub clone timed out");
    }

    if (!project.githubRepoUrl || !project.githubBranch) {
      await ctx.runMutation(internal.githubImportMutations.failImport, {
        projectId: args.projectId,
      });
      throw new Error("Project is missing GitHub repository details");
    }

    const { owner, repo } = parseRepoUrl(project.githubRepoUrl);
    const branch = project.githubBranch;
    const budgetMs = Math.max(30_000, IMPORT_TIMEOUT_MS - elapsed);

    try {
      const token = await getClerkGitHubToken(project.ownerId);
      if (!token) {
        throw new Error(
          "GitHub is not connected. Link your GitHub account from your profile.",
        );
      }

      const { files, commitSha } = await withTimeout(
        fetchRepoFiles(token, owner, repo, branch),
        budgetMs,
        "The GitHub clone timed out while fetching repository files. Retry from the project card.",
      );

      if (files.length === 0) {
        throw new Error("No importable files found in this repository.");
      }

      await ctx.runMutation(internal.githubImportMutations.setImportProgress, {
        projectId: args.projectId,
        totalFiles: files.length,
        doneFiles: 0,
      });

      for (let i = 0; i < files.length; i += WRITE_BATCH_SIZE) {
        const batch = files.slice(i, i + WRITE_BATCH_SIZE);
        await ctx.runMutation(internal.githubImportMutations.insertImportBatch, {
          projectId: args.projectId,
          files: batch,
        });
        await ctx.runMutation(internal.githubImportMutations.setImportProgress, {
          projectId: args.projectId,
          doneFiles: Math.min(i + batch.length, files.length),
          totalFiles: files.length,
        });
      }

      await ctx.runMutation(internal.githubImportMutations.completeImport, {
        projectId: args.projectId,
        commitSha,
        fileCount: files.length,
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
