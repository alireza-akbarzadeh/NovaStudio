import { v } from "convex/values";

import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";

const transportValidator = v.union(v.literal("sse"), v.literal("http"));

function safeServerRow(server: {
  _id: string;
  name: string;
  transport: "sse" | "http";
  url: string;
  authHeader?: string;
  enabled: boolean;
  lastVerifiedAt?: number;
  createdAt: number;
  updatedAt: number;
}) {
  let host = server.url;
  try {
    host = new URL(server.url).host;
  } catch {
    // keep raw url prefix
  }

  return {
    _id: server._id,
    name: server.name,
    transport: server.transport,
    urlHost: host,
    enabled: server.enabled,
    verified: Boolean(server.lastVerifiedAt),
    lastVerifiedAt: server.lastVerifiedAt,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    const rows = await ctx.db
      .query("userMcpServers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return rows
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((row) => safeServerRow(row));
  },
});

export const remove = mutation({
  args: { serverId: v.id("userMcpServers") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const row = await ctx.db.get(args.serverId);
    if (!row || row.userId !== identity.subject) {
      throw new Error("MCP server not found");
    }
    await ctx.db.delete(args.serverId);
  },
});

export const setEnabled = mutation({
  args: {
    serverId: v.id("userMcpServers"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const row = await ctx.db.get(args.serverId);
    if (!row || row.userId !== identity.subject) {
      throw new Error("MCP server not found");
    }
    await ctx.db.patch(args.serverId, {
      enabled: args.enabled,
      updatedAt: Date.now(),
    });
  },
});

export const getForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userMcpServers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const upsertFromConnect = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
    transport: transportValidator,
    url: v.string(),
    authHeader: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("userMcpServers")
      .withIndex("by_user_name", (q) =>
        q.eq("userId", args.userId).eq("name", args.name),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        transport: args.transport,
        url: args.url,
        authHeader: args.authHeader,
        enabled: true,
        lastVerifiedAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("userMcpServers", {
      userId: args.userId,
      name: args.name,
      transport: args.transport,
      url: args.url,
      authHeader: args.authHeader,
      enabled: true,
      lastVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});
