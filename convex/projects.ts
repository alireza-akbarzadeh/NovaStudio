import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { deleteAllProjectFiles } from "./lib/importProjectFiles";
import {
  ensureOwnerMembership,
  identityDisplayName,
  identityEmail,
  resolveProjectAccess,
  verifyProjectOwnerAccess,
} from "./lib/projectAccess";
import { seedProjectFiles } from "./lib/projectFiles";
import {
  DEFAULT_TEMPLATE_ID,
  listTemplateMeta,
  templateIdValidator,
} from "./lib/projectTemplates";
import { recordProjectActivity } from "./lib/recordActivity";
import { verifyAuth } from "./auth";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const listTemplates = query({
  args: {},
  handler: async () => {
    return listTemplateMeta();
  },
});

export const createProject = mutation({
  args: {
    name: v.string(),
    templateId: v.optional(templateIdValidator),
    /** When set (Next.js), skip static seed files and run this CLI in the workspace. */
    pendingScaffoldCommand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Project name is required");
    }

    const templateId = args.templateId ?? DEFAULT_TEMPLATE_ID;
    const ownerId = identity.subject;
    const pendingScaffoldCommand = args.pendingScaffoldCommand?.trim() || undefined;

    const projectId = await ctx.db.insert("projects", {
      name,
      ownerId,
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
      source: "template",
      templateId,
      visibility: "private",
      status: "in-progress",
      progress: 5,
      ...(pendingScaffoldCommand
        ? { pendingScaffoldCommand }
        : {}),
    });

    // CLI scaffolds (create-next-app) need an empty root — skip static seed files.
    if (!pendingScaffoldCommand) {
      await seedProjectFiles(ctx, projectId, templateId);
    } else {
      await ctx.db.patch(projectId, {
        templateId,
        syncedAt: Date.now(),
      });
    }

    await ensureOwnerMembership(ctx, projectId, ownerId, {
      email: identityEmail(identity) ?? undefined,
      name: identityDisplayName(identity),
      imageUrl: identity.pictureUrl,
    });
    await recordProjectActivity(ctx, {
      projectId,
      actorUserId: ownerId,
      actorName: identityDisplayName(identity),
      type: "released",
      title: "New project created",
      detail: pendingScaffoldCommand
        ? `${name} (scaffolding)`
        : name,
    });
    return projectId;
  },
});

export const clearPendingScaffold = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const { project } = await verifyProjectOwnerAccess(ctx, args.projectId);
    if (!project.pendingScaffoldCommand) {
      return;
    }
    await ctx.db.patch(args.projectId, {
      pendingScaffoldCommand: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) {
      throw new Error("Project name is required");
    }

    const { userId, project } = await verifyProjectOwnerAccess(
      ctx,
      args.projectId,
    );

    await ctx.db.patch(args.projectId, {
      name,
      updatedAt: Date.now(),
    });

    await recordProjectActivity(ctx, {
      projectId: args.projectId,
      actorUserId: userId,
      type: "updated",
      title: "Project updated",
      detail: `${project.name} → ${name}`,
    });
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
    confirmName: v.string(),
  },
  handler: async (ctx, args) => {
    const { project } = await verifyProjectOwnerAccess(ctx, args.projectId);
    if (project.name !== args.confirmName.trim()) {
      throw new Error("Project name does not match");
    }

    await deleteAllProjectFiles(ctx, args.projectId);

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const row of members) await ctx.db.delete(row._id);

    const invites = await ctx.db
      .query("projectInvites")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const row of invites) await ctx.db.delete(row._id);

    const collabDocs = await ctx.db
      .query("collabDocuments")
      .withIndex("by_project_path", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const row of collabDocs) await ctx.db.delete(row._id);

    const cursors = await ctx.db
      .query("collabCursors")
      .withIndex("by_project_path", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const row of cursors) await ctx.db.delete(row._id);

    const pins = await ctx.db
      .query("projectPins")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const row of pins) await ctx.db.delete(row._id);

    const collectionLinks = await ctx.db
      .query("collectionProjects")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const row of collectionLinks) await ctx.db.delete(row._id);

    const activity = await ctx.db
      .query("projectActivity")
      .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const row of activity) await ctx.db.delete(row._id);

    const deadlines = await ctx.db
      .query("projectDeadlines")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const row of deadlines) await ctx.db.delete(row._id);

    await deleteAccessRequests(ctx, args.projectId);

    await ctx.db.delete(args.projectId);
  },
});

