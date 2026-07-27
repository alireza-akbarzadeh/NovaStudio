"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  githubImportUrl,
  normalizeGitHubRepo,
  type DeployProvider,
} from "./lib/deploy";
import { deployNetlifyFromGit, fetchNetlifyDeployStatus, fetchNetlifySiteEnv, pushNetlifySiteEnv, verifyNetlifyToken } from "./lib/netlify";
import { deployVercelFromGit, fetchVercelProjectEnv, pushVercelProjectEnv, verifyVercelToken } from "./lib/vercel";

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
        deploymentId: string;
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
        "Publish this project to GitHub first, then deploy from the rocket menu.",
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

        const deploymentId = await ctx.runMutation(
          internal.deploy.insertDeployment,
          {
            projectId: args.projectId,
            provider: "vercel",
            externalId: result.deploymentId,
            status: result.status,
            url: result.url,
            inspectorUrl: result.inspectorUrl,
            target: args.target,
            createdBy: identity.subject,
          },
        );

        return {
          ok: true,
          provider: "vercel",
          url: result.url,
          inspectorUrl: result.inspectorUrl,
          status: result.status,
          externalId: result.deploymentId,
          deploymentId,
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

      const deploymentId = await ctx.runMutation(
        internal.deploy.insertDeployment,
        {
          projectId: args.projectId,
          provider: "netlify",
          externalId: result.buildId,
          status: result.status,
          url: result.url,
          inspectorUrl: result.inspectorUrl,
          target: args.target,
          createdBy: identity.subject,
        },
      );

      return {
        ok: true,
        provider: "netlify",
        url: result.url,
        inspectorUrl: result.inspectorUrl,
        status: result.status,
        externalId: result.buildId,
        deploymentId,
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

/**
 * Poll Netlify (or return cached row) and update the deployment document.
 * Creates an in-app + push notification when status flips to ready/error.
 */
export const refreshDeploymentStatus = action({
  args: {
    deploymentId: v.id("deployments"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    status: string;
    url?: string;
    inspectorUrl?: string;
    errorMessage?: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to refresh deploy status");
    }

    const deployment = await ctx.runQuery(
      internal.deploy.getDeploymentInternal,
      { deploymentId: args.deploymentId },
    );
    if (!deployment) {
      throw new Error("Deployment not found");
    }
    if (deployment.createdBy !== identity.subject) {
      // Allow project editors via assertCanDeploy.
      await ctx.runQuery(internal.deploy.assertCanDeploy, {
        projectId: deployment.projectId,
        userId: identity.subject,
      });
    }

    if (
      deployment.status === "ready" ||
      deployment.status === "error" ||
      deployment.status === "cancelled" ||
      deployment.status === "needs_setup"
    ) {
      return {
        status: deployment.status,
        url: deployment.url,
        inspectorUrl: deployment.inspectorUrl,
      };
    }

    if (deployment.provider !== "netlify") {
      // Vercel polling can be added later; return stored status for now.
      return {
        status: deployment.status,
        url: deployment.url,
        inspectorUrl: deployment.inspectorUrl,
      };
    }

    const connection = await ctx.runQuery(internal.deploy.getConnectionSecret, {
      userId: identity.subject,
      provider: "netlify",
    });
    if (!connection) {
      throw new Error("Netlify is not connected");
    }

    const latest = await fetchNetlifyDeployStatus({
      token: connection.accessToken,
      deployId: deployment.externalId,
    });

    await ctx.runMutation(internal.deploy.updateDeployment, {
      deploymentId: args.deploymentId,
      status: latest.status,
      // Failed / building deploys should not keep a public site URL — that
      // leads users to a Netlify "Site not found" page instead of logs.
      url: latest.status === "ready" ? latest.url : undefined,
      clearUrl: latest.status !== "ready",
      inspectorUrl: latest.inspectorUrl ?? deployment.inspectorUrl,
      errorMessage: latest.errorMessage,
      notify: true,
    });

    return {
      status: latest.status,
      url: latest.status === "ready" ? latest.url ?? deployment.url : undefined,
      inspectorUrl: latest.inspectorUrl ?? deployment.inspectorUrl,
      errorMessage: latest.errorMessage,
    };
  },
});

export const pullVercelEnv = action({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<
    | {
        ok: true;
        variables: Array<{ key: string; value: string }>;
        projectName: string;
      }
    | {
        ok: false;
        reason: "not_connected" | "no_target" | "provider_error";
        message?: string;
      }
  > => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to sync environment variables");
    }

    await ctx.runQuery(internal.deploy.assertCanDeploy, {
      projectId: args.projectId,
      userId: identity.subject,
    });

    const connection = await ctx.runQuery(internal.deploy.getConnectionSecret, {
      userId: identity.subject,
      provider: "vercel",
    });

    if (!connection) {
      return { ok: false, reason: "not_connected" };
    }

    const linked = await ctx.runQuery(internal.deploy.getProjectTargetInternal, {
      projectId: args.projectId,
      provider: "vercel",
    });

    if (!linked?.externalId) {
      return {
        ok: false,
        reason: "no_target",
        message:
          "Deploy this project to Vercel first to link a project for env sync.",
      };
    }

    try {
      const variables = await fetchVercelProjectEnv({
        token: connection.accessToken,
        projectId: linked.externalId,
        teamId: linked.teamId ?? connection.teamId,
      });

      return {
        ok: true,
        variables,
        projectName: linked.name,
      };
    } catch (error) {
      return {
        ok: false,
        reason: "provider_error",
        message:
          error instanceof Error
            ? error.message
            : "Could not load Vercel environment variables",
      };
    }
  },
});

