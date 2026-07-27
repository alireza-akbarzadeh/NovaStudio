import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, internalQuery } from "./_generated/server";
import { insertImportedFileBatch, deleteProjectFilesBatch, replaceProjectFilesFromImport } from "./lib/importProjectFiles";
import {
  hashContent,
  readFileContent,
  upsertFileContent,
  deleteFileContent,
} from "./lib/projectFileContents";
import { isProjectFileChanged } from "./lib/projectFiles";

export const getPullContext = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) {
      return null;
    }

    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const changedCount = files.filter((file) =>
      isProjectFileChanged(file, project.syncedAt),
    ).length;

    return {
      project,
      changedCount,
    };
  },
});

export const getMergePullContext = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const fileRows: Array<{
      path: string;
      kind: "file" | "folder";
      content: string;
      syncedContent: string;
      changed: boolean;
    }> = [];

    for (const file of files) {
      if (file.kind !== "file") continue;
      const body = await readFileContent(ctx, args.projectId, file.path, file);
      fileRows.push({
        path: file.path,
        kind: file.kind,
        content: body.content ?? "",
        syncedContent: body.syncedContent ?? "",
        changed: isProjectFileChanged(
          {
            kind: "file" as const,
            content: body.content,
            syncedContent: body.syncedContent,
            contentHash: file.contentHash,
            syncedContentHash: file.syncedContentHash,
            updatedAt: file.updatedAt,
          },
          project.syncedAt,
        ),
      });
    }

    return {
      project,
      files: fileRows,
    };
  },
});

export const clearMergeConflicts = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("projectMergeConflicts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
  },
});

export const insertMergeConflicts = internalMutation({
  args: {
    projectId: v.id("projects"),
    conflicts: v.array(
      v.object({
        path: v.string(),
        base: v.string(),
        local: v.string(),
        remote: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const conflict of args.conflicts) {
      const existing = await ctx.db
        .query("projectMergeConflicts")
        .withIndex("by_project_path", (q) =>
          q.eq("projectId", args.projectId).eq("path", conflict.path),
        )
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          base: conflict.base,
          local: conflict.local,
          remote: conflict.remote,
          createdAt: now,
        });
      } else {
        await ctx.db.insert("projectMergeConflicts", {
          projectId: args.projectId,
          path: conflict.path,
          base: conflict.base,
          local: conflict.local,
          remote: conflict.remote,
          createdAt: now,
        });
      }
    }
  },
});

export const applyMergeFileUpdates = internalMutation({
  args: {
    projectId: v.id("projects"),
    updates: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
        syncedContent: v.string(),
      }),
    ),
    newFiles: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
      }),
    ),
    deletePaths: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const update of args.updates) {
      const file = await ctx.db
        .query("projectFiles")
        .withIndex("by_project_path", (q) =>
          q.eq("projectId", args.projectId).eq("path", update.path),
        )
        .unique();
      if (!file || file.kind !== "file") continue;

      const contentHash = hashContent(update.content);
      const syncedHash = hashContent(update.syncedContent);
      await upsertFileContent(
        ctx,
        {
          projectId: args.projectId,
          path: update.path,
          content: update.content,
          syncedContent: update.syncedContent,
        },
        { skipSearchIndex: true },
      );
      await ctx.db.patch(file._id, {
        content: undefined,
        syncedContent: undefined,
        contentHash,
        syncedContentHash: syncedHash,
        staged: update.content !== update.syncedContent,
        updatedAt: now,
      });
    }

    if (args.newFiles.length > 0) {
      await insertImportedFileBatch(ctx, args.projectId, args.newFiles);
    }

    for (const path of args.deletePaths) {
      await deleteFileContent(ctx, args.projectId, path);
      const file = await ctx.db
        .query("projectFiles")
        .withIndex("by_project_path", (q) =>
          q.eq("projectId", args.projectId).eq("path", path),
        )
        .unique();
      if (file) {
        await ctx.db.delete(file._id);
      }
    }
  },
});

export const replaceFiles = internalMutation({
  args: {
    projectId: v.id("projects"),
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
      }),
    ),
    commitSha: v.string(),
    githubBranch: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await replaceProjectFilesFromImport(ctx, {
      projectId: args.projectId,
      files: args.files,
      commitSha: args.commitSha,
      githubBranch: args.githubBranch,
    });
  },
});

export const setBranch = internalMutation({
  args: {
    projectId: v.id("projects"),
    githubBranch: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      githubBranch: args.githubBranch,
      updatedAt: Date.now(),
    });
  },
});

export const queuePullJob = internalMutation({
  args: {
    projectId: v.id("projects"),
    githubBranch: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    const now = Date.now();
    const importJobToken = `${now}-${Math.random().toString(36).slice(2, 12)}`;
    await ctx.db.patch(args.projectId, {
      importStatus: "importing",
      importStartedAt: now,
      importJobToken,
      githubBranch: args.githubBranch,
      importTotalFiles: undefined,
      importDoneFiles: 0,
      updatedAt: now,
    });
    return { importJobToken };
  },
});

export const getPullJob = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) return null;
    return {
      _id: project._id,
      ownerId: project.ownerId,
      source: project.source,
      githubRepoUrl: project.githubRepoUrl,
      githubBranch: project.githubBranch,
      importStatus: project.importStatus,
      importStartedAt: project.importStartedAt,
      importJobToken: project.importJobToken,
    };
  },
});

export const setPullProgress = internalMutation({
  args: {
    projectId: v.id("projects"),
    totalFiles: v.optional(v.number()),
    doneFiles: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.importStatus !== "importing") return;
    await ctx.db.patch(args.projectId, {
      ...(args.totalFiles !== undefined
        ? { importTotalFiles: args.totalFiles }
        : {}),
      ...(args.doneFiles !== undefined
        ? { importDoneFiles: args.doneFiles }
        : {}),
      updatedAt: Date.now(),
    });
  },
});

export const clearProjectFilesBatch = internalMutation({
  args: {
    projectId: v.id("projects"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const remaining = await deleteProjectFilesBatch(
      ctx,
      args.projectId,
      args.limit,
    );
    return { remaining };
  },
});

export const insertFilesBatch = internalMutation({
  args: {
    projectId: v.id("projects"),
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await insertImportedFileBatch(ctx, args.projectId, args.files);
  },
});

export const completePullJob = internalMutation({
  args: {
    projectId: v.id("projects"),
    commitSha: v.string(),
    githubBranch: v.string(),
    fileCount: v.number(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.importStatus !== "importing") return;
    const now = Date.now();
    await ctx.db.patch(args.projectId, {
      lastCommitSha: args.commitSha,
      syncedAt: now,
      updatedAt: now,
      githubBranch: args.githubBranch,
      importStatus: "completed",
      importStartedAt: undefined,
      importJobToken: undefined,
      importTotalFiles: args.fileCount,
      importDoneFiles: args.fileCount,
    });

    await ctx.scheduler.runAfter(0, internal.projectFiles.migrateInlineContentBatch, {
      projectId: args.projectId,
      limit: 40,
    });
    await ctx.scheduler.runAfter(0, internal.projectSearch.scheduleSearchIndexBackfill, {
      projectId: args.projectId,
    });
  },
});

export const failPullJob = internalMutation({
  args: {
    projectId: v.id("projects"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) return;
    await ctx.db.patch(args.projectId, {
      importStatus: "failed",
      importStartedAt: undefined,
      importJobToken: undefined,
      importTotalFiles: undefined,
      importDoneFiles: undefined,
      updatedAt: Date.now(),
    });
  },
});
