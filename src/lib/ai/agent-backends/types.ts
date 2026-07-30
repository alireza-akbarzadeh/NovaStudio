import type { AiChatMode } from "@/lib/ai/chat-mode";
import type { WorkspaceChatContext } from "@/lib/ai/workspace-context";
import type { UIMessage } from "ai";

export const AGENT_BACKENDS = [
  "novastudio",
  "cursor-cli",
  "openclaw",
  "cursor-cloud",
] as const;

export type AgentBackend = (typeof AGENT_BACKENDS)[number];

export const DEFAULT_AGENT_BACKEND: AgentBackend = "novastudio";

export type AgentBackendConfig = {
  openclawGatewayUrl?: string;
  openclawAgentId?: string;
};

export type AgentBackendRunPayload = {
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

export const AGENT_BACKEND_LABELS: Record<
  AgentBackend,
  { label: string; description: string }
> = {
  novastudio: {
    label: "NovaStudio",
    description: "Built-in Gemini agent with diff review",
  },
  "cursor-cli": {
    label: "Cursor CLI",
    description: "Runs Cursor Agent on the worker via `agent -p`",
  },
  openclaw: {
    label: "OpenClaw",
    description: "Routes tasks to your OpenClaw Gateway",
  },
  "cursor-cloud": {
    label: "Cursor Cloud",
    description: "Cursor CLI with cloud-agent handoff when available",
  },
};

export function isAgentBackend(value: unknown): value is AgentBackend {
  return (
    typeof value === "string" &&
    (AGENT_BACKENDS as readonly string[]).includes(value)
  );
}

export function parseAgentBackend(value: unknown): AgentBackend {
  return isAgentBackend(value) ? value : DEFAULT_AGENT_BACKEND;
}
