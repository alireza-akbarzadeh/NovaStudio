"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { getClerkGitHubToken, parseRepoUrl } from "./lib/github";
import { fetchRepoFiles } from "./lib/githubFetch";
import { threeWayMerge } from "./lib/threeWayMerge";

const WRITE_BATCH_SIZE = 40;
const DELETE_BATCH_SIZE = 200;

type MergePullFileRow = {
  path: string;
  kind: "file" | "folder";
  content: string;
  syncedContent: string;
  changed: boolean;
};

export const pullFromGitHub = action({
  args: {
    projectId: v.id("projects"),
    /** When true, overwrite local Convex files even if there are uncommitted changes. */
    force: v.optional(v.boolean()),
    /** When true, 3-way merge local changes with incoming GitHub updates. */
    merge: v.optional(v.boolean()),
    /** Optional branch to pull (also updates the project's active branch). */
    branch: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ queued: true; branch: string; merge: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const token = await getClerkGitHubToken(identity.subject);
    if (!token) {
      throw new Error(
        "GitHub is not connected. Link your GitHub account to pull changes.",
      );
    }

    const context = await ctx.runQuery(internal.githubPullMutations.getPullContext, {
      projectId: args.projectId,
    });

    if (!context) {
      throw new Error("Project not found");
    }

    const { project, changedCount } = context;

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access to this project");
    }

    if (!project.githubRepoUrl || project.source !== "github") {
      throw new Error("This project is not linked to a GitHub repository");
    }

    if (changedCount > 0 && !args.force && !args.merge) {
      throw new Error(
        `You have ${changedCount} local change${changedCount === 1 ? "" : "s"}. Commit & push them first, merge with incoming changes, or pull with discard to overwrite from GitHub.`,
      );
    }

    const branch =
      args.branch?.trim() || project.githubBranch?.trim() || "main";

    const { importJobToken } = await ctx.runMutation(
      internal.githubPullMutations.queuePullJob,
      {
        projectId: args.projectId,
        githubBranch: branch,
      },
    );

    if (changedCount > 0 && args.merge && !args.force) {
      await ctx.scheduler.runAfter(0, internal.githubPull.processMergePullJob, {
        projectId: args.projectId,
        jobToken: importJobToken,
        branch,
      });
    } else {
      await ctx.scheduler.runAfter(0, internal.githubPull.processPullJob, {
        projectId: args.projectId,
        jobToken: importJobToken,
        branch,
      });
    }

    return {
      queued: true,
      branch,
      merge: Boolean(args.merge && changedCount > 0 && !args.force),
    };
  },
});

export const processMergePullJob = internalAction({
  args: {
    projectId: v.id("projects"),
    jobToken: v.string(),
    branch: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: true; fileCount: number; conflictCount: number }> => {
    const project = await ctx.runQuery(internal.githubPullMutations.getPullJob, {
      projectId: args.projectId,
    });

    if (!project) {
      throw new Error("Project not found");
    }
    if (project.importStatus !== "importing") {
      return { ok: true, fileCount: 0, conflictCount: 0 };
    }
    if (!project.importJobToken || project.importJobToken !== args.jobToken) {
      throw new Error("Pull job token mismatch");
    }
    if (project.source !== "github" || !project.githubRepoUrl) {
      throw new Error("This project is not linked to a GitHub repository");
    }

    try {
      const token = await getClerkGitHubToken(project.ownerId);
      if (!token) {
        throw new Error(
          "GitHub is not connected. Link your GitHub account to pull changes.",
        );
      }

      const mergeContext = await ctx.runQuery(
        internal.githubPullMutations.getMergePullContext,
        { projectId: args.projectId },
      );
      if (!mergeContext) {
        throw new Error("Project not found");
      }

      const { owner, repo } = parseRepoUrl(project.githubRepoUrl);
      const { files: remoteFiles, commitSha } = await fetchRepoFiles(
        token,
        owner,
        repo,
        args.branch,
      );
      if (remoteFiles.length === 0) {
        throw new Error("No importable files found on this branch.");
      }

      await ctx.runMutation(internal.githubPullMutations.setPullProgress, {
        projectId: args.projectId,
        totalFiles: remoteFiles.length,
        doneFiles: 0,
      });

      await ctx.runMutation(internal.githubPullMutations.clearMergeConflicts, {
        projectId: args.projectId,
      });

      const localByPath = new Map<string, MergePullFileRow>(
        (mergeContext.files as MergePullFileRow[]).map((file) => [file.path, file]),
      );
      const remoteByPath = new Map(
        remoteFiles.map((file) => [file.path, file.content]),
      );

      const allPaths = new Set([
        ...localByPath.keys(),
        ...remoteByPath.keys(),
      ]);

      const updates: Array<{
        path: string;
        content: string;
        syncedContent: string;
      }> = [];
      const newFiles: Array<{ path: string; content: string }> = [];
      const deletePaths: string[] = [];
      const conflicts: Array<{
        path: string;
        base: string;
        local: string;
        remote: string;
      }> = [];

      for (const path of allPaths) {
        const local = localByPath.get(path);
        const remoteContent = remoteByPath.get(path);

        if (local && remoteContent === undefined) {
          // Deleted on remote.
          if (local.changed) {
            conflicts.push({
              path,
              base: local.syncedContent,
              local: local.content,
              remote: "",
            });
          } else {
            deletePaths.push(path);
          }
          continue;
        }

        if (!local && remoteContent !== undefined) {
          // New on remote.
          newFiles.push({ path, content: remoteContent });
          continue;
        }

        if (!local || remoteContent === undefined) continue;

        const base = local.syncedContent;
        const localContent = local.content;
        const mergeResult = threeWayMerge(base, localContent, remoteContent);

        if (mergeResult.status === "unchanged") {
          continue;
        }

        if (mergeResult.status === "clean") {
          updates.push({
            path,
            content: mergeResult.merged,
            syncedContent: remoteContent,
          });
          continue;
        }

        conflicts.push({
          path,
          base,
          local: localContent,
          remote: remoteContent,
        });
      }

      const totalOps =
        updates.length + newFiles.length + deletePaths.length + conflicts.length;
      let doneOps = 0;

      const UPDATE_BATCH = 40;
      for (let i = 0; i < updates.length; i += UPDATE_BATCH) {
        const batch = updates.slice(i, i + UPDATE_BATCH);
        await ctx.runMutation(
          internal.githubPullMutations.applyMergeFileUpdates,
          {
            projectId: args.projectId,
            updates: batch,
            newFiles: [],
            deletePaths: [],
          },
        );
        doneOps += batch.length;
        await ctx.runMutation(internal.githubPullMutations.setPullProgress, {
          projectId: args.projectId,
          doneFiles: doneOps,
          totalFiles: totalOps,
        });
      }

      for (let i = 0; i < newFiles.length; i += UPDATE_BATCH) {
        const batch = newFiles.slice(i, i + UPDATE_BATCH);
        await ctx.runMutation(
          internal.githubPullMutations.applyMergeFileUpdates,
          {
            projectId: args.projectId,
            updates: [],
            newFiles: batch,
            deletePaths: [],
          },
        );
        doneOps += batch.length;
        await ctx.runMutation(internal.githubPullMutations.setPullProgress, {
          projectId: args.projectId,
          doneFiles: doneOps,
          totalFiles: totalOps,
        });
      }

      if (deletePaths.length > 0) {
        await ctx.runMutation(
          internal.githubPullMutations.applyMergeFileUpdates,
          {
            projectId: args.projectId,
            updates: [],
            newFiles: [],
            deletePaths,
          },
        );
        doneOps += deletePaths.length;
      }

      if (conflicts.length > 0) {
        await ctx.runMutation(
          internal.githubPullMutations.insertMergeConflicts,
          {
            projectId: args.projectId,
            conflicts,
          },
        );
        doneOps += conflicts.length;
      }

      await ctx.runMutation(internal.githubPullMutations.completePullJob, {
        projectId: args.projectId,
        commitSha,
        githubBranch: args.branch,
        fileCount: remoteFiles.length,
      });

      await ctx.runMutation(internal.githubPullMutations.setPullProgress, {
        projectId: args.projectId,
        doneFiles: totalOps,
        totalFiles: totalOps,
      });

      return {
        ok: true,
        fileCount: remoteFiles.length,
        conflictCount: conflicts.length,
      };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Failed to merge pull from GitHub";
      await ctx.runMutation(internal.githubPullMutations.failPullJob, {
        projectId: args.projectId,
        reason,
      });
      throw error;
    }
  },
});

