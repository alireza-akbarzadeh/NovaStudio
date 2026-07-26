import { v } from "convex/values";

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { createNotification } from "./lib/createNotification";
const providerValidator = v.union(v.literal("vercel"), v.literal("netlify"));

export const getConnection = query({
  args: { provider: providerValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const connection = await ctx.db
      .query("deployConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", identity.subject).eq("provider", args.provider),
      )
      .unique();

    if (!connection) return null;

    return {
      _id: connection._id,
      provider: connection.provider,
      accountId: connection.accountId,
      accountName: connection.accountName,
      accountSlug: connection.accountSlug,
      teamId: connection.teamId,
      connectedAt: connection.connectedAt,
      updatedAt: connection.updatedAt,
    };
  },
});

export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const connections = await ctx.db
      .query("deployConnections")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return connections.map((connection) => ({
      _id: connection._id,
      provider: connection.provider,
      accountId: connection.accountId,
      accountName: connection.accountName,
      accountSlug: connection.accountSlug,
      teamId: connection.teamId,
      connectedAt: connection.connectedAt,
      updatedAt: connection.updatedAt,
    }));
  },
});

export const getProjectTarget = query({
  args: {
    projectId: v.id("projects"),
    provider: providerValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("projectDeployTargets")
      .withIndex("by_project_provider", (q) =>
        q.eq("projectId", args.projectId).eq("provider", args.provider),
      )
      .unique();
  },
});

export const listProjectDeployments = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const rows = await ctx.db
      .query("deployments")
      .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(args.limit ?? 10);

    return rows;
  },
});

export const disconnect = mutation({
  args: { provider: providerValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to disconnect");
    }

    const existing = await ctx.db
      .query("deployConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", identity.subject).eq("provider", args.provider),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getConnectionSecret = internalQuery({
  args: {
    userId: v.string(),
    provider: providerValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deployConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .unique();
  },
});

export const upsertConnection = internalMutation({
  args: {
    userId: v.string(),
    provider: providerValidator,
    accessToken: v.string(),
    accountId: v.optional(v.string()),
    accountName: v.optional(v.string()),
    accountSlug: v.optional(v.string()),
    teamId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("deployConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        accountId: args.accountId,
        accountName: args.accountName,
        accountSlug: args.accountSlug,
        teamId: args.teamId,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("deployConnections", {
      userId: args.userId,
      provider: args.provider,
      accessToken: args.accessToken,
      accountId: args.accountId,
      accountName: args.accountName,
      accountSlug: args.accountSlug,
      teamId: args.teamId,
      connectedAt: now,
      updatedAt: now,
    });
  },
});

export const upsertProjectTarget = internalMutation({
  args: {
    projectId: v.id("projects"),
    provider: providerValidator,
    externalId: v.string(),
    name: v.string(),
    url: v.optional(v.string()),
    teamId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("projectDeployTargets")
      .withIndex("by_project_provider", (q) =>
        q.eq("projectId", args.projectId).eq("provider", args.provider),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        externalId: args.externalId,
        name: args.name,
        url: args.url,
        teamId: args.teamId,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("projectDeployTargets", {
      projectId: args.projectId,
      provider: args.provider,
      externalId: args.externalId,
      name: args.name,
      url: args.url,
      teamId: args.teamId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const insertDeployment = internalMutation({
  args: {
    projectId: v.id("projects"),
    provider: providerValidator,
    externalId: v.string(),
    status: v.string(),
    url: v.optional(v.string()),
    inspectorUrl: v.optional(v.string()),
    target: v.union(v.literal("preview"), v.literal("production")),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("deployments", {
      projectId: args.projectId,
      provider: args.provider,
      externalId: args.externalId,
      status: args.status,
      url: args.url,
      inspectorUrl: args.inspectorUrl,
      target: args.target,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDeployment = internalMutation({
  args: {
    deploymentId: v.id("deployments"),
    status: v.string(),
    url: v.optional(v.string()),
    clearUrl: v.optional(v.boolean()),
    inspectorUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    notify: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const deployment = await ctx.db.get(args.deploymentId);
    if (!deployment) return null;

    const prev = deployment.status;
    const next = args.status;
    if (
      prev === next &&
      !args.clearUrl &&
      (args.url === undefined || args.url === deployment.url) &&
      (args.inspectorUrl === undefined ||
        args.inspectorUrl === deployment.inspectorUrl) &&
      (args.errorMessage === undefined ||
        args.errorMessage === deployment.errorMessage)
    ) {
      return deployment;
    }

    await ctx.db.patch(args.deploymentId, {
      status: next,
      ...(args.clearUrl
        ? { url: undefined }
        : args.url !== undefined
          ? { url: args.url }
          : {}),
      ...(args.inspectorUrl !== undefined
        ? { inspectorUrl: args.inspectorUrl }
        : {}),
      ...(args.errorMessage !== undefined
        ? { errorMessage: args.errorMessage }
        : next === "ready"
          ? { errorMessage: undefined }
          : {}),
      updatedAt: Date.now(),
    });

    if (args.notify && prev !== next && (next === "ready" || next === "error")) {
      const project = await ctx.db.get(deployment.projectId);
      const title =
        next === "ready"
          ? `${deployment.provider === "netlify" ? "Netlify" : "Vercel"} deploy succeeded`
          : `${deployment.provider === "netlify" ? "Netlify" : "Vercel"} deploy failed`;
      const href =
        next === "ready"
          ? args.url ?? deployment.url ?? `/projects/${deployment.projectId}`
          : args.inspectorUrl ??
            deployment.inspectorUrl ??
            `/projects/${deployment.projectId}`;

      const errorHint = args.errorMessage ?? deployment.errorMessage;
      const isRepoAccess =
        typeof errorHint === "string" &&
        /unable to access repository|host key verification|could not read from remote|permissions may have changed/i.test(
          errorHint,
        );

      await createNotification(ctx, {
        userId: deployment.createdBy,
        title,
        body:
          next === "ready"
            ? args.url ??
              deployment.url ??
              `"${project?.name ?? "Project"}" is live.`
            : isRepoAccess
              ? `Netlify can’t clone the GitHub repo. Install/authorize the Netlify GitHub App for this repository, then redeploy.`
              : `Deploy for "${project?.name ?? "project"}" failed. Open the provider dashboard for logs.`,
        tone: next === "ready" ? "green" : "orange",
        soundKind: next === "ready" ? "success" : "error",
        kind: "deploy",
        href,
        projectId: deployment.projectId,
      });
    }

    return await ctx.db.get(args.deploymentId);
  },
});

export const getDeploymentInternal = internalQuery({
  args: { deploymentId: v.id("deployments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deploymentId);
  },
});

export const getProjectTargetInternal = internalQuery({
  args: {
    projectId: v.id("projects"),
    provider: providerValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projectDeployTargets")
      .withIndex("by_project_provider", (q) =>
        q.eq("projectId", args.projectId).eq("provider", args.provider),
      )
      .unique();
  },
});

/** Ensure the caller can deploy this project (owner/editor). */
export const assertCanDeploy = internalQuery({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId === args.userId) {
      return project;
    }

    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId),
      )
      .unique();

    if (!member || member.role === "viewer") {
      throw new Error("You need editor access to deploy this project");
    }

    return project;
  },
});
