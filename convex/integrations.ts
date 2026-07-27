import { v } from "convex/values";

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

const webhookProviderValidator = v.union(
  v.literal("slack"),
  v.literal("discord"),
);

export const getConnection = query({
  args: { provider: webhookProviderValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const connection = await ctx.db
      .query("integrationConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", identity.subject).eq("provider", args.provider),
      )
      .unique();

    if (!connection) return null;

    return {
      _id: connection._id,
      provider: connection.provider,
      channelLabel: connection.channelLabel,
      notifyOnDeploy: connection.notifyOnDeploy ?? true,
      connectedAt: connection.connectedAt,
      updatedAt: connection.updatedAt,
    };
  },
});

export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const connections = await ctx.db
      .query("integrationConnections")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return connections.map((connection) => ({
      _id: connection._id,
      provider: connection.provider,
      channelLabel: connection.channelLabel,
      notifyOnDeploy: connection.notifyOnDeploy ?? true,
      connectedAt: connection.connectedAt,
      updatedAt: connection.updatedAt,
    }));
  },
});

export const disconnect = mutation({
  args: { provider: webhookProviderValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to disconnect");
    }

    const connection = await ctx.db
      .query("integrationConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", identity.subject).eq("provider", args.provider),
      )
      .unique();

    if (connection) {
      await ctx.db.delete(connection._id);
    }
  },
});

export const upsertConnection = internalMutation({
  args: {
    userId: v.string(),
    provider: webhookProviderValidator,
    webhookUrl: v.string(),
    channelLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("integrationConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        webhookUrl: args.webhookUrl,
        channelLabel: args.channelLabel,
        notifyOnDeploy: true,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("integrationConnections", {
      userId: args.userId,
      provider: args.provider,
      webhookUrl: args.webhookUrl,
      channelLabel: args.channelLabel,
      notifyOnDeploy: true,
      connectedAt: now,
      updatedAt: now,
    });
  },
});

export const listDeployNotificationTargets = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("integrationConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return connections
      .filter((connection) => connection.notifyOnDeploy !== false)
      .map((connection) => ({
        provider: connection.provider,
        webhookUrl: connection.webhookUrl,
      }));
  },
});
