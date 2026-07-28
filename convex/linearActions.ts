"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { action, internalAction, type ActionCtx } from "./_generated/server";
import {
  createLinearIssue,
  fetchLinearIssueByIdentifier,
  getActiveLinearCycle,
  getLinearIssueDetail,
  listLinearIssues,
  listLinearTeamMembers,
  listLinearTeams,
  listLinearWorkflowStates,
  pickStateByStage,
  syncLinearIssue,
  updateLinearIssue,
  updateLinearIssueState,
  verifyLinearApiKey,
  type LinearCycleSummary,
  type LinearIssueDetail,
  type LinearIssueListItem,
  type LinearMember,
  type LinearTeamSummary,
} from "./lib/linear";

async function requireLinearConnection(ctx: ActionCtx): Promise<{
  identity: { subject: string };
  connection: Doc<"linearConnections">;
}> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Sign in to use Linear");
  }

  const connection = await ctx.runQuery(internal.linear.getConnectionForUser, {
    userId: identity.subject,
  });
  if (!connection) {
    throw new Error("Connect Linear in Integrations first");
  }

  return { identity, connection };
}

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
    const { identity, connection } = await requireLinearConnection(ctx);

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

export const listTeams = action({
  args: {},
  handler: async (ctx): Promise<LinearTeamSummary[]> => {
    const { connection } = await requireLinearConnection(ctx);
    return await listLinearTeams(connection.apiKey);
  },
});

export const getActiveCycle = action({
  args: {
    teamId: v.string(),
  },
  handler: async (ctx, args): Promise<LinearCycleSummary | null> => {
    const { connection } = await requireLinearConnection(ctx);
    return await getActiveLinearCycle(connection.apiKey, args.teamId);
  },
});

export const listIssues = action({
  args: {
    teamId: v.string(),
    scope: v.union(v.literal("mine"), v.literal("team"), v.literal("cycle")),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    issues: LinearIssueListItem[];
    activeCycle: LinearCycleSummary | null;
  }> => {
    const { connection } = await requireLinearConnection(ctx);
    return await listLinearIssues({
      apiKey: connection.apiKey,
      teamId: args.teamId,
      scope: args.scope,
      limit: args.limit,
    });
  },
});

export const getIssue = action({
  args: {
    issueIdentifier: v.string(),
  },
  handler: async (ctx, args): Promise<LinearIssueDetail> => {
    const { connection } = await requireLinearConnection(ctx);
    return await getLinearIssueDetail(connection.apiKey, args.issueIdentifier);
  },
});

export const listMembers = action({
  args: {
    teamId: v.string(),
  },
  handler: async (ctx, args): Promise<LinearMember[]> => {
    const { connection } = await requireLinearConnection(ctx);
    return await listLinearTeamMembers(connection.apiKey, args.teamId);
  },
});

export const createIssue = action({
  args: {
    teamId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    addToActiveCycle: v.optional(v.boolean()),
    assigneeId: v.optional(v.string()),
    /** todo | started | done — maps to team workflow state types */
    initialStage: v.optional(
      v.union(v.literal("todo"), v.literal("started"), v.literal("done")),
    ),
  },
  handler: async (ctx, args): Promise<LinearIssueListItem> => {
    const { connection } = await requireLinearConnection(ctx);
    const title = args.title.trim();
    if (!title) {
      throw new Error("Task title is required");
    }

    let cycleId: string | undefined;
    if (args.addToActiveCycle) {
      const cycle = await getActiveLinearCycle(connection.apiKey, args.teamId);
      // Team may not run cycles — create the task without a cycle instead of failing.
      cycleId = cycle?.id;
    }

    let stateId: string | undefined;
    if (args.initialStage) {
      const states = await listLinearWorkflowStates(
        connection.apiKey,
        args.teamId,
      );
      const stageState = pickStateByStage(states, args.initialStage);
      stateId = stageState?.id;
    }

    return await createLinearIssue({
      apiKey: connection.apiKey,
      teamId: args.teamId,
      title,
      description: args.description,
      cycleId,
      assigneeId: args.assigneeId,
      stateId,
    });
  },
});

export const updateIssueState = action({
  args: {
    issueId: v.string(),
    stateId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ stateName: string | null }> => {
    const { connection } = await requireLinearConnection(ctx);
    const stateName = await updateLinearIssueState(
      connection.apiKey,
      args.issueId,
      args.stateId,
    );
    return { stateName: stateName ?? null };
  },
});

export const updateIssue = action({
  args: {
    issueId: v.string(),
    stateId: v.optional(v.string()),
    assigneeId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { connection } = await requireLinearConnection(ctx);
    return await updateLinearIssue({
      apiKey: connection.apiKey,
      issueId: args.issueId,
      stateId: args.stateId,
      assigneeId: args.assigneeId,
    });
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
