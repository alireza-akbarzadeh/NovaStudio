import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { formatRelativeTime } from "./lib/accessibleProjects";
import {
  colorForUserId,
  identityDisplayName,
  resolveProjectAccess,
  verifyProjectAccess,
} from "./lib/projectAccess";
import { recordProjectActivity } from "./lib/recordActivity";

const MAX_BODY_LENGTH = 4000;
const MAX_MENTIONS = 20;

function initialsFromName(name: string | undefined) {
  return (
    (name ?? "U")
      .split(/\s+/)
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function authorPayload(
  userId: string,
  name: string | undefined,
  imageUrl: string | undefined,
  color: string | undefined,
) {
  return {
    userId,
    name: name ?? "Someone",
    imageUrl,
    color: color ?? colorForUserId(userId),
    initials: initialsFromName(name),
  };
}

async function resolveAuthor(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  userId: string,
) {
  const identity = await ctx.auth.getUserIdentity();
  const member = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) =>
      q.eq("projectId", projectId).eq("userId", userId),
    )
    .unique();

  return {
    authorName:
      member?.name ??
      (identity ? identityDisplayName(identity) : undefined),
    authorImageUrl: member?.imageUrl ?? identity?.pictureUrl,
    authorColor: member?.color ?? colorForUserId(userId),
  };
}

async function listProjectMemberUserIds(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  ownerId: string,
) {
  const members = await ctx.db
    .query("projectMembers")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  const ids = new Set(members.map((m) => m.userId));
  ids.add(ownerId);
  return [...ids];
}

type MentionMember = {
  userId: string;
  name?: string;
  email?: string;
};

/** Match @"Full Name" or @FirstName / @handle against project members. */
export function extractMentionedUserIds(
  body: string,
  members: MentionMember[],
): string[] {
  if (!body.includes("@") || members.length === 0) return [];

  const ids = new Set<string>();
  const byToken = new Map<string, string>();

  for (const member of members) {
    byToken.set(member.userId.toLowerCase(), member.userId);
    if (member.email) {
      const local = member.email.split("@")[0]?.toLowerCase();
      if (local) byToken.set(local, member.userId);
    }
    const name = member.name?.trim();
    if (!name) continue;
    byToken.set(name.toLowerCase(), member.userId);
    byToken.set(name.replace(/\s+/g, "").toLowerCase(), member.userId);
    const first = name.split(/\s+/)[0];
    if (first && first.length >= 2) {
      byToken.set(first.toLowerCase(), member.userId);
    }
  }

  const re = /@(?:"([^"]+)"|([^\s@]+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    const token = (match[1] ?? match[2] ?? "").trim().toLowerCase();
    if (!token) continue;
    const userId = byToken.get(token);
    if (userId) ids.add(userId);
  }

  return [...ids].slice(0, MAX_MENTIONS);
}

async function loadMentionMembers(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  ownerId: string,
): Promise<MentionMember[]> {
  const members = await ctx.db
    .query("projectMembers")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const list: MentionMember[] = members.map((m) => ({
    userId: m.userId,
    name: m.name,
    email: m.email,
  }));

  if (!list.some((m) => m.userId === ownerId)) {
    list.push({ userId: ownerId });
  }
  return list;
}

