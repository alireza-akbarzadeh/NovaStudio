import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";

export const getConnection = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const connection = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!connection) return null;

    return {
      _id: connection._id,
      email: connection.email,
      displayName: connection.displayName,
      avatarUrl: connection.avatarUrl,
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
      throw new Error("Sign in to disconnect Google Calendar");
    }

    const existing = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const disconnectForUser = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const upsertConnection = internalMutation({
  args: {
    userId: v.string(),
    googleUserId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        googleUserId: args.googleUserId,
        email: args.email,
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("googleCalendarConnections", {
      userId: args.userId,
      googleUserId: args.googleUserId,
      email: args.email,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      connectedAt: now,
      updatedAt: now,
    });
  },
});
