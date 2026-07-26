import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import {
  coverToneForProject,
  formatRelativeTime,
  listAccessibleProjects,
  listOwnedProjectIds,
  techForProject,
} from "./lib/accessibleProjects";
import {
  colorForUserId,
  verifyProjectAccess,
} from "./lib/projectAccess";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    const userId = identity.subject;
    const projects = await listAccessibleProjects(ctx);

    const pins = await ctx.db
      .query("projectPins")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const recentCutoff = Date.now() - WEEK_MS;
    const recent = projects.filter(
      (project) =>
        (project.lastOpenedAt ?? project.updatedAt) >= recentCutoff,
    ).length;
    const shared = projects.filter((project) => project.role !== "owner").length;
    const publicCount = projects.filter(
      (project) => project.visibility === "public",
    ).length;

    return [
      {
        id: "pinned",
        label: "Pinned Projects",
        value: pins.length,
        trend: `${pins.length} pinned`,
        tone: "violet" as const,
        icon: "pin" as const,
      },
      {
        id: "recent",
        label: "Recent Projects",
        value: recent,
        trend: "Last 7 days",
        tone: "blue" as const,
        icon: "clock" as const,
      },
      {
        id: "shared",
        label: "Shared Projects",
        value: shared,
        trend: "With your team",
        tone: "pink" as const,
        icon: "users" as const,
      },
      {
        id: "public",
        label: "Public Contributions",
        value: publicCount,
        trend: "Public workspaces",
        tone: "orange" as const,
        icon: "globe" as const,
      },
    ];
  },
});

export const listActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await verifyAuth(ctx);
    const projects = await listAccessibleProjects(ctx);
    const limit = args.limit ?? 20;
    const items = [];

    for (const project of projects.slice(0, 40)) {
      const rows = await ctx.db
        .query("projectActivity")
        .withIndex("by_project_created", (q) => q.eq("projectId", project._id))
        .order("desc")
        .take(5);
      for (const row of rows) {
        items.push({
          id: row._id,
          type: row.type,
          title: row.title,
          detail: row.detail ?? project.name,
          time: formatRelativeTime(row.createdAt),
          createdAt: row.createdAt,
          avatar: {
            initials: (row.actorName ?? "U")
              .split(/\s+/)
              .map((part) => part[0] ?? "")
              .join("")
              .slice(0, 2)
              .toUpperCase() || "U",
            color: row.actorColor ?? colorForUserId(row.actorUserId),
          },
        });
      }
    }

    return items
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map(({ createdAt: _createdAt, ...item }) => item);
  },
});

/** Compact relative time for the in-editor activity timeline (now / 2m / 1h). */
function formatTimelineTime(timestamp: number) {
  const delta = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (delta < minute) return "now";
  if (delta < hour) return `${Math.floor(delta / minute)}m`;
  if (delta < day) return `${Math.floor(delta / hour)}h`;
  if (delta < 7 * day) return `${Math.floor(delta / day)}d`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function initialsFromName(name: string | undefined) {
  const initials =
    (name ?? "U")
      .split(/\s+/)
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";
  return initials;
}

/** Project-scoped activity feed for the workspace activity timeline panel. */
export const listProjectActivity = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    const limit = Math.min(Math.max(args.limit ?? 40, 1), 100);
    const rows = await ctx.db
      .query("projectActivity")
      .withIndex("by_project_created", (q) =>
        q.eq("projectId", args.projectId),
      )
      .order("desc")
      .take(limit);

    return rows.map((row) => ({
      id: row._id,
      type: row.type,
      title: row.title,
      detail: row.detail,
      time: formatTimelineTime(row.createdAt),
      createdAt: row.createdAt,
      actorUserId: row.actorUserId,
      hasDiff: row.hasSnapshot === true && row.type === "updated",
      avatar: {
        initials: initialsFromName(row.actorName),
        color: row.actorColor ?? colorForUserId(row.actorUserId),
        name: row.actorName ?? "Someone",
      },
    }));
  },
});

/** Load a timeline snapshot for the activity diff view. */
export const getActivityDiff = query({
  args: {
    activityId: v.id("projectActivity"),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get("projectActivity", args.activityId);
    if (!activity) return null;

    await verifyProjectAccess(ctx, activity.projectId);

    const snapshot = await ctx.db
      .query("projectActivitySnapshots")
      .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
      .unique();

    if (!snapshot) return null;

    return {
      id: activity._id,
      projectId: activity.projectId,
      path: snapshot.path,
      beforeContent: snapshot.beforeContent,
      afterContent: snapshot.afterContent,
      title: activity.title,
      actorName: activity.actorName ?? "Someone",
      actorColor: activity.actorColor ?? colorForUserId(activity.actorUserId),
      time: formatTimelineTime(activity.createdAt),
      createdAt: activity.createdAt,
    };
  },
});

