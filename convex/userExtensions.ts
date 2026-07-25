import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { verifyAuth } from "./auth";
import {
  isKnownExtensionId,
  isThemeExtensionId,
} from "./lib/extensionIds";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    return await ctx.db
      .query("userExtensions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const install = mutation({
  args: {
    extensionId: v.string(),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!isKnownExtensionId(args.extensionId)) {
      throw new Error("Unknown extension");
    }
    if (!args.version.trim()) {
      throw new Error("Version is required");
    }

    const existing = await ctx.db
      .query("userExtensions")
      .withIndex("by_user_extension", (q) =>
        q.eq("userId", identity.subject).eq("extensionId", args.extensionId),
      )
      .unique();

    const now = Date.now();
    const isTheme = isThemeExtensionId(args.extensionId);

    if (isTheme) {
      await disableOtherThemes(ctx, identity.subject, args.extensionId);
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        version: args.version,
        enabled: true,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("userExtensions", {
      userId: identity.subject,
      extensionId: args.extensionId,
      version: args.version,
      enabled: true,
      installedAt: now,
      updatedAt: now,
    });
  },
});

export const uninstall = mutation({
  args: {
    extensionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const existing = await ctx.db
      .query("userExtensions")
      .withIndex("by_user_extension", (q) =>
        q.eq("userId", identity.subject).eq("extensionId", args.extensionId),
      )
      .unique();

    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});

export const setEnabled = mutation({
  args: {
    extensionId: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!isKnownExtensionId(args.extensionId)) {
      throw new Error("Unknown extension");
    }

    const existing = await ctx.db
      .query("userExtensions")
      .withIndex("by_user_extension", (q) =>
        q.eq("userId", identity.subject).eq("extensionId", args.extensionId),
      )
      .unique();

    if (!existing) {
      throw new Error("Extension is not installed");
    }

    const now = Date.now();

    // Themes: enabling one activates it (and disables other themes).
    if (args.enabled && isThemeExtensionId(args.extensionId)) {
      await disableOtherThemes(ctx, identity.subject, args.extensionId);
    }

    await ctx.db.patch(existing._id, {
      enabled: args.enabled,
      updatedAt: now,
    });
    return existing._id;
  },
});

/** Activate a theme extension (installs if needed via enable-only path). */
export const setActiveTheme = mutation({
  args: {
    extensionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!isThemeExtensionId(args.extensionId)) {
      throw new Error("Not a theme extension");
    }

    const existing = await ctx.db
      .query("userExtensions")
      .withIndex("by_user_extension", (q) =>
        q.eq("userId", identity.subject).eq("extensionId", args.extensionId),
      )
      .unique();

    if (!existing) {
      throw new Error("Theme is not installed");
    }

    const now = Date.now();
    await disableOtherThemes(ctx, identity.subject, args.extensionId);
    await ctx.db.patch(existing._id, {
      enabled: true,
      updatedAt: now,
    });
    return existing._id;
  },
});

async function disableOtherThemes(
  ctx: MutationCtx,
  userId: string,
  exceptExtensionId: string,
) {
  const installs = await ctx.db
    .query("userExtensions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const now = Date.now();
  for (const row of installs) {
    if (
      row.extensionId !== exceptExtensionId &&
      isThemeExtensionId(row.extensionId) &&
      row.enabled
    ) {
      await ctx.db.patch(row._id, { enabled: false, updatedAt: now });
    }
  }
}
