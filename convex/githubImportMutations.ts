import { v } from "convex/values";

import { internal } from "./_generated/api";
import { verifyAuth } from "./auth";
import {
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { createNotification } from "./lib/createNotification";
import { insertImportedFileBatch } from "./lib/importProjectFiles";
import { ensureOwnerMembership } from "./lib/projectAccess";

export const createImportProject = internalMutation({
  args: {
    ownerId: v.string(),
    name: v.string(),
    githubRepoUrl: v.string(),
    githubBranch: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    /** Clerk org id when importing into an active team tenant. */
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const importJobToken = `${now}-${Math.random().toString(36).slice(2, 12)}`;
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      ownerId: args.ownerId,
      updatedAt: now,
      importStatus: "importing",
      importStartedAt: now,
      importJobToken,
      importDoneFiles: 0,
      githubRepoUrl: args.githubRepoUrl,
      githubBranch: args.githubBranch,
      source: "github",
      ...(args.orgId ? { orgId: args.orgId } : {}),
    });

    await ensureOwnerMembership(ctx, projectId, args.ownerId, {
      email: args.email,
      name: args.displayName,
      imageUrl: args.imageUrl,
    });

    return { projectId, importJobToken };
  },
});

export const setImportProgress = internalMutation({
  args: {
    projectId: v.id("projects"),
    totalFiles: v.optional(v.number()),
    doneFiles: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.importStatus !== "importing") {
      return;
    }

    await ctx.db.patch(args.projectId, {
      ...(args.totalFiles !== undefined
        ? { importTotalFiles: args.totalFiles }
        : {}),
      ...(args.doneFiles !== undefined
        ? { importDoneFiles: args.doneFiles }
        : {}),
      updatedAt: Date.now(),
    });
  },
});

export const insertImportBatch = internalMutation({
  args: {
    projectId: v.id("projects"),
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.importStatus !== "importing") {
      return;
    }

    await insertImportedFileBatch(ctx, args.projectId, args.files);
  },
});

/** @deprecated Prefer batched `insertImportBatch` during clone jobs. */
export const importFiles = internalMutation({
  args: {
    projectId: v.id("projects"),
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.importStatus !== "importing") {
      return;
    }
    await insertImportedFileBatch(ctx, args.projectId, args.files);
  },
});

export const completeImport = internalMutation({
  args: {
    projectId: v.id("projects"),
    commitSha: v.string(),
    fileCount: v.number(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) {
      return;
    }
    // Ignore late completions after timeout / fail / retry token rotate.
    if (project.importStatus !== "importing") {
      return;
    }

    const now = Date.now();
    await ctx.db.patch(args.projectId, {
      importStatus: "completed",
      lastCommitSha: args.commitSha,
      syncedAt: now,
      updatedAt: now,
      importStartedAt: undefined,
      importJobToken: undefined,
      importTotalFiles: args.fileCount,
      importDoneFiles: args.fileCount,
      fileContentSplit: true,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.projectFiles.migrateInlineContentBatch,
      {
        projectId: args.projectId,
        limit: 40,
      },
    );
    await ctx.scheduler.runAfter(
      0,
      internal.projectSearch.scheduleSearchIndexBackfill,
      {
        projectId: args.projectId,
      },
    );

    await createNotification(ctx, {
      userId: project.ownerId,
      title: `"${project.name}" imported from GitHub`,
      body: "Your repository is ready to open in NovaStudio.",
      tone: "green",
      soundKind: "success",
      href: `/projects/${args.projectId}`,
      projectId: args.projectId,
    });
  },
});

export const failImport = internalMutation({
  args: {
    projectId: v.id("projects"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) {
      return;
    }

    await ctx.db.patch(args.projectId, {
      importStatus: "failed",
      updatedAt: Date.now(),
      importStartedAt: undefined,
      importJobToken: undefined,
      importTotalFiles: undefined,
      importDoneFiles: undefined,
    });

    await createNotification(ctx, {
      userId: project.ownerId,
      title: `Failed to import "${project.name}"`,
      body: args.reason ?? "The GitHub clone job could not finish.",
      tone: "orange",
      soundKind: "error",
      href: `/projects`,
      projectId: args.projectId,
    });
  },
});

/**
 * Worker / Inngest failure path — authenticates via the import job token.
 */
export const failImportWithToken = mutation({
  args: {
    projectId: v.id("projects"),
    jobToken: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) {
      return { ok: false as const };
    }
    if (
      project.importStatus !== "importing" ||
      !project.importJobToken ||
      project.importJobToken !== args.jobToken
    ) {
      return { ok: false as const };
    }

    await ctx.db.patch(args.projectId, {
      importStatus: "failed",
      updatedAt: Date.now(),
      importStartedAt: undefined,
      importJobToken: undefined,
      importTotalFiles: undefined,
      importDoneFiles: undefined,
    });

    await createNotification(ctx, {
      userId: project.ownerId,
      title: `Failed to import "${project.name}"`,
      body: args.reason ?? "The GitHub clone job could not finish.",
      tone: "orange",
      soundKind: "error",
      href: `/projects`,
      projectId: args.projectId,
    });

    return { ok: true as const };
  },
});

/**
 * Re-queue a failed GitHub import. Returns a fresh job token for the worker.
 */
export const retryFailedImport = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.ownerId !== identity.subject) {
      throw new Error("Only the project owner can retry this import");
    }
    if (project.importStatus !== "failed") {
      throw new Error("Only failed imports can be retried");
    }
    if (!project.githubRepoUrl || !project.githubBranch) {
      throw new Error("Project is missing GitHub repository details");
    }

    const now = Date.now();
    const importJobToken = `${now}-${Math.random().toString(36).slice(2, 12)}`;
    await ctx.db.patch(args.projectId, {
      importStatus: "importing",
      importStartedAt: now,
      importJobToken,
      importDoneFiles: 0,
      importTotalFiles: undefined,
      updatedAt: now,
    });

    return { projectId: args.projectId, importJobToken };
  },
});

export const getImportJob = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) {
      return null;
    }
    return {
      _id: project._id,
      ownerId: project.ownerId,
      importStatus: project.importStatus,
      importJobToken: project.importJobToken,
      importStartedAt: project.importStartedAt,
      githubRepoUrl: project.githubRepoUrl,
      githubBranch: project.githubBranch,
    };
  },
});

/**
 * Mark a stuck GitHub import as failed so the owner can retry.
 * Safe to call repeatedly — no-ops unless still importing past the timeout.
 */
export const failStaleImport = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.ownerId !== identity.subject) {
      throw new Error("Only the project owner can expire this import");
    }
    if (project.importStatus !== "importing") {
      return { expired: false as const };
    }

    const startedAt = project.importStartedAt ?? project._creationTime;
    const IMPORT_TIMEOUT_MS = 5 * 60 * 1000;
    if (Date.now() - startedAt < IMPORT_TIMEOUT_MS) {
      return { expired: false as const };
    }

    await ctx.db.patch(args.projectId, {
      importStatus: "failed",
      updatedAt: Date.now(),
      importStartedAt: undefined,
      importJobToken: undefined,
      importTotalFiles: undefined,
      importDoneFiles: undefined,
    });

    await createNotification(ctx, {
      userId: project.ownerId,
      title: `Import timed out for "${project.name}"`,
      body: "The GitHub clone took too long and was stopped. You can retry from the project card.",
      tone: "orange",
      soundKind: "error",
      href: `/projects`,
      projectId: args.projectId,
    });

    return { expired: true as const };
  },
});
