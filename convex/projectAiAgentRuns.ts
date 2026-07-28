import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { createNotification } from "./lib/createNotification";
import {
  identityDisplayName,
  resolveProjectAccess,
  verifyProjectAccess,
} from "./lib/projectAccess";

const aiChatMode = v.union(v.literal("plan"), v.literal("task"));
const agentBackend = v.optional(
  v.union(
    v.literal("novastudio"),
    v.literal("cursor-cli"),
    v.literal("openclaw"),
    v.literal("cursor-cloud"),
  ),
);
const MAX_PROMPT = 8_000;
const MAX_TITLE = 120;

function createJobToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export const listForProject = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    const limit = Math.min(Math.max(args.limit ?? 30, 1), 50);
    const rows = await ctx.db
      .query("projectAiAgentRuns")
      .withIndex("by_project_updated", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(limit);

    return rows.map((row) => ({
      id: row._id,
      sessionClientId: row.sessionClientId,
      status: row.status,
      prompt: row.prompt,
      title: row.title,
      mode: row.mode,
      model: row.model,
      backend: row.backend ?? "novastudio",
      outputText: row.outputText,
      pendingWrites: row.pendingWrites ?? [],
      error: row.error,
      createdByUserId: row.createdByUserId,
      createdByName: row.createdByName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
    }));
  },
});

export const queue = mutation({
  args: {
    projectId: v.id("projects"),
    sessionClientId: v.optional(v.string()),
    prompt: v.string(),
    title: v.string(),
    mode: aiChatMode,
    model: v.string(),
    backend: agentBackend,
    workspaceSnapshot: v.any(),
    inputMessages: v.any(),
  },
  handler: async (ctx, args) => {
    const access = await resolveProjectAccess(ctx, args.projectId);
    if (!access) {
      throw new Error("Unauthorized access to this project");
    }

    const identity = await ctx.auth.getUserIdentity();
    const prompt = args.prompt.trim();
    if (!prompt) {
      throw new Error("Prompt is required");
    }
    if (prompt.length > MAX_PROMPT) {
      throw new Error(`Prompt is too long (max ${MAX_PROMPT} characters)`);
    }

    const now = Date.now();
    const jobToken = createJobToken();
    const runId = await ctx.db.insert("projectAiAgentRuns", {
      projectId: args.projectId,
      sessionClientId: args.sessionClientId,
      jobToken,
      status: "queued",
      prompt,
      title: args.title.trim().slice(0, MAX_TITLE) || "Background agent",
      mode: args.mode,
      model: args.model,
      backend: args.backend ?? "novastudio",
      workspaceSnapshot: args.workspaceSnapshot,
      inputMessages: args.inputMessages,
      createdByUserId: access.userId,
      createdByName: identity ? identityDisplayName(identity) : undefined,
      createdAt: now,
      updatedAt: now,
    });

    return { runId, jobToken };
  },
});

export const cancel = mutation({
  args: { runId: v.id("projectAiAgentRuns") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const run = await ctx.db.get(args.runId);
    if (!run) {
      throw new Error("Run not found");
    }
    await verifyProjectAccess(ctx, run.projectId);
    if (run.createdByUserId !== identity.subject) {
      throw new Error("Only the creator can cancel this run");
    }
    if (run.status !== "queued") {
      throw new Error("Only queued runs can be cancelled");
    }
    await ctx.db.patch(args.runId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
  },
});

/** Active runs the signed-in user can connect a local CLI to. */
export const listActiveBridgeRuns = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    await verifyProjectAccess(ctx, args.projectId);

    const rows = await ctx.db
      .query("projectAiAgentRuns")
      .withIndex("by_project_updated", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(20);

    return rows
      .filter(
        (row) =>
          row.createdByUserId === identity.subject &&
          (row.status === "queued" || row.status === "running"),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((row) => ({
        runId: row._id,
        jobToken: row.jobToken,
        title: row.title,
        status: row.status,
        backend: row.backend ?? "novastudio",
        prompt: row.prompt,
      }));
  },
});
