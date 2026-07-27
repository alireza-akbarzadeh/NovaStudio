"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import {
  sendDeployWebhookNotification,
  validateWebhookUrl,
  verifyWebhookConnection,
  type WebhookProvider,
} from "./lib/webhookIntegrations";

const webhookProviderValidator = v.union(
  v.literal("slack"),
  v.literal("discord"),
);

export const connectWebhook = action({
  args: {
    provider: webhookProviderValidator,
    webhookUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to connect an integration");
    }

    const webhookUrl = validateWebhookUrl(
      args.provider as WebhookProvider,
      args.webhookUrl,
    );
    const verified = await verifyWebhookConnection(
      args.provider as WebhookProvider,
      webhookUrl,
    );

    await ctx.runMutation(internal.integrations.upsertConnection, {
      userId: identity.subject,
      provider: args.provider,
      webhookUrl,
      channelLabel: verified.channelLabel,
    });

    return {
      connected: true as const,
      provider: args.provider,
      channelLabel: verified.channelLabel,
    };
  },
});

export const notifyDeployToIntegrations = internalAction({
  args: {
    userId: v.string(),
    projectId: v.id("projects"),
    deployProvider: v.union(v.literal("vercel"), v.literal("netlify")),
    status: v.union(v.literal("ready"), v.literal("error")),
    url: v.optional(v.string()),
    inspectorUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [targets, project] = await Promise.all([
      ctx.runQuery(internal.integrations.listDeployNotificationTargets, {
        userId: args.userId,
      }),
      ctx.runQuery(internal.deploy.getProjectNameInternal, {
        projectId: args.projectId,
      }),
    ]);

    if (targets.length === 0 || !project) return;

    await Promise.allSettled(
      targets.map((target) =>
        sendDeployWebhookNotification({
          provider: target.provider as WebhookProvider,
          webhookUrl: target.webhookUrl,
          deployProvider: args.deployProvider,
          projectName: project.name,
          status: args.status,
          url: args.url,
          inspectorUrl: args.inspectorUrl,
          errorMessage: args.errorMessage,
        }),
      ),
    );
  },
});