export const pullNetlifyEnv = action({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<
    | {
        ok: true;
        variables: Array<{ key: string; value: string }>;
        projectName: string;
      }
    | {
        ok: false;
        reason: "not_connected" | "no_target" | "provider_error";
        message?: string;
      }
  > => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to sync environment variables");
    }

    await ctx.runQuery(internal.deploy.assertCanDeploy, {
      projectId: args.projectId,
      userId: identity.subject,
    });

    const connection = await ctx.runQuery(internal.deploy.getConnectionSecret, {
      userId: identity.subject,
      provider: "netlify",
    });

    if (!connection) {
      return { ok: false, reason: "not_connected" };
    }

    const linked = await ctx.runQuery(internal.deploy.getProjectTargetInternal, {
      projectId: args.projectId,
      provider: "netlify",
    });

    if (!linked?.externalId) {
      return {
        ok: false,
        reason: "no_target",
        message:
          "Deploy this project to Netlify first to link a site for env sync.",
      };
    }

    try {
      const variables = await fetchNetlifySiteEnv({
        token: connection.accessToken,
        siteId: linked.externalId,
      });

      return {
        ok: true,
        variables,
        projectName: linked.name,
      };
    } catch (error) {
      return {
        ok: false,
        reason: "provider_error",
        message:
          error instanceof Error
            ? error.message
            : "Could not load Netlify environment variables",
      };
    }
  },
});

const envVariableValidator = v.array(
  v.object({
    key: v.string(),
    value: v.string(),
  }),
);

export const pushVercelEnv = action({
  args: {
    projectId: v.id("projects"),
    variables: envVariableValidator,
  },
  handler: async (
    ctx,
    args,
  ): Promise<
    | {
        ok: true;
        pushed: number;
        failed: Array<{ key: string; message: string }>;
        projectName: string;
      }
    | {
        ok: false;
        reason: "not_connected" | "no_target" | "provider_error";
        message?: string;
      }
  > => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to sync environment variables");
    }

    await ctx.runQuery(internal.deploy.assertCanDeploy, {
      projectId: args.projectId,
      userId: identity.subject,
    });

    const connection = await ctx.runQuery(internal.deploy.getConnectionSecret, {
      userId: identity.subject,
      provider: "vercel",
    });

    if (!connection) {
      return { ok: false, reason: "not_connected" };
    }

    const linked = await ctx.runQuery(internal.deploy.getProjectTargetInternal, {
      projectId: args.projectId,
      provider: "vercel",
    });

    if (!linked?.externalId) {
      return {
        ok: false,
        reason: "no_target",
        message:
          "Deploy this project to Vercel first to link a project for env sync.",
      };
    }

    const variables = args.variables
      .map((row) => ({ key: row.key.trim(), value: row.value }))
      .filter((row) => row.key.length > 0);

    if (variables.length === 0) {
      return {
        ok: false,
        reason: "provider_error",
        message: "Add at least one environment variable with a key.",
      };
    }

    try {
      const result = await pushVercelProjectEnv({
        token: connection.accessToken,
        projectId: linked.externalId,
        teamId: linked.teamId ?? connection.teamId,
        variables,
      });

      return {
        ok: true,
        ...result,
        projectName: linked.name,
      };
    } catch (error) {
      return {
        ok: false,
        reason: "provider_error",
        message:
          error instanceof Error
            ? error.message
            : "Could not push Vercel environment variables",
      };
    }
  },
});

export const pushNetlifyEnv = action({
  args: {
    projectId: v.id("projects"),
    variables: envVariableValidator,
  },
  handler: async (
    ctx,
    args,
  ): Promise<
    | {
        ok: true;
        pushed: number;
        failed: Array<{ key: string; message: string }>;
        projectName: string;
      }
    | {
        ok: false;
        reason: "not_connected" | "no_target" | "provider_error";
        message?: string;
      }
  > => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to sync environment variables");
    }

    await ctx.runQuery(internal.deploy.assertCanDeploy, {
      projectId: args.projectId,
      userId: identity.subject,
    });

    const connection = await ctx.runQuery(internal.deploy.getConnectionSecret, {
      userId: identity.subject,
      provider: "netlify",
    });

    if (!connection) {
      return { ok: false, reason: "not_connected" };
    }

    const linked = await ctx.runQuery(internal.deploy.getProjectTargetInternal, {
      projectId: args.projectId,
      provider: "netlify",
    });

    if (!linked?.externalId) {
      return {
        ok: false,
        reason: "no_target",
        message:
          "Deploy this project to Netlify first to link a site for env sync.",
      };
    }

    const variables = args.variables
      .map((row) => ({ key: row.key.trim(), value: row.value }))
      .filter((row) => row.key.length > 0);

    if (variables.length === 0) {
      return {
        ok: false,
        reason: "provider_error",
        message: "Add at least one environment variable with a key.",
      };
    }

    try {
      const result = await pushNetlifySiteEnv({
        token: connection.accessToken,
        accountId: connection.accountId,
        siteId: linked.externalId,
        variables,
      });

      if (result.pushed === 0 && result.failed.length > 0) {
        return {
          ok: false,
          reason: "provider_error",
          message: result.failed[0]?.message ?? "Netlify rejected all variables",
        };
      }

      return {
        ok: true,
        ...result,
        projectName: linked.name,
      };
    } catch (error) {
      return {
        ok: false,
        reason: "provider_error",
        message:
          error instanceof Error
            ? error.message
            : "Could not push Netlify environment variables",
      };
    }
  },
});
