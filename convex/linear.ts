import { v } from "convex/values";

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { verifyProjectWriteAccess } from "./lib/projectFiles";

export const getConnection = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const connection = await ctx.db
      .query("linearConnections")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!connection) return null;

    return {
      _id: connection._id,
      organizationName: connection.organizationName,
      viewerName: connection.viewerName,
      connectedAt: connection.connectedAt,
      updatedAt: connection.updatedAt,
    };
  },
});

export const disconnect = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to disconnect Linear");
    }

    const connection = await ctx.db
      .query("linearConnections")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (connection) {
      await ctx.db.delete(connection._id);
    }
  },
});

export const getConnectionForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("linearConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const upsertConnection = internalMutation({
  args: {
    userId: v.string(),
    apiKey: v.string(),
    organizationName: v.optional(v.string()),
    viewerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("linearConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        apiKey: args.apiKey,
        organizationName: args.organizationName,
        viewerName: args.viewerName,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("linearConnections", {
      userId: args.userId,
      apiKey: args.apiKey,
      organizationName: args.organizationName,
      viewerName: args.viewerName,
      connectedAt: now,
      updatedAt: now,
    });
  },
});

export const getProjectLink = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    await verifyProjectWriteAccess(ctx, args.projectId);

    const link = await ctx.db
      .query("projectLinearLinks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();

    if (!link) return null;

    return {
      _id: link._id,
      issueId: link.issueId,
      issueIdentifier: link.issueIdentifier,
      issueTitle: link.issueTitle,
      issueUrl: link.issueUrl,
      linkedAt: link.linkedAt,
      updatedAt: link.updatedAt,
    };
  },
});

export const unlinkProjectIssue = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to unlink a Linear issue");
    }

    await verifyProjectWriteAccess(ctx, args.projectId);

    const link = await ctx.db
      .query("projectLinearLinks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();

    if (link) {
      await ctx.db.delete(link._id);
    }
  },
});

export const upsertProjectLink = internalMutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    issueId: v.string(),
    issueIdentifier: v.string(),
    issueTitle: v.string(),
    issueUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("projectLinearLinks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        issueId: args.issueId,
        issueIdentifier: args.issueIdentifier,
        issueTitle: args.issueTitle,
        issueUrl: args.issueUrl,
        linkedBy: args.userId,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("projectLinearLinks", {
      projectId: args.projectId,
      issueId: args.issueId,
      issueIdentifier: args.issueIdentifier,
      issueTitle: args.issueTitle,
      issueUrl: args.issueUrl,
      linkedBy: args.userId,
      linkedAt: now,
      updatedAt: now,
    });
  },
});

export const getSyncContextWithIssue = internalQuery({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const base = await ctx.db.get(args.projectId);
    const connection = await ctx.db
      .query("linearConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    const link = await ctx.db
      .query("projectLinearLinks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();

    if (!base || !connection || !link) return null;

    return {
      projectName: base.name,
      apiKey: connection.apiKey,
      issueId: link.issueId,
      issueIdentifier: link.issueIdentifier,
    };
  },
});