export const listDeadlines = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await verifyAuth(ctx);
    const projects = await listAccessibleProjects(ctx);
    const limit = args.limit ?? 8;
    const items = [];

    for (const project of projects) {
      const deadlines = await ctx.db
        .query("projectDeadlines")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      for (const deadline of deadlines) {
        items.push({
          id: deadline._id,
          title: deadline.title,
          project: project.name,
          dueAt: deadline.dueAt,
          due: formatDueLabel(deadline.dueAt),
          tone: deadline.tone ?? "violet",
        });
      }
    }

    return items
      .sort((a, b) => a.dueAt - b.dueAt)
      .slice(0, limit)
      .map(({ dueAt: _dueAt, ...item }) => item);
  },
});

export const listNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const limit = args.limit ?? 10;
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit);

    return rows.map((row) => ({
      id: row._id,
      title: row.title,
      time: formatRelativeTime(row.createdAt),
      tone: row.tone ?? "violet",
      href: row.href,
      read: Boolean(row.readAt),
      soundKind: row.soundKind ?? "notify",
    }));
  },
});

export const getStorageUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    const userId = identity.subject;
    const ownedIds = await listOwnedProjectIds(ctx, userId);

    let usedBytes = 0;
    for (const projectId of ownedIds) {
      const files = await ctx.db
        .query("projectFiles")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
      for (const file of files) {
        if (file.content) {
          usedBytes += new TextEncoder().encode(file.content).byteLength;
        }
      }
    }

    const quota = await ctx.db
      .query("userStorageQuotas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const limitBytes = quota?.limitBytes ?? DEFAULT_STORAGE_LIMIT;
    const percent = limitBytes
      ? Math.min(100, Math.round((usedBytes / limitBytes) * 100))
      : 0;

    return {
      usedBytes,
      limitBytes,
      percent,
      usedLabel: formatBytes(usedBytes),
      limitLabel: formatBytes(limitBytes),
    };
  },
});

export const listWorkspaceProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    const userId = identity.subject;
    const projects = await listAccessibleProjects(ctx);

    const pins = await ctx.db
      .query("projectPins")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const pinnedIds = new Set(pins.map((pin) => pin.projectId));

    const result = [];
    for (const project of projects) {
      const members = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .take(5);

      const memberCards = members.map((member) => ({
        name: member.name ?? member.email ?? "Member",
        initials: initialsFrom(member.name ?? member.email ?? "M"),
        color: member.color,
      }));

      const owner =
        memberCards.find((_, index) => members[index]?.role === "owner") ??
        memberCards[0] ?? {
          name: "Owner",
          initials: "OW",
          color: colorForUserId(project.ownerId),
        };

      const visibility =
        project.visibility === "public"
          ? ("public" as const)
          : project.role !== "owner"
            ? ("shared" as const)
            : ("private" as const);

      result.push({
        id: project._id,
        name: project.name,
        description:
          project.description ??
          `Workspace for ${project.name}`,
        cover: project.coverTone ?? "",
        coverTone: coverToneForProject(project),
        tech: techForProject(project),
        status: project.status ?? "in-progress",
        visibility,
        pinned: pinnedIds.has(project._id),
        progress: project.progress ?? (project.status === "shipped" ? 100 : 45),
        lastUpdated: `Updated ${formatRelativeTime(project.updatedAt)}`,
        lastOpened: project.lastOpenedAt
          ? `Opened ${formatRelativeTime(project.lastOpenedAt)}`
          : `Opened ${formatRelativeTime(project.updatedAt)}`,
        lastEditedBy: owner.name,
        members: memberCards,
        owner,
        tags: techForProject(project).slice(0, 3),
        trending: project.visibility === "public",
        weeklyStars: undefined,
        stars: undefined,
        forks: undefined,
        views: undefined,
        downloads: undefined,
        importStatus: project.importStatus,
        importStartedAt: project.importStartedAt,
        source: project.source,
        githubRepoUrl: project.githubRepoUrl,
        githubBranch: project.githubBranch,
      });
    }

    return result;
  },
});

export const listPublicProjects = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await verifyAuth(ctx);
    const limit = args.limit ?? 24;
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_visibility_updated", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(limit);

    return projects.map((project) => {
      const owner = {
        name: "Creator",
        initials: "CR",
        color: colorForUserId(project.ownerId),
      };
      return {
        id: project._id,
        name: project.name,
        description:
          project.description ?? `Public workspace · ${project.name}`,
        cover: project.coverTone ?? "",
        coverTone: coverToneForProject(project),
        tech: techForProject(project),
        status: project.status ?? "in-progress",
        visibility: "public" as const,
        pinned: false,
        progress: project.progress ?? 60,
        lastUpdated: `Updated ${formatRelativeTime(project.updatedAt)}`,
        lastOpened: `Opened ${formatRelativeTime(project.updatedAt)}`,
        lastEditedBy: owner.name,
        members: [owner],
        owner,
        tags: techForProject(project).slice(0, 3),
        trending: true,
        weeklyStars: undefined,
        stars: undefined,
        forks: undefined,
        views: undefined,
        downloads: undefined,
      };
    });
  },
});

function initialsFrom(value: string) {
  return (
    value
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function formatDueLabel(dueAt: number) {
  const delta = dueAt - Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (delta < 0) return "Overdue";
  if (delta < day) return "Today";
  if (delta < 2 * day) return "Tomorrow";
  return new Date(dueAt).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}