async function deleteAccessRequests(
  ctx: MutationCtx,
  projectId: Id<"projects">,
) {
  for (const status of ["pending", "approved", "denied"] as const) {
    const rows = await ctx.db
      .query("projectAccessRequests")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", projectId).eq("status", status),
      )
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
  }
}

export const updateProjectMeta = mutation({
  args: {
    projectId: v.id("projects"),
    description: v.optional(v.string()),
    visibility: v.optional(
      v.union(v.literal("private"), v.literal("public")),
    ),
    status: v.optional(
      v.union(
        v.literal("in-progress"),
        v.literal("review"),
        v.literal("shipped"),
        v.literal("archived"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { userId, project } = await verifyProjectOwnerAccess(
      ctx,
      args.projectId,
    );
    const patch: {
      description?: string;
      visibility?: "private" | "public";
      status?: "in-progress" | "review" | "shipped" | "archived";
      updatedAt: number;
    } = { updatedAt: Date.now() };
    if (args.description !== undefined) {
      patch.description = args.description.trim();
    }
    if (args.visibility !== undefined) patch.visibility = args.visibility;
    if (args.status !== undefined) patch.status = args.status;
    await ctx.db.patch(args.projectId, patch);
    await recordProjectActivity(ctx, {
      projectId: args.projectId,
      actorUserId: userId,
      type: "updated",
      title: "Project details updated",
      detail: project.name,
    });
  },
});

export const getProjectById = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const access = await resolveProjectAccess(ctx, args.projectId);
    if (!access) {
      return null;
    }
    const { importJobToken: _jobToken, ...project } = access.project;
    return {
      ...project,
      role: access.role,
      canEdit: access.canEdit,
      canManage: access.canManage,
    };
  },
});

export const getMyAccess = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const access = await resolveProjectAccess(ctx, args.projectId);
    if (!access) {
      return null;
    }
    return {
      role: access.role,
      canEdit: access.canEdit,
      canManage: access.canManage,
      userId: access.userId,
    };
  },
});

export const getPartial = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const owned = await ctx.db
      .query("projects")
      .withIndex("by_owner_updated", (q) => q.eq("ownerId", identity.subject))
      .order("desc")
      .take(args.limit);

    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const sharedIds = memberships
      .filter((m) => m.role !== "owner")
      .map((m) => m.projectId);

    const shared = [];
    for (const projectId of sharedIds) {
      const project = await ctx.db.get("projects", projectId);
      if (project && project.ownerId !== identity.subject) {
        shared.push(project);
      }
    }

    const byId = new Map(
      [...owned, ...shared].map((project) => [project._id, project]),
    );
    return [...byId.values()]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, args.limit);
  },
});

export const getProject = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    const owned = await ctx.db
      .query("projects")
      .withIndex("by_owner_updated", (q) => q.eq("ownerId", identity.subject))
      .order("desc")
      .collect();

    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const shared = [];
    for (const membership of memberships) {
      if (membership.role === "owner") continue;
      const project = await ctx.db.get("projects", membership.projectId);
      if (project && project.ownerId !== identity.subject) {
        shared.push({
          ...project,
          role: membership.role,
        });
      }
    }

    const ownedWithRole = owned.map((project) => ({
      ...project,
      role: "owner" as const,
    }));

    const byId = new Map(
      [...ownedWithRole, ...shared].map((project) => [project._id, project]),
    );
    return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  },
});
