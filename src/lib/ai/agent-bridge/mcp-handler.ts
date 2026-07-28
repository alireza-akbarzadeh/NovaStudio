import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const toolCallSchema = z.object({
  name: z.enum(["readFile", "listFiles", "writeFile"]),
  arguments: z.record(z.string(), z.unknown()),
});

export const WORKSPACE_MCP_TOOLS = [
  {
    name: "readFile",
    description: "Read a file from the NovaStudio cloud project.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path relative to project root" },
      },
      required: ["path"],
    },
  },
  {
    name: "listFiles",
    description: "List file paths in the cloud project.",
    inputSchema: {
      type: "object",
      properties: {
        prefix: {
          type: "string",
          description: "Optional path prefix filter",
        },
      },
    },
  },
  {
    name: "writeFile",
    description:
      "Propose a file change in the cloud project (queued for user review).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" },
      },
      required: ["path", "content"],
    },
  },
] as const;

export async function callWorkspaceMcpTool(
  runId: string,
  jobToken: string,
  name: "readFile" | "listFiles" | "writeFile",
  args: Record<string, unknown>,
) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Convex URL not configured");
  }

  const convex = new ConvexHttpClient(convexUrl);
  const typedRunId = runId as Id<"projectAiAgentRuns">;

  switch (name) {
    case "readFile": {
      const path = z.string().parse(args.path);
      return convex.mutation(api.projectAiAgentRunWorker.readFile, {
        runId: typedRunId,
        jobToken,
        path,
      });
    }
    case "listFiles": {
      const prefix =
        args.prefix === undefined ? undefined : z.string().parse(args.prefix);
      return convex.mutation(api.projectAiAgentRunWorker.listFiles, {
        runId: typedRunId,
        jobToken,
        prefix,
      });
    }
    case "writeFile": {
      const path = z.string().parse(args.path);
      const content = z.string().parse(args.content);
      return convex.mutation(api.projectAiAgentRunWorker.stagePendingWrite, {
        runId: typedRunId,
        jobToken,
        path,
        content,
      });
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export function parseMcpToolCall(body: unknown) {
  return toolCallSchema.parse(body);
}
