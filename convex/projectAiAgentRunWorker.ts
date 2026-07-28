import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { createNotification } from "./lib/createNotification";
import { readFileContent } from "./lib/projectFileContents";

const pendingWriteValidator = v.object({
  path: v.string(),
  content: v.string(),
});

function mergePendingWrites(
  staged: Array<{ path: string; content: string }>,
  incoming: Array<{ path: string; content: string }>,
) {
  const map = new Map<string, { path: string; content: string }>();
  for (const row of staged) map.set(row.path, row);
  for (const row of incoming) map.set(row.path, row);
  return [...map.values()];
}

async function getRunForToken(
  ctx: { db: { get: (id: Id<"projectAiAgentRuns">) => Promise<Doc<"projectAiAgentRuns"> | null> } },
  runId: Id<"projectAiAgentRuns">,
  jobToken: string,
  allowedStatuses: Array<Doc<"projectAiAgentRuns">["status"]>,
) {
  const run = await ctx.db.get(runId);
  if (!run || run.jobToken !== jobToken) {
    throw new Error("Invalid agent run token");
  }
  if (!allowedStatuses.includes(run.status)) {
    throw new Error("Agent run is not active");
  }
  return run;
}

export const markRunning = mutation({
  args: {
    runId: v.id("projectAiAgentRuns"),
    jobToken: v.string(),
  },
  handler: async (ctx, args) => {
    const run = await getRunForToken(ctx, args.runId, args.jobToken, [
      "queued",
      "running",
      "cancelled",
    ]);
    if (run.status === "cancelled") {
      return { ok: false as const, cancelled: true as const };
    }
    if (run.status === "running") {
      return { ok: true as const };
    }
    const now = Date.now();
    await ctx.db.patch(args.runId, {
      status: "running",
      startedAt: now,
      updatedAt: now,
    });
    return { ok: true as const };
  },
});

export const readFile = mutation({
  args: {
    runId: v.id("projectAiAgentRuns"),
    jobToken: v.string(),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const run = await getRunForToken(ctx, args.runId, args.jobToken, ["running"]);
    const file = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectId", run.projectId).eq("path", args.path),
      )
      .unique();
    if (!file || file.kind !== "file") {
      return { error: "File not found", path: args.path };
    }
    const body = await readFileContent(ctx, run.projectId, args.path, file);
    return {
      path: args.path,
      content: body.content,
    };
  },
});

export const listFiles = mutation({
  args: {
    runId: v.id("projectAiAgentRuns"),
    jobToken: v.string(),
    prefix: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const run = await getRunForToken(ctx, args.runId, args.jobToken, ["running"]);
    const rows = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", run.projectId))
      .collect();

    const prefix = args.prefix?.trim();
    const paths = rows
      .filter((row) => row.kind === "file")
      .map((row) => row.path)
      .filter((path) => !prefix || path.startsWith(prefix))
      .sort()
      .slice(0, 500);

    return { paths };
  },
});

export const stagePendingWrite = mutation({
  args: {
    runId: v.id("projectAiAgentRuns"),
    jobToken: v.string(),
    path: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const run = await getRunForToken(ctx, args.runId, args.jobToken, ["running"]);
    const existing = run.pendingWrites ?? [];
    const next = existing.filter((row) => row.path !== args.path);
    next.push({ path: args.path, content: args.content });
    await ctx.db.patch(args.runId, {
      pendingWrites: next,
      updatedAt: Date.now(),
    });
    return {
      pendingReview: true,
      path: args.path,
      message: "Queued for user review when the run completes.",
    };
  },
});

export const complete = mutation({
  args: {
    runId: v.id("projectAiAgentRuns"),
    jobToken: v.string(),
    assistantText: v.string(),
    pendingWrites: v.optional(v.array(pendingWriteValidator)),
  },
  handler: async (ctx, args) => {
    const run = await getRunForToken(ctx, args.runId, args.jobToken, ["running"]);
    const now = Date.now();
    const assistantMessage = {
      id: `bg-${args.runId}`,
      role: "assistant" as const,
      parts: [{ type: "text" as const, text: args.assistantText }],
    };
    const inputMessages = Array.isArray(run.inputMessages)
      ? [...run.inputMessages]
      : [];
    const mergedMessages = [...inputMessages, assistantMessage];

    if (run.sessionClientId) {
      const session = await ctx.db
        .query("projectAiChatSessions")
        .withIndex("by_project_client", (q) =>
          q
            .eq("projectId", run.projectId)
            .eq("clientId", run.sessionClientId!),
        )
        .unique();
      if (session) {
        await ctx.db.patch(session._id, {
          messages: mergedMessages,
          subtitle:
            args.assistantText.length > 64
              ? `${args.assistantText.slice(0, 64)}…`
              : args.assistantText,
          updatedAt: now,
        });
      }
    }

    const stagedCount = run.pendingWrites?.length ?? 0;
    const mergedPending =
      args.pendingWrites && stagedCount > 0
        ? mergePendingWrites(run.pendingWrites ?? [], args.pendingWrites)
        : args.pendingWrites ?? run.pendingWrites;
    const totalWrites = mergedPending?.length ?? 0;

    await ctx.db.patch(args.runId, {
      status: "completed",
      outputText: args.assistantText,
      pendingWrites: mergedPending,
      completedAt: now,
      updatedAt: now,
    });

    await createNotification(ctx, {
      userId: run.createdByUserId,
      title: `Agent finished: ${run.title}`,
      body:
        totalWrites > 0
          ? `${totalWrites} file change${totalWrites === 1 ? "" : "s"} ready to review.`
          : args.assistantText.slice(0, 160),
      tone: "violet",
      soundKind: "aiDone",
      href: `/projects/${run.projectId}`,
      projectId: run.projectId,
      kind: "general",
    });

    return { ok: true as const };
  },
});

export const fail = mutation({
  args: {
    runId: v.id("projectAiAgentRuns"),
    jobToken: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.jobToken !== args.jobToken) {
      return { ok: false as const };
    }
    if (run.status === "completed" || run.status === "cancelled") {
      return { ok: false as const };
    }

    const now = Date.now();
    await ctx.db.patch(args.runId, {
      status: "failed",
      error: args.error.slice(0, 500),
      completedAt: now,
      updatedAt: now,
    });

    await createNotification(ctx, {
      userId: run.createdByUserId,
      title: `Agent failed: ${run.title}`,
      body: args.error.slice(0, 160),
      tone: "orange",
      soundKind: "error",
      href: `/projects/${run.projectId}`,
      projectId: run.projectId,
      kind: "general",
    });

    return { ok: true as const };
  },
});
