"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  createNotionPageFromMarkdown,
  verifyNotionConnection,
} from "./lib/notion";

export const connectWithIntegration = action({
  args: {
    apiKey: v.string(),
    parentPageId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to connect Notion");
    }

    const apiKey = args.apiKey.trim();
    if (!apiKey) {
      throw new Error("Paste a Notion internal integration secret");
    }

    const verified = await verifyNotionConnection({
      apiKey,
      parentPageId: args.parentPageId,
    });

    await ctx.runMutation(internal.notion.upsertConnection, {
      userId: identity.subject,
      apiKey,
      parentPageId: verified.parentPageId,
      parentPageTitle: verified.parentPageTitle,
      workspaceName: verified.workspaceName,
      viewerName: verified.viewerName,
    });

    return {
      connected: true as const,
      parentPageTitle: verified.parentPageTitle,
      viewerName: verified.viewerName,
    };
  },
});

export const exportMarkdown = action({
  args: {
    title: v.string(),
    markdown: v.string(),
    footer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to export to Notion");
    }

    const markdown = args.markdown.trim();
    if (!markdown) {
      throw new Error("Nothing to export");
    }

    const connection = await ctx.runQuery(internal.notion.getConnectionForUser, {
      userId: identity.subject,
    });
    if (!connection) {
      throw new Error("Connect Notion in Integrations first");
    }

    const page = await createNotionPageFromMarkdown({
      apiKey: connection.apiKey,
      parentPageId: connection.parentPageId,
      title: args.title,
      markdown,
      footer: args.footer,
    });

    return page;
  },
});
