import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import { createNotification } from "./lib/createNotification";
import { insertImportedFiles } from "./lib/importProjectFiles";
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
      githubRepoUrl: args.githubRepoUrl,
      githubBranch: args.githubBranch,
      source: "github",
    });

    await ensureOwnerMembership(ctx, projectId, args.ownerId, {
      email: args.email,
      name: args.displayName,
      imageUrl: args.imageUrl,
    });

    return { projectId, importJobToken };
  },
});

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
    await insertImportedFiles(ctx, args.projectId, args.files);
  },
});

export const completeImport = internalMutation({
  args: {
    projectId: v.id("projects"),
    commitSha: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) {
      return;
    }

    await ctx.db.patch(args.projectId, {
      importStatus: "completed",
      lastCommitSha: args.commitSha,
      syncedAt: Date.now(),
      updatedAt: Date.now(),
      importStartedAt: undefined,
      importJobToken: undefined,
    });

    await createNotification(ctx, {
      userId: project.ownerId,
      title: `"${project.name}" imported from GitHub`,
      body: "Your repository is ready to open in Polaris.",
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
      githubRepoUrl: project.githubRepoUrl,
      githubBranch: project.githubBranch,
    };
  },
});
