import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  identityDisplayName,
  resolveProjectAccess,
  verifyProjectAccess,
} from "./lib/projectAccess";

const aiChatMode = v.union(v.literal("plan"), v.literal("task"));
const MAX_TITLE = 120;
const MAX_SUBTITLE = 200;
const MAX_MESSAGES = 200;
const MAX_MESSAGES_BYTES = 900_000;

function trimMessages(messages: unknown): unknown {
  if (!Array.isArray(messages)) return [];
  let trimmed = messages.slice(-MAX_MESSAGES);
  while (
    trimmed.length > 1 &&
    JSON.stringify(trimmed).length > MAX_MESSAGES_BYTES
  ) {
    trimmed = trimmed.slice(1);
  }
  return trimmed;
}

function toSessionRow(row: {
  _id: string;
  clientId: string;
  title: string;
  subtitle?: string;
  mode: "plan" | "task";
  messages: unknown;
  createdByUserId: string;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: row.clientId,
    title: row.title,
    subtitle: row.subtitle,
    mode: row.mode,
    messages: Array.isArray(row.messages) ? row.messages : [],
    createdByUserId: row.createdByUserId,
    createdByName: row.createdByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    const rows = await ctx.db
      .query("projectAiChatSessions")
      .withIndex("by_project_updated", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    return rows.map(toSessionRow);
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    clientId: v.string(),
    title: v.optional(v.string()),
    mode: v.optional(aiChatMode),
  },
  handler: async (ctx, args) => {
    const access = await resolveProjectAccess(ctx, args.projectId);
    if (!access) {
      throw new Error("Unauthorized access to this project");
    }

    const existing = await ctx.db
      .query("projectAiChatSessions")
      .withIndex("by_project_client", (q) =>
        q.eq("projectId", args.projectId).eq("clientId", args.clientId),
      )
      .unique();
    if (existing) {
      return existing.clientId;
    }

    const identity = await ctx.auth.getUserIdentity();
    const now = Date.now();
    await ctx.db.insert("projectAiChatSessions", {
      projectId: args.projectId,
      clientId: args.clientId,
      title: (args.title ?? "New chat").trim().slice(0, MAX_TITLE) || "New chat",
      subtitle: "Start a conversation",
      mode: args.mode ?? "task",
      messages: [],
      createdByUserId: access.userId,
      createdByName: identity ? identityDisplayName(identity) : undefined,
      createdAt: now,
      updatedAt: now,
    });

    return args.clientId;
  },
});

export const save = mutation({
  args: {
    projectId: v.id("projects"),
    clientId: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    mode: aiChatMode,
    messages: v.any(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const access = await resolveProjectAccess(ctx, args.projectId);
    if (!access) {
      throw new Error("Unauthorized access to this project");
    }

    const identity = await ctx.auth.getUserIdentity();
    const now = Date.now();
    const title = args.title.trim().slice(0, MAX_TITLE) || "New chat";
    const subtitle = args.subtitle?.trim().slice(0, MAX_SUBTITLE);
    const messages = trimMessages(args.messages);

    const existing = await ctx.db
      .query("projectAiChatSessions")
      .withIndex("by_project_client", (q) =>
        q.eq("projectId", args.projectId).eq("clientId", args.clientId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title,
        subtitle,
        mode: args.mode,
        messages,
        updatedAt: Math.max(args.updatedAt, now),
      });
      return existing.clientId;
    }

    await ctx.db.insert("projectAiChatSessions", {
      projectId: args.projectId,
      clientId: args.clientId,
      title,
      subtitle,
      mode: args.mode,
      messages,
      createdByUserId: access.userId,
      createdByName: identity ? identityDisplayName(identity) : undefined,
      createdAt: now,
      updatedAt: Math.max(args.updatedAt, now),
    });

    return args.clientId;
  },
});

export const remove = mutation({
  args: {
    projectId: v.id("projects"),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    const existing = await ctx.db
      .query("projectAiChatSessions")
      .withIndex("by_project_client", (q) =>
        q.eq("projectId", args.projectId).eq("clientId", args.clientId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const migrateBatch = mutation({
  args: {
    projectId: v.id("projects"),
    sessions: v.array(
      v.object({
        clientId: v.string(),
        title: v.string(),
        subtitle: v.optional(v.string()),
        mode: aiChatMode,
        messages: v.any(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const access = await resolveProjectAccess(ctx, args.projectId);
    if (!access) {
      throw new Error("Unauthorized access to this project");
    }

    const identity = await ctx.auth.getUserIdentity();
    const authorName = identity ? identityDisplayName(identity) : undefined;

    for (const session of args.sessions) {
      const existing = await ctx.db
        .query("projectAiChatSessions")
        .withIndex("by_project_client", (q) =>
          q.eq("projectId", args.projectId).eq("clientId", session.clientId),
        )
        .unique();
      if (existing) continue;

      await ctx.db.insert("projectAiChatSessions", {
        projectId: args.projectId,
        clientId: session.clientId,
        title: session.title.trim().slice(0, MAX_TITLE) || "New chat",
        subtitle: session.subtitle?.trim().slice(0, MAX_SUBTITLE),
        mode: session.mode,
        messages: trimMessages(session.messages),
        createdByUserId: access.userId,
        createdByName: authorName,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });
    }
  },
});