export const processPullJob = internalAction({
  args: {
    projectId: v.id("projects"),
    jobToken: v.string(),
    branch: v.string(),
  },
  handler: async (ctx, args): Promise<{ ok: true; fileCount: number }> => {
    const project = await ctx.runQuery(internal.githubPullMutations.getPullJob, {
      projectId: args.projectId,
    });

    if (!project) {
      throw new Error("Project not found");
    }
    if (project.importStatus !== "importing") {
      return { ok: true, fileCount: 0 };
    }
    if (!project.importJobToken || project.importJobToken !== args.jobToken) {
      throw new Error("Pull job token mismatch");
    }
    if (project.source !== "github" || !project.githubRepoUrl) {
      throw new Error("This project is not linked to a GitHub repository");
    }

    try {
      const token = await getClerkGitHubToken(project.ownerId);
      if (!token) {
        throw new Error(
          "GitHub is not connected. Link your GitHub account to pull changes.",
        );
      }

      const { owner, repo } = parseRepoUrl(project.githubRepoUrl);
      const { files, commitSha } = await fetchRepoFiles(
        token,
        owner,
        repo,
        args.branch,
      );
      if (files.length === 0) {
        throw new Error("No importable files found on this branch.");
      }

      await ctx.runMutation(internal.githubPullMutations.setPullProgress, {
        projectId: args.projectId,
        totalFiles: files.length,
        doneFiles: 0,
      });

      // Clear existing files in batches to stay under transaction limits.
      for (;;) {
        const { remaining } = await ctx.runMutation(
          internal.githubPullMutations.clearProjectFilesBatch,
          {
            projectId: args.projectId,
            limit: DELETE_BATCH_SIZE,
          },
        );
        if (remaining === 0) break;
      }

      for (let i = 0; i < files.length; i += WRITE_BATCH_SIZE) {
        const batch = files.slice(i, i + WRITE_BATCH_SIZE);
        await ctx.runMutation(internal.githubPullMutations.insertFilesBatch, {
          projectId: args.projectId,
          files: batch,
        });
        await ctx.runMutation(internal.githubPullMutations.setPullProgress, {
          projectId: args.projectId,
          doneFiles: Math.min(i + batch.length, files.length),
          totalFiles: files.length,
        });
      }

      await ctx.runMutation(internal.githubPullMutations.completePullJob, {
        projectId: args.projectId,
        commitSha,
        githubBranch: args.branch,
        fileCount: files.length,
      });

      return { ok: true, fileCount: files.length };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Failed to pull from GitHub";
      await ctx.runMutation(internal.githubPullMutations.failPullJob, {
        projectId: args.projectId,
        reason,
      });
      throw error;
    }
  },
});
