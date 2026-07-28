import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";

export const customizeItemKind = v.union(
  v.literal("subagent"),
  v.literal("hook"),
  v.literal("command"),
  v.literal("rule"),
);

export const hookPhase = v.union(v.literal("pre"), v.literal("post"));

const MAX_CONTENT = 12_000;
const MAX_NAME = 64;
const MAX_DESCRIPTION = 280;

function slugifyName(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_NAME);
  if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
    throw new Error(
      "Name must start with a letter and use lowercase letters, numbers, and hyphens",
    );
  }
  return slug;
}

function validateContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Content is required");
  if (trimmed.length > MAX_CONTENT) {
    throw new Error(`Content is too long (max ${MAX_CONTENT} characters)`);
  }
  return trimmed;
}

function validateDescription(description: string) {
  const trimmed = description.trim();
  if (!trimmed) throw new Error("Description is required");
  if (trimmed.length > MAX_DESCRIPTION) {
    throw new Error(`Description is too long (max ${MAX_DESCRIPTION} characters)`);
  }
  return trimmed;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    const rows = await ctx.db
      .query("userCustomizeItems")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return rows.sort(
      (a, b) =>
        a.kind.localeCompare(b.kind) ||
        a.name.localeCompare(b.name),
    );
  },
});

export const listEnabled = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    const rows = await ctx.db
      .query("userCustomizeItems")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return rows.filter((row) => row.enabled);
  },
});

export const upsert = mutation({
  args: {
    itemId: v.optional(v.id("userCustomizeItems")),
    kind: customizeItemKind,
    name: v.string(),
    description: v.string(),
    content: v.string(),
    hookPhase: v.optional(hookPhase),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const name = slugifyName(args.name);
    const description = validateDescription(args.description);
    const content = validateContent(args.content);
    const now = Date.now();

    if (args.kind === "hook" && !args.hookPhase) {
      throw new Error("Choose pre or post for hooks");
    }
    if (args.kind !== "hook" && args.hookPhase) {
      throw new Error("hookPhase applies to hooks only");
    }

    if (args.itemId) {
      const existing = await ctx.db.get(args.itemId);
      if (!existing || existing.userId !== identity.subject) {
        throw new Error("Item not found");
      }
      if (existing.kind !== args.kind) {
        throw new Error("Cannot change item kind");
      }

      const nameConflict = await ctx.db
        .query("userCustomizeItems")
        .withIndex("by_user_kind_name", (q) =>
          q.eq("userId", identity.subject).eq("kind", args.kind).eq("name", name),
        )
        .unique();
      if (nameConflict && nameConflict._id !== args.itemId) {
        throw new Error(`A ${args.kind} named “${name}” already exists`);
      }

      await ctx.db.patch(args.itemId, {
        name,
        description,
        content,
        hookPhase: args.kind === "hook" ? args.hookPhase : undefined,
        enabled: args.enabled ?? existing.enabled,
        updatedAt: now,
      });
      return args.itemId;
    }

    const duplicate = await ctx.db
      .query("userCustomizeItems")
      .withIndex("by_user_kind_name", (q) =>
        q.eq("userId", identity.subject).eq("kind", args.kind).eq("name", name),
      )
      .unique();
    if (duplicate) {
      throw new Error(`A ${args.kind} named “${name}” already exists`);
    }

    return await ctx.db.insert("userCustomizeItems", {
      userId: identity.subject,
      kind: args.kind,
      name,
      description,
      content,
      hookPhase: args.kind === "hook" ? args.hookPhase : undefined,
      enabled: args.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { itemId: v.id("userCustomizeItems") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const row = await ctx.db.get(args.itemId);
    if (!row || row.userId !== identity.subject) {
      throw new Error("Item not found");
    }
    await ctx.db.delete(args.itemId);
  },
});

export const setEnabled = mutation({
  args: {
    itemId: v.id("userCustomizeItems"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const row = await ctx.db.get(args.itemId);
    if (!row || row.userId !== identity.subject) {
      throw new Error("Item not found");
    }
    await ctx.db.patch(args.itemId, {
      enabled: args.enabled,
      updatedAt: Date.now(),
    });
  },
});
