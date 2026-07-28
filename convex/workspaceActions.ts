import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { listAccessibleProjects } from "./lib/accessibleProjects";
import { createNotification } from "./lib/createNotification";
import {
  colorForUserId,
  identityDisplayName,
  identityEmail,
  verifyProjectAccess,
  verifyProjectOwnerAccess,
  verifyProjectWriteAccess,
} from "./lib/projectAccess";
import { recordProjectActivity } from "./lib/recordActivity";

const collectionIcon = v.union(
  v.literal("pin"),
  v.literal("sparkles"),
  v.literal("user"),
  v.literal("briefcase"),
  v.literal("archive"),
);

const DEFAULT_COLLECTIONS = [
  { name: "Pinned", color: "#7c3aed", icon: "pin" as const },
  { name: "AI Projects", color: "#2563eb", icon: "sparkles" as const },
  { name: "Personal", color: "#db2777", icon: "user" as const },
  { name: "Client Work", color: "#ea580c", icon: "briefcase" as const },
  { name: "Archived", color: "#64748b", icon: "archive" as const },
];

export const listCollections = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    const rows = await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const result = [];
    for (const collection of rows) {
      const links = await ctx.db
        .query("collectionProjects")
        .withIndex("by_collection", (q) => q.eq("collectionId", collection._id))
        .collect();
      result.push({
        id: collection._id,
        name: collection.name,
        count: links.length,
        color: collection.color,
        icon: collection.icon,
      });
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const ensureDefaultCollections = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    const existing = await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    if (existing.length > 0) return existing.length;

    for (const collection of DEFAULT_COLLECTIONS) {
      await ctx.db.insert("collections", {
        userId: identity.subject,
        name: collection.name,
        color: collection.color,
        icon: collection.icon,
        createdAt: Date.now(),
      });
    }
    return DEFAULT_COLLECTIONS.length;
  },
});

export const createCollection = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    icon: collectionIcon,
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const name = args.name.trim();
    if (!name) throw new Error("Collection name is required");
    return await ctx.db.insert("collections", {
      userId: identity.subject,
      name,
      color: args.color,
      icon: args.icon,
      createdAt: Date.now(),
    });
  },
});

export const addProjectToCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const collection = await ctx.db.get("collections", args.collectionId);
    if (!collection || collection.userId !== identity.subject) {
      throw new Error("Collection not found");
    }
    await verifyProjectAccess(ctx, args.projectId);

    const existing = await ctx.db
      .query("collectionProjects")
      .withIndex("by_collection_project", (q) =>
        q.eq("collectionId", args.collectionId).eq("projectId", args.projectId),
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("collectionProjects", {
      collectionId: args.collectionId,
      projectId: args.projectId,
      addedAt: Date.now(),
    });
  },
});

export const removeProjectFromCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const collection = await ctx.db.get("collections", args.collectionId);
    if (!collection || collection.userId !== identity.subject) {
      throw new Error("Collection not found");
    }

    const existing = await ctx.db
      .query("collectionProjects")
      .withIndex("by_collection_project", (q) =>
        q.eq("collectionId", args.collectionId).eq("projectId", args.projectId),
      )
      .unique();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});

export const listCollectionProjects = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const collection = await ctx.db.get("collections", args.collectionId);
    if (!collection || collection.userId !== identity.subject) {
      throw new Error("Collection not found");
    }

    const links = await ctx.db
      .query("collectionProjects")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
      .collect();

    const result = [];
    for (const link of links) {
      const project = await ctx.db.get("projects", link.projectId);
      if (!project) continue;
      try {
        await verifyProjectAccess(ctx, project._id);
      } catch {
        continue;
      }
      result.push({
        id: project._id,
        name: project.name,
        description:
          project.description ?? `Workspace for ${project.name}`,
        status: project.status ?? "in-progress",
        visibility: project.visibility,
        updatedAt: project.updatedAt,
        lastUpdated: `Updated ${formatRelativeFromMs(project.updatedAt)}`,
      });
    }

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

