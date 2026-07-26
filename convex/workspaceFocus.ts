import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { verifyProjectAccess } from "./lib/projectAccess";

const focusView = v.union(
  v.literal("code"),
  v.literal("preview"),
  v.literal("other"),
);

/**
 * Publish where the current user is looking in the workspace
 * (file, Code/Preview, preview URL path, terminal cwd).
 */
export const upsertMyFocus = mutation({
  args: {
    projectId: v.id("projects"),
    openFile: v.union(v.string(), v.null()),
    view: focusView,
    previewPath: v.union(v.string(), v.null()),
    terminalCwd: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    await verifyProjectAccess(ctx, args.projectId);

    const existing = await ctx.db
      .query("workspaceFocus")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", identity.subject),
      )
      .unique();

    const payload = {
      openFile: args.openFile,
      view: args.view,
      previewPath: args.previewPath,
      terminalCwd: args.terminalCwd,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("workspaceFocus", {
      projectId: args.projectId,
      userId: identity.subject,
      ...payload,
    });
  },
});

/** List recent focus locations for everyone in the project. */
export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    const rows = await ctx.db
      .query("workspaceFocus")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const cutoff = Date.now() - 5 * 60_000;
    return rows
      .filter((row) => row.updatedAt >= cutoff)
      .map((row) => ({
        userId: row.userId,
        openFile: row.openFile,
        view: row.view,
        previewPath: row.previewPath,
        terminalCwd: row.terminalCwd,
        updatedAt: row.updatedAt,
      }));
  },
});
