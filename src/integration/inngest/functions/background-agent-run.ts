import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import { inngest } from "@/integration/inngest/client";
import {
  runAgentBackend,
  type AgentBackend,
  type AgentBackendConfig,
} from "@/lib/ai/agent-backends";
import type { AiChatMode } from "@/lib/ai/chat-mode";
import type { WorkspaceChatContext } from "@/lib/ai/workspace-context";
import type { UIMessage } from "ai";
import type { Id } from "@/convex/_generated/dataModel";

type BackgroundAgentRequestedData = {
  runId: string;
  jobToken: string;
  prompt: string;
  mode: AiChatMode;
  model: string;
  backend: AgentBackend;
  backendConfig?: AgentBackendConfig;
  workspace: WorkspaceChatContext;
  messages: UIMessage[];
};

async function markRunFailed(runId: string, jobToken: string, reason: string) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return;
  const convex = new ConvexHttpClient(convexUrl);
  try {
    await convex.mutation(api.projectAiAgentRunWorker.fail, {
      runId: runId as Id<"projectAiAgentRuns">,
      jobToken,
      error: reason,
    });
  } catch {
    // Best-effort — user may retry from the runs panel.
  }
}

export const backgroundAgentRunJob = inngest.createFunction(
  {
    id: "project-background-agent-run",
    triggers: [{ event: "ai/agent.run.requested" }],
    retries: 1,
    timeouts: {
      finish: "10m",
    },
    onFailure: async ({ event }) => {
      const root = event.data as {
        event?: { data?: BackgroundAgentRequestedData };
        runId?: string;
        jobToken?: string;
      };
      const payload: BackgroundAgentRequestedData | undefined =
        root.event?.data ??
        (root.runId && root.jobToken
          ? (root as BackgroundAgentRequestedData)
          : undefined);
      if (!payload?.runId || !payload.jobToken) return;
      await markRunFailed(
        payload.runId,
        payload.jobToken,
        "The background agent run failed after retries.",
      );
    },
  },
  async ({ event, step }) => {
    const data = event.data as BackgroundAgentRequestedData;

    return await step.run("execute-agent", async () =>
      runAgentBackend({
        runId: data.runId,
        jobToken: data.jobToken,
        prompt: data.prompt ?? "",
        mode: data.mode,
        model: data.model,
        backend: data.backend ?? "novastudio",
        backendConfig: data.backendConfig,
        workspace: data.workspace,
        messages: data.messages,
      }),
    );
  },
);
