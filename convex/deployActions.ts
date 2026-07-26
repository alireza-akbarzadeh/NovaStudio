"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  githubImportUrl,
  normalizeGitHubRepo,
  type DeployProvider,
} from "./lib/deploy";
import { deployNetlifyFromGit, verifyNetlifyToken } from "./lib/netlify";
import { deployVercelFromGit, verifyVercelToken } from "./lib/vercel";

const providerValidator = v.union(v.literal("vercel"), v.literal("netlify"));

export const connectWithToken = action({
  args: {
    provider: providerValidator,
    accessToken: v.string(),
    teamId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to connect a deploy provider");
    }

    const token = args.accessToken.trim();
    if (!token) {
      throw new Error("Paste a personal access token to continue");
    }

    const verified =
      args.provider === "vercel"
        ? await verifyVercelToken(token)
        : await verifyNetlifyToken(token);

    await ctx.runMutation(internal.deploy.upsertConnection, {
      userId: identity.subject,
      provider: args.provider,
      accessToken: token,
      accountId: verified.accountId,
      accountName: verified.accountName,
      accountSlug: verified.accountSlug,
      teamId: args.teamId?.trim() || undefined,
    });

    return {
      connected: true as const,
      provider: args.provider,
      accountName: verified.accountName,
      accountSlug: verified.accountSlug,
    };
  },
});

export const deployProject = action({
  args: {
    projectId: v.id("projects"),
    provider: providerValidator,
    target: v.union(v.literal("preview"), v.literal("production")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<
    | {
        ok: true;
        provider: DeployProvider;
        url?: string;
        inspectorUrl?: string;
        status: string;
        externalId: string;
        needsManualLink?: boolean;
        importUrl?: string;
      }
    | {
        ok: false;
        reason: "not_connected" | "provider_error";
        provider: DeployProvider;
        message?: string;
        importUrl: string;
      }
  > => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to deploy");
    }

    const project = await ctx.runQuery(internal.deploy.assertCanDeploy, {
      projectId: args.projectId,
      userId: identity.subject,
    });

    if (!project.githubRepoUrl) {
      throw new Error(
        "Publish this project to GitHub first, then deploy from the Publish menu.",
      );
    }

    const repoUrl = project.githubRepoUrl;

    const connection = await ctx.runQuery(internal.deploy.getConnectionSecret, {
      userId: identity.subject,
      provider: args.provider,
    });

    if (!connection) {
      return {
        ok: false,
        reason: "not_connected",
        provider: args.provider,
        importUrl: githubImportUrl(args.provider, repoUrl),
      };
    }

    const repo = normalizeGitHubRepo(repoUrl);
    const branch = project.githubBranch || "main";
    const linked = await ctx.runQuery(internal.deploy.getProjectTargetInternal, {
      projectId: args.projectId,
      provider: args.provider,
    });

    try {
      if (args.provider === "vercel") {
        const result = await deployVercelFromGit({
          token: connection.accessToken,
          teamId: connection.teamId,
          projectName: project.name,
          repo,
          branch,
          target: args.target,
          existingProjectId: linked?.externalId,
        });

        await ctx.runMutation(internal.deploy.upsertProjectTarget, {
          projectId: args.projectId,
          provider: "vercel",
          externalId: result.projectId,
          name: result.projectName,
          url: result.url,
          teamId: connection.teamId,
        });

        await ctx.runMutation(internal.deploy.insertDeployment, {
          projectId: args.projectId,
          provider: "vercel",
          externalId: result.deploymentId,
          status: result.status,
          url: result.url,
          inspectorUrl: result.inspectorUrl,
          target: args.target,
          createdBy: identity.subject,
        });

        return {
          ok: true,
          provider: "vercel",
          url: result.url,
          inspectorUrl: result.inspectorUrl,
          status: result.status,
          externalId: result.deploymentId,
        };
      }

      const result = await deployNetlifyFromGit({
        token: connection.accessToken,
        projectName: project.name,
        repo,
        branch,
        existingSiteId: linked?.externalId,
      });

      await ctx.runMutation(internal.deploy.upsertProjectTarget, {
        projectId: args.projectId,
        provider: "netlify",
        externalId: result.siteId,
        name: result.siteName,
        url: result.url,
      });

      await ctx.runMutation(internal.deploy.insertDeployment, {
        projectId: args.projectId,
        provider: "netlify",
        externalId: result.buildId,
        status: result.status,
        url: result.url,
        inspectorUrl: result.inspectorUrl,
        target: args.target,
        createdBy: identity.subject,
      });

      return {
        ok: true,
        provider: "netlify",
        url: result.url,
        inspectorUrl: result.inspectorUrl,
        status: result.status,
        externalId: result.buildId,
        needsManualLink: result.needsManualLink,
        importUrl: result.needsManualLink
          ? githubImportUrl("netlify", repoUrl)
          : undefined,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Deploy failed";
      return {
        ok: false,
        reason: "provider_error",
        provider: args.provider,
        message,
        importUrl: githubImportUrl(args.provider, repoUrl),
      };
    }
  },
});
