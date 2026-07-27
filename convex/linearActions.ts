"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import {
  fetchLinearIssueByIdentifier,
  syncLinearIssue,
  verifyLinearApiKey,
} from "./lib/linear";

export const connectWithApiKey = action({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to connect Linear");
    }

    const apiKey = args.apiKey.trim();
    if (!apiKey) {
      throw new Error("Paste a Linear personal API key");
    }

    const verified = await verifyLinearApiKey(apiKey);

    await ctx.runMutation(internal.linear.upsertConnection, {
      userId: identity.subject,
      apiKey,
      organizationName: verified.organizationName,
      viewerName: verified.viewerName,
    });

    return {
      connected: true as const,
      viewerName: verified.viewerName,
      organizationName: verified.organizationName,
    };
  },
});

export const linkProjectIssue = action({
  args: {
    projectId: v.id("projects"),
    issueIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to link a Linear issue");
    }

    const connection = await ctx.runQuery(internal.linear.getConnectionForUser, {
      userId: identity.subject,
    });
    if (!connection) {
      throw new Error("Connect Linear in Integrations first");
    }

    const issue = await fetchLinearIssueByIdentifier(
      connection.apiKey,
      args.issueIdentifier,
    );

    await ctx.runMutation(internal.linear.upsertProjectLink, {
      projectId: args.projectId,
      userId: identity.subject,
      issueId: issue.id,
      issueIdentifier: issue.identifier,
      issueTitle: issue.title,
      issueUrl: issue.url,
    });

    return {
      issueIdentifier: issue.identifier,
      issueTitle: issue.title,
      issueUrl: issue.url,
    };
  },
});

export const syncProjectIssue = internalAction({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    event: v.union(v.literal("push"), v.literal("deploy")),
    detailUrl: v.optional(v.string()),
    commitSha: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.linear.getSyncContextWithIssue, {
      projectId: args.projectId,
      userId: args.userId,
    });
    if (!context) return;

    const issue = await fetchLinearIssueByIdentifier(
      context.apiKey,
      context.issueIdentifier,
    );

    await syncLinearIssue({
      apiKey: context.apiKey,
      issue,
      event: args.event,
      projectName: context.projectName,
      detailUrl: args.detailUrl,
      commitSha: args.commitSha,
    });
  },
});
