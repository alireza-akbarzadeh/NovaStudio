import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { UIMessage } from "ai";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { inngest } from "@/integration/inngest/client";
import { deriveSessionTitle } from "@/features/workspace/lib/ai-chat-sessions";
import {
  DEFAULT_AI_CHAT_MODE,
  isAiChatMode,
} from "@/lib/ai/chat-mode";
import {
  isAllowedNovaStudioChatModel,
  POLARIS_CHAT_MODEL,
} from "@/lib/ai/gemini-model";
import {
  isAgentBackend,
  parseAgentBackend,
  type AgentBackendConfig,
} from "@/lib/ai/agent-backends";
import type { WorkspaceChatContext } from "@/lib/ai/workspace-context";

const customizeContextSchema = z.object({
  rules: z.array(z.string()),
  preHooks: z.array(z.string()),
  postHooks: z.array(z.string()),
  subagents: z.array(
    z.object({
      name: z.string(),
      content: z.string(),
    }),
  ),
});

const workspaceContextSchema = z.object({
  projectName: z.string().optional(),
  activeFilePath: z.string().optional(),
  activeFileContent: z.string().optional(),
  openFiles: z.array(z.string()).optional(),
  fileTree: z.array(z.string()).optional(),
  changedFiles: z.array(z.string()).optional(),
  customize: customizeContextSchema.optional(),
});

const agentBackendConfigSchema = z.object({
  openclawGatewayUrl: z.string().optional(),
  openclawAgentId: z.string().optional(),
});

const requestSchema = z.object({
  projectId: z.string(),
  sessionClientId: z.string().optional(),
  prompt: z.string().min(1),
  mode: z.enum(["plan", "task"]).optional(),
  model: z.string().optional(),
  backend: z.string().optional(),
  backendConfig: agentBackendConfigSchema.optional(),
  workspace: workspaceContextSchema.optional(),
  messages: z.array(z.custom<UIMessage>()).optional(),
});

export async function POST(request: Request) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = requestSchema.parse(await request.json());
    const projectId = body.projectId.trim() as Id<"projects">;
    const prompt = body.prompt.trim();
    const mode = isAiChatMode(body.mode) ? body.mode : DEFAULT_AI_CHAT_MODE;
    const model =
      body.model && isAllowedNovaStudioChatModel(body.model)
        ? body.model
        : POLARIS_CHAT_MODEL;

    const convexToken = await getToken({ template: "convex" });
    if (!convexToken) {
      return NextResponse.json(
        { error: "Missing Convex auth token" },
        { status: 401 },
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 },
      );
    }

    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(convexToken);

    const [project, prefs] = await Promise.all([
      convex.query(api.projects.getProjectById, { projectId }),
      convex.query(api.userPreferences.get, {}),
    ]);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const backend = body.backend && isAgentBackend(body.backend)
      ? body.backend
      : parseAgentBackend(prefs?.agentBackend);
    const backendConfig: AgentBackendConfig | undefined =
      body.backendConfig ??
      (prefs?.agentBackendConfig as AgentBackendConfig | undefined);

    const userMessage: UIMessage = {
      id: nanoid(),
      role: "user",
      parts: [{ type: "text", text: prompt }],
    };
    const inputMessages = [...(body.messages ?? []), userMessage];

    const workspace: WorkspaceChatContext = {
      projectName: body.workspace?.projectName ?? project.name,
      activeFilePath: body.workspace?.activeFilePath,
      activeFileContent: body.workspace?.activeFileContent,
      openFiles: body.workspace?.openFiles,
      fileTree: body.workspace?.fileTree,
      changedFiles: body.workspace?.changedFiles,
      customize: body.workspace?.customize,
    };

    const title = deriveSessionTitle(prompt);

    const { runId, jobToken } = await convex.mutation(
      api.projectAiAgentRuns.queue,
      {
        projectId,
        sessionClientId: body.sessionClientId,
        prompt,
        title,
        mode,
        model,
        backend,
        workspaceSnapshot: workspace,
        inputMessages,
      },
    );

    await inngest.send({
      name: "ai/agent.run.requested",
      data: {
        runId,
        jobToken,
        prompt,
        mode,
        model,
        backend,
        backendConfig,
        workspace,
        messages: inputMessages,
      },
    });

    return NextResponse.json({ ok: true, runId, title, backend });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to queue background run";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
