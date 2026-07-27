import { v } from "convex/values";

import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

export const getConnection = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const connection = await ctx.db
      .query("notionConnections")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!connection) return null;

    return {
      _id: connection._id,
      parentPageId: connection.parentPageId,
      parentPageTitle: connection.parentPageTitle,
      workspaceName: connection.workspaceName,
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
      throw new Error("Sign in to disconnect Notion");
    }

    const connection = await ctx.db
      .query("notionConnections")
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
      .query("notionConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const upsertConnection = internalMutation({
  args: {
    userId: v.string(),
    apiKey: v.string(),
    parentPageId: v.string(),
    parentPageTitle: v.optional(v.string()),
    workspaceName: v.optional(v.string()),
    viewerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("notionConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        apiKey: args.apiKey,
        parentPageId: args.parentPageId,
        parentPageTitle: args.parentPageTitle,
        workspaceName: args.workspaceName,
        viewerName: args.viewerName,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("notionConnections", {
      userId: args.userId,
      apiKey: args.apiKey,
      parentPageId: args.parentPageId,
      parentPageTitle: args.parentPageTitle,
      workspaceName: args.workspaceName,
      viewerName: args.viewerName,
      connectedAt: now,
      updatedAt: now,
    });
  },
});
