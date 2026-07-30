import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { isKnownPluginId } from "./lib/pluginIds";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    return await ctx.db
      .query("userPlugins")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const install = mutation({
  args: {
    pluginId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!isKnownPluginId(args.pluginId)) {
      throw new Error("Unknown plugin");
    }

    const existing = await ctx.db
      .query("userPlugins")
      .withIndex("by_user_plugin", (q) =>
        q.eq("userId", identity.subject).eq("pluginId", args.pluginId),
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("userPlugins", {
      userId: identity.subject,
      pluginId: args.pluginId,
      installedAt: now,
      updatedAt: now,
    });
  },
});

export const uninstall = mutation({
  args: {
    pluginId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const existing = await ctx.db
      .query("userPlugins")
      .withIndex("by_user_plugin", (q) =>
        q.eq("userId", identity.subject).eq("pluginId", args.pluginId),
      )
      .unique();

    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
