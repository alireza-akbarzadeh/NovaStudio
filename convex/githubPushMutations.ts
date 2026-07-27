import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import { isProjectFileChanged } from "./lib/projectFiles";
import {
  hashContent,
  readFileContent,
  upsertFileContent,
} from "./lib/projectFileContents";

export const getPushContext = internalQuery({
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

    const stagedFiles = files.filter(
      (file) =>
        isProjectFileChanged(file, project.syncedAt) && file.staged === true,
    );

    const changedFiles = [];
    for (const file of stagedFiles) {
      const body = await readFileContent(ctx, args.projectId, file.path, file);
      changedFiles.push({
        path: file.path,
        content: body.content,
      });
    }

    return {
      project,
      changedFiles,
    };
  },
});

export const setExportStatus = internalMutation({
  args: {
    projectId: v.id("projects"),
    status: v.union(
      v.literal("exporting"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      exportStatus: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const completePush = internalMutation({
  args: {
    projectId: v.id("projects"),
    commitSha: v.string(),
    pushedPaths: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const pathSet = new Set(args.pushedPaths);

    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const file of files) {
      if (file.kind !== "file" || !pathSet.has(file.path)) {
        continue;
      }
      const body = await readFileContent(ctx, args.projectId, file.path, file);
      const syncedHash = hashContent(body.content);
      await upsertFileContent(ctx, {
        projectId: args.projectId,
        path: file.path,
        content: body.content,
        syncedContent: body.content,
      });
      await ctx.db.patch(file._id, {
        content: undefined,
        syncedContent: undefined,
        contentHash: syncedHash,
        syncedContentHash: syncedHash,
        staged: false,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.projectId, {
      exportStatus: "completed",
      lastCommitSha: args.commitSha,
      syncedAt: now,
      updatedAt: now,
    });
  },
});

export const failPush = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      exportStatus: "failed",
      updatedAt: Date.now(),
    });
  },
});
