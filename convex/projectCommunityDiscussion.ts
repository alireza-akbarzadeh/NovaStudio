import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { formatRelativeTime } from "./lib/accessibleProjects";
import { createNotification } from "./lib/createNotification";
import {
  colorForUserId,
  identityDisplayName,
  resolveProjectAccess,
  verifyProjectOwnerAccess,
} from "./lib/projectAccess";

const MAX_BODY_LENGTH = 2000;

function initialsFrom(value: string | undefined) {
  return (
    (value ?? "U")
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
    initials: initialsFrom(name),
  };
}

async function assertProjectDiscoverable(
  ctx: Parameters<typeof resolveProjectAccess>[0],
  projectId: Id<"projects">,
) {
  const access = await resolveProjectAccess(ctx, projectId);
  if (access) return access;

  const project = await ctx.db.get("projects", projectId);
  if (!project) throw new Error("Project not found");
  if (project.visibility !== "public") {
    throw new Error("This project is not public");
  }
  return null;
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

function mapMessage(
  row: {
    _id: Id<"projectCommunityDiscussions">;
    authorUserId: string;
    authorName?: string;
    authorImageUrl?: string;
    authorColor?: string;
    body: string;
    createdAt: number;
    updatedAt: number;
  },
  ownerId: string,
) {
  return {
    id: row._id,
    body: row.body,
    time: formatRelativeTime(row.createdAt),
    createdAt: row.createdAt,
    isOwner: row.authorUserId === ownerId,
    author: authorPayload(
      row.authorUserId,
      row.authorName,
      row.authorImageUrl,
      row.authorColor,
    ),
  };
}

export const listCommunityDiscussions = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertProjectDiscoverable(ctx, args.projectId);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) return [];

    const limit = Math.min(Math.max(args.limit ?? 40, 1), 100);
    const rows = await ctx.db
      .query("projectCommunityDiscussions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const roots = rows
      .filter((row) => !row.parentId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    const repliesByParent = new Map<
      Id<"projectCommunityDiscussions">,
      typeof rows
    >();
    for (const row of rows) {
      if (!row.parentId) continue;
      const bucket = repliesByParent.get(row.parentId) ?? [];
      bucket.push(row);
      repliesByParent.set(row.parentId, bucket);
    }

    return roots.map((root) => {
      const replies = (repliesByParent.get(root._id) ?? []).sort(
        (a, b) => a.createdAt - b.createdAt,
      );
      const answered = replies.some(
        (reply) => reply.authorUserId === project.ownerId,
      );

      return {
        id: root._id,
        body: root.body,
        time: formatRelativeTime(root.createdAt),
        createdAt: root.createdAt,
        answered,
        replyCount: replies.length,
        author: authorPayload(
          root.authorUserId,
          root.authorName,
          root.authorImageUrl,
          root.authorColor,
        ),
        replies: replies.map((reply) =>
          mapMessage(reply, project.ownerId),
        ),
      };
    });
  },
});

export const postCommunityDiscussion = mutation({
  args: {
    projectId: v.id("projects"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    await assertProjectDiscoverable(ctx, args.projectId);

    const body = args.body.trim();
    if (!body) throw new Error("Message cannot be empty");
    if (body.length > MAX_BODY_LENGTH) {
      throw new Error("Message is too long");
    }

    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("Project not found");

    const { authorName, authorImageUrl, authorColor } = await resolveAuthor(
      ctx,
      args.projectId,
      identity.subject,
    );
    const now = Date.now();

    const messageId = await ctx.db.insert("projectCommunityDiscussions", {
      projectId: args.projectId,
      authorUserId: identity.subject,
      authorName,
      authorImageUrl,
      authorColor,
      body,
      createdAt: now,
      updatedAt: now,
    });

    if (
      project.ownerId !== identity.subject &&
      project.visibility === "public"
    ) {
      await createNotification(ctx, {
        userId: project.ownerId,
        title: `New question on ${project.name}`,
        body: body.length > 120 ? `${body.slice(0, 117)}…` : body,
        href: `/projects/community/${args.projectId}`,
        projectId: args.projectId,
        kind: "comment",
        tone: "blue",
      });
    }

    return messageId;
  },
});

export const replyToCommunityDiscussion = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.id("projectCommunityDiscussions"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    await assertProjectDiscoverable(ctx, args.projectId);

    const body = args.body.trim();
    if (!body) throw new Error("Reply cannot be empty");
    if (body.length > MAX_BODY_LENGTH) {
      throw new Error("Reply is too long");
    }

    const parent = await ctx.db.get("projectCommunityDiscussions", args.parentId);
    if (!parent || parent.projectId !== args.projectId || parent.parentId) {
      throw new Error("Discussion not found");
    }

    const { authorName, authorImageUrl, authorColor } = await resolveAuthor(
      ctx,
      args.projectId,
      identity.subject,
    );
    const now = Date.now();

    const replyId = await ctx.db.insert("projectCommunityDiscussions", {
      projectId: args.projectId,
      parentId: args.parentId,
      authorUserId: identity.subject,
      authorName,
      authorImageUrl,
      authorColor,
      body,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.parentId, { updatedAt: now });

    const project = await ctx.db.get("projects", args.projectId);
    if (
      project &&
      parent.authorUserId !== identity.subject &&
      parent.authorUserId !== project.ownerId
    ) {
      await createNotification(ctx, {
        userId: parent.authorUserId,
        title: `Reply on ${project.name}`,
        body: body.length > 120 ? `${body.slice(0, 117)}…` : body,
        href: `/projects/community/${args.projectId}`,
        projectId: args.projectId,
        kind: "comment",
        tone: "violet",
      });
    }

    return replyId;
  },
});

export const deleteCommunityDiscussion = mutation({
  args: {
    projectId: v.id("projects"),
    messageId: v.id("projectCommunityDiscussions"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const message = await ctx.db.get(
      "projectCommunityDiscussions",
      args.messageId,
    );
    if (!message || message.projectId !== args.projectId) {
      throw new Error("Message not found");
    }

    const isAuthor = message.authorUserId === identity.subject;
    let isOwner = false;
    try {
      await verifyProjectOwnerAccess(ctx, args.projectId);
      isOwner = true;
    } catch {
      /* not owner */
    }

    if (!isAuthor && !isOwner) {
      throw new Error("You cannot delete this message");
    }

    if (!message.parentId) {
      const replies = await ctx.db
        .query("projectCommunityDiscussions")
        .withIndex("by_parent", (q) => q.eq("parentId", args.messageId))
        .collect();
      for (const reply of replies) {
        await ctx.db.delete(reply._id);
      }
    }

    await ctx.db.delete(args.messageId);
  },
});