export const listThreads = query({
  args: {
    projectId: v.id("projects"),
    filePath: v.optional(v.string()),
    includeResolved: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    const includeResolved = args.includeResolved === true;
    const limit = Math.min(Math.max(args.limit ?? 80, 1), 200);

    const rows = args.filePath
      ? await ctx.db
          .query("projectCommentThreads")
          .withIndex("by_project_file", (q) =>
            q.eq("projectId", args.projectId).eq("filePath", args.filePath!),
          )
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("projectCommentThreads")
          .withIndex("by_project_updated", (q) =>
            q.eq("projectId", args.projectId),
          )
          .order("desc")
          .take(limit);

    const filtered = includeResolved
      ? rows
      : rows.filter((row) => !row.resolved);

    const threads = [];
    for (const row of filtered) {
      const replies = await ctx.db
        .query("projectCommentReplies")
        .withIndex("by_thread_created", (q) => q.eq("threadId", row._id))
        .collect();

      threads.push({
        id: row._id,
        filePath: row.filePath,
        line: row.line,
        body: row.body,
        resolved: row.resolved,
        replyCount: replies.length,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        time: formatRelativeTime(row.updatedAt),
        author: authorPayload(
          row.authorUserId,
          row.authorName,
          row.authorImageUrl,
          row.authorColor,
        ),
      });
    }

    return threads.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getThread = query({
  args: {
    threadId: v.id("projectCommentThreads"),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get("projectCommentThreads", args.threadId);
    if (!thread) return null;
    await verifyProjectAccess(ctx, thread.projectId);

    const replies = await ctx.db
      .query("projectCommentReplies")
      .withIndex("by_thread_created", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();

    return {
      id: thread._id,
      filePath: thread.filePath,
      line: thread.line,
      body: thread.body,
      resolved: thread.resolved,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      time: formatRelativeTime(thread.createdAt),
      author: authorPayload(
        thread.authorUserId,
        thread.authorName,
        thread.authorImageUrl,
        thread.authorColor,
      ),
      replies: replies.map((reply) => ({
        id: reply._id,
        body: reply.body,
        createdAt: reply.createdAt,
        time: formatRelativeTime(reply.createdAt),
        author: authorPayload(
          reply.authorUserId,
          reply.authorName,
          reply.authorImageUrl,
          reply.authorColor,
        ),
      })),
    };
  },
});

export const createThread = mutation({
  args: {
    projectId: v.id("projects"),
    filePath: v.string(),
    line: v.number(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const access = await resolveProjectAccess(ctx, args.projectId);
    if (!access) {
      throw new Error("Unauthorized access to this project");
    }

    const body = args.body.trim();
    if (!body) throw new Error("Comment cannot be empty");
    if (body.length > MAX_BODY_LENGTH) {
      throw new Error(`Comment must be under ${MAX_BODY_LENGTH} characters`);
    }
    if (!Number.isFinite(args.line) || args.line < 1) {
      throw new Error("Invalid line number");
    }

    const filePath = args.filePath.trim();
    if (!filePath) throw new Error("File path is required");

    const author = await resolveAuthor(ctx, args.projectId, access.userId);
    const now = Date.now();
    const mentionMembers = await loadMentionMembers(
      ctx,
      args.projectId,
      access.project.ownerId,
    );
    const mentionedUserIds = extractMentionedUserIds(body, mentionMembers);

    const threadId = await ctx.db.insert("projectCommentThreads", {
      projectId: args.projectId,
      filePath,
      line: Math.floor(args.line),
      body,
      resolved: false,
      authorUserId: access.userId,
      authorName: author.authorName,
      authorImageUrl: author.authorImageUrl,
      authorColor: author.authorColor,
      mentionedUserIds:
        mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
      createdAt: now,
      updatedAt: now,
    });

    const name = author.authorName?.trim() || "Someone";
    const fileName = filePath.split("/").pop() ?? filePath;
    const memberIds = await listProjectMemberUserIds(
      ctx,
      args.projectId,
      access.project.ownerId,
    );
    // Prefer notifying @mentions; otherwise notify every project member.
    const notifyUserIds =
      mentionedUserIds.length > 0 ? mentionedUserIds : memberIds;

    await recordProjectActivity(ctx, {
      projectId: args.projectId,
      actorUserId: access.userId,
      actorName: author.authorName,
      type: "comment",
      title:
        mentionedUserIds.length > 0
          ? `${name} mentioned you on ${fileName}`
          : `${name} commented on ${fileName}`,
      detail: `line ${Math.floor(args.line)} · ${body.slice(0, 100)}`,
      notifyUserIds,
      notificationTone: "orange",
      notificationKind: "comment",
      soundKind: "message",
    });

    return threadId;
  },
});

export const addReply = mutation({
  args: {
    threadId: v.id("projectCommentThreads"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get("projectCommentThreads", args.threadId);
    if (!thread) throw new Error("Comment thread not found");

    const access = await resolveProjectAccess(ctx, thread.projectId);
    if (!access) {
      throw new Error("Unauthorized access to this project");
    }

    const body = args.body.trim();
    if (!body) throw new Error("Reply cannot be empty");
    if (body.length > MAX_BODY_LENGTH) {
      throw new Error(`Reply must be under ${MAX_BODY_LENGTH} characters`);
    }

    const author = await resolveAuthor(ctx, thread.projectId, access.userId);
    const now = Date.now();
    const mentionMembers = await loadMentionMembers(
      ctx,
      thread.projectId,
      access.project.ownerId,
    );
    const mentionedUserIds = extractMentionedUserIds(body, mentionMembers);

    const replyId = await ctx.db.insert("projectCommentReplies", {
      threadId: args.threadId,
      projectId: thread.projectId,
      body,
      authorUserId: access.userId,
      authorName: author.authorName,
      authorImageUrl: author.authorImageUrl,
      authorColor: author.authorColor,
      mentionedUserIds:
        mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
      createdAt: now,
    });

    await ctx.db.patch(args.threadId, { updatedAt: now });

    const name = author.authorName?.trim() || "Someone";
    const fileName = thread.filePath.split("/").pop() ?? thread.filePath;
    const notifyUserIds = [
      ...new Set([
        thread.authorUserId,
        ...mentionedUserIds,
        ...(thread.mentionedUserIds ?? []),
      ]),
    ];

    await recordProjectActivity(ctx, {
      projectId: thread.projectId,
      actorUserId: access.userId,
      actorName: author.authorName,
      type: "comment",
      title:
        mentionedUserIds.length > 0
          ? `${name} mentioned you on ${fileName}`
          : `${name} replied on ${fileName}`,
      detail: `line ${thread.line} · ${body.slice(0, 100)}`,
      notifyUserIds,
      notificationTone: "orange",
      notificationKind: "comment",
      soundKind: "message",
    });

    return replyId;
  },
});

export const setResolved = mutation({
  args: {
    threadId: v.id("projectCommentThreads"),
    resolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get("projectCommentThreads", args.threadId);
    if (!thread) throw new Error("Comment thread not found");

    const access = await resolveProjectAccess(ctx, thread.projectId);
    if (!access) {
      throw new Error("Unauthorized access to this project");
    }

    await ctx.db.patch(args.threadId, {
      resolved: args.resolved,
      updatedAt: Date.now(),
    });
  },
});