function formatRelativeFromMs(timestamp: number) {
  const delta = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (delta < minute) return "just now";
  if (delta < hour) return `${Math.floor(delta / minute)}m ago`;
  if (delta < day) return `${Math.floor(delta / hour)}h ago`;
  if (delta < 7 * day) return `${Math.floor(delta / day)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export const togglePin = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    await verifyProjectAccess(ctx, args.projectId);
    const existing = await ctx.db
      .query("projectPins")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", identity.subject).eq("projectId", args.projectId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { pinned: false };
    }
    await ctx.db.insert("projectPins", {
      userId: identity.subject,
      projectId: args.projectId,
      createdAt: Date.now(),
    });
    return { pinned: true };
  },
});

export const touchOpened = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    await ctx.db.patch(args.projectId, { lastOpenedAt: Date.now() });
  },
});

export const createDeadline = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    dueAt: v.number(),
    tone: v.optional(
      v.union(
        v.literal("orange"),
        v.literal("blue"),
        v.literal("violet"),
        v.literal("green"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await verifyProjectWriteAccess(ctx, args.projectId);
    const title = args.title.trim();
    if (!title) throw new Error("Deadline title is required");
    return await ctx.db.insert("projectDeadlines", {
      projectId: args.projectId,
      title,
      dueAt: args.dueAt,
      tone: args.tone,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

export const deleteDeadline = mutation({
  args: { deadlineId: v.id("projectDeadlines") },
  handler: async (ctx, args) => {
    const deadline = await ctx.db.get("projectDeadlines", args.deadlineId);
    if (!deadline) throw new Error("Deadline not found");
    await verifyProjectWriteAccess(ctx, deadline.projectId);
    await ctx.db.delete(args.deadlineId);
    return args.deadlineId;
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const row = await ctx.db.get("notifications", args.notificationId);
    if (!row || row.userId !== identity.subject) {
      throw new Error("Notification not found");
    }
    await ctx.db.patch(args.notificationId, { readAt: Date.now() });
  },
});

export const markNotificationsReadByKind = mutation({
  args: {
    kind: v.union(
      v.literal("chat"),
      v.literal("comment"),
      v.literal("deploy"),
      v.literal("general"),
    ),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(100);

    const now = Date.now();
    let marked = 0;
    for (const row of rows) {
      if (row.readAt) continue;
      const kind = row.kind ?? inferNotificationKindFromTitle(row.title);
      if (kind !== args.kind) continue;
      if (args.projectId && row.projectId !== args.projectId) continue;
      await ctx.db.patch(row._id, { readAt: now });
      marked += 1;
    }
    return { marked };
  },
});

function inferNotificationKindFromTitle(
  title: string,
): "chat" | "comment" | "deploy" | "general" {
  if (/chat message/i.test(title)) return "chat";
  if (/commented|replied|mentioned you/i.test(title)) return "comment";
  if (/deploy (succeeded|failed)/i.test(title)) return "deploy";
  return "general";
}

export const listPendingAccessRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    const owned = await listAccessibleProjects(ctx);
    const ownedProjects = owned.filter((project) => project.role === "owner");
    const items = [];

    for (const project of ownedProjects) {
      const requests = await ctx.db
        .query("projectAccessRequests")
        .withIndex("by_project_status", (q) =>
          q.eq("projectId", project._id).eq("status", "pending"),
        )
        .collect();
      for (const request of requests) {
        const name = request.requesterName ?? "Contributor";
        items.push({
          id: request._id,
          projectId: project._id,
          name,
          email: request.requesterEmail,
          role: request.roleLabel ?? "Developer",
          experienceLevel: request.experienceLevel,
          message: request.message,
          github: request.github,
          portfolioUrl: request.portfolioUrl,
          project: project.name,
          createdAt: request.createdAt,
          initials: name
            .split(/\s+/)
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          color: colorForUserId(request.requesterUserId),
        });
      }
    }

    return items.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const createAccessRequest = mutation({
  args: {
    projectId: v.id("projects"),
    roleLabel: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    message: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    github: v.optional(v.string()),
    linkedin: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.visibility !== "public") {
      throw new Error("Only public projects accept access requests");
    }
    if (project.ownerId === identity.subject) {
      throw new Error("You already own this project");
    }

    const existingMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", identity.subject),
      )
      .unique();
    if (existingMember) {
      throw new Error("You already have access to this project");
    }

    const existing = await ctx.db
      .query("projectAccessRequests")
      .withIndex("by_requester", (q) => q.eq("requesterUserId", identity.subject))
      .collect();
    const pending = existing.find(
      (row) => row.projectId === args.projectId && row.status === "pending",
    );
    if (pending) return pending._id;

    const requestId = await ctx.db.insert("projectAccessRequests", {
      projectId: args.projectId,
      requesterUserId: identity.subject,
      requesterName: identityDisplayName(identity),
      requesterEmail: identityEmail(identity) ?? undefined,
      roleLabel: args.roleLabel,
      experienceLevel: args.experienceLevel,
      message: args.message,
      portfolioUrl: args.portfolioUrl,
      github: args.github,
      linkedin: args.linkedin,
      status: "pending",
      createdAt: Date.now(),
    });

    await createNotification(ctx, {
      userId: project.ownerId,
      title: `${identityDisplayName(identity) ?? "Someone"} requested access to ${project.name}`,
      tone: "violet",
      soundKind: "message",
      projectId: project._id,
      href: `/projects/${project._id}`,
    });

    return requestId;
  },
});

export const decideAccessRequest = mutation({
  args: {
    requestId: v.id("projectAccessRequests"),
    decision: v.union(v.literal("approved"), v.literal("denied")),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const request = await ctx.db.get("projectAccessRequests", args.requestId);
    if (!request || request.status !== "pending") {
      throw new Error("Request not found");
    }
    await verifyProjectOwnerAccess(ctx, request.projectId);

    await ctx.db.patch(args.requestId, { status: args.decision });

    if (args.decision === "approved") {
      const existing = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) =>
          q
            .eq("projectId", request.projectId)
            .eq("userId", request.requesterUserId),
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("projectMembers", {
          projectId: request.projectId,
          userId: request.requesterUserId,
          role: "editor",
          email: request.requesterEmail,
          name: request.requesterName,
          color: colorForUserId(request.requesterUserId),
          createdAt: Date.now(),
        });
      }

      const project = await ctx.db.get("projects", request.projectId);
      await recordProjectActivity(ctx, {
        projectId: request.projectId,
        actorUserId: request.requesterUserId,
        actorName: request.requesterName,
        type: "joined",
        title: "New contributor joined",
        detail: project?.name,
        notifyUserIds: [identity.subject],
        notificationTone: "green",
      });
    }

    await createNotification(ctx, {
      userId: request.requesterUserId,
      title:
        args.decision === "approved"
          ? "Your access request was approved"
          : "Your access request was declined",
      tone: args.decision === "approved" ? "green" : "orange",
      soundKind: args.decision === "approved" ? "success" : "warning",
      projectId: request.projectId,
      href: `/projects/${request.projectId}`,
    });
  },
});
