import { google } from "@ai-sdk/google";
import { ConvexHttpClient } from "convex/browser";
import {
  convertToModelMessages,
  generateText,
  stepCountIs,
  tool,
} from "ai";
import { z } from "zod";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  isAllowedNovaStudioChatModel,
  POLARIS_CHAT_MODEL,
} from "@/lib/ai/gemini-model";
import { buildWorkspaceSystemPrompt } from "@/lib/ai/workspace-context";

import type { AgentBackendRunPayload } from "./types";

export async function runNovaStudioAgent(payload: AgentBackendRunPayload) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  const convex = new ConvexHttpClient(convexUrl);
  const runId = payload.runId as Id<"projectAiAgentRuns">;
  const jobToken = payload.jobToken;
  const model =
    payload.model && isAllowedNovaStudioChatModel(payload.model)
      ? payload.model
      : POLARIS_CHAT_MODEL;

  const started = await convex.mutation(api.projectAiAgentRunWorker.markRunning, {
    runId,
    jobToken,
  });
  if ("cancelled" in started && started.cancelled) {
    return { ok: false as const, cancelled: true as const };
  }

  const pendingWrites: Array<{ path: string; content: string }> = [];

  const readFileTool = tool({
    description: "Read the current contents of a file in the project workspace.",
    inputSchema: z.object({
      path: z.string().describe("Path relative to project root"),
    }),
    execute: async ({ path }) =>
      convex.mutation(api.projectAiAgentRunWorker.readFile, {
        runId,
        jobToken,
        path,
      }),
  });

  const listFilesTool = tool({
    description:
      "List file paths in the project (files only). Optionally filter by path prefix.",
    inputSchema: z.object({
      prefix: z
        .string()
        .optional()
        .describe("Optional path prefix, e.g. src/components"),
    }),
    execute: async ({ prefix }) =>
      convex.mutation(api.projectAiAgentRunWorker.listFiles, {
        runId,
        jobToken,
        prefix,
      }),
  });

  const writeFileTool = tool({
    description:
      "Propose creating or overwriting a file. Changes are queued for user review when the run completes.",
    inputSchema: z.object({
      path: z.string(),
      content: z.string(),
    }),
    execute: async ({ path, content }) => {
      pendingWrites.push({ path, content });
      return {
        pendingReview: true,
        path,
        message: "Queued for user review when the background run completes.",
      };
    },
  });

  const tools: Record<string, typeof readFileTool | typeof listFilesTool | typeof writeFileTool> =
    payload.mode === "plan"
      ? { readFile: readFileTool, listFiles: listFilesTool }
      : {
          readFile: readFileTool,
          listFiles: listFilesTool,
          writeFile: writeFileTool,
        };

  try {
    const result = await generateText({
      model: google(model),
      system: buildWorkspaceSystemPrompt(payload.workspace, payload.mode),
      messages: await convertToModelMessages(payload.messages),
      tools,
      stopWhen: stepCountIs(payload.mode === "plan" ? 6 : 8),
    });

    await convex.mutation(api.projectAiAgentRunWorker.complete, {
      runId,
      jobToken,
      assistantText: result.text,
      pendingWrites: pendingWrites.length > 0 ? pendingWrites : undefined,
    });

    return { ok: true as const, text: result.text };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Background agent run failed";
    await convex.mutation(api.projectAiAgentRunWorker.fail, {
      runId,
      jobToken,
      error: message,
    });
    throw error;
  }
}
