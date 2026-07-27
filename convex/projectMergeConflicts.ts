import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { hashContent, upsertFileContent } from "./lib/projectFileContents";
import { verifyProjectWriteAccess } from "./lib/projectFiles";
import { mergeBothSides } from "./lib/threeWayMerge";

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const rows = await ctx.db
      .query("projectMergeConflicts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return rows
      .map((row) => ({
        id: row._id,
        path: row.path,
        base: row.base,
        local: row.local,
        remote: row.remote,
        createdAt: row.createdAt,
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  },
});

export const resolveConflict = mutation({
  args: {
    conflictId: v.id("projectMergeConflicts"),
    resolution: v.union(
      v.literal("local"),
      v.literal("remote"),
      v.literal("both"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const conflict = await ctx.db.get(args.conflictId);
    if (!conflict) {
      throw new Error("Conflict not found");
    }

    await verifyProjectWriteAccess(ctx, conflict.projectId);

    const file = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", conflict.projectId).eq("path", conflict.path),
      )
      .unique();

    if (!file || file.kind !== "file") {
      await ctx.db.delete(args.conflictId);
      throw new Error("File no longer exists");
    }

    let resolvedContent: string;
    switch (args.resolution) {
      case "local":
        resolvedContent = conflict.local;
        break;
      case "remote":
        resolvedContent = conflict.remote;
        break;
      case "both":
        resolvedContent = mergeBothSides(
          conflict.base,
          conflict.local,
          conflict.remote,
        );
        break;
    }

    const now = Date.now();
    const contentHash = hashContent(resolvedContent);
    const syncedHash = hashContent(conflict.remote);

    await upsertFileContent(ctx, {
      projectId: conflict.projectId,
      path: conflict.path,
      content: resolvedContent,
      syncedContent: conflict.remote,
    });

    await ctx.db.patch(file._id, {
      content: undefined,
      syncedContent: undefined,
      contentHash,
      syncedContentHash: syncedHash,
      staged: resolvedContent !== conflict.remote,
      updatedAt: now,
    });

    await ctx.db.delete(args.conflictId);

    const remaining = await ctx.db
      .query("projectMergeConflicts")
      .withIndex("by_project", (q) => q.eq("projectId", conflict.projectId))
      .collect();

    return {
      path: conflict.path,
      remainingCount: remaining.length,
    };
  },
});
