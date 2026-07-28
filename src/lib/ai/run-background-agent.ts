export {
  runAgentBackend,
  runNovaStudioAgent,
  type AgentBackend,
  type AgentBackendConfig,
  type AgentBackendRunPayload,
  AGENT_BACKEND_LABELS,
  AGENT_BACKENDS,
  DEFAULT_AGENT_BACKEND,
  isAgentBackend,
  parseAgentBackend,
} from "@/lib/ai/agent-backends";

/** @deprecated Use runAgentBackend from agent-backends instead. */
export { runNovaStudioAgent as runBackgroundAgent } from "@/lib/ai/agent-backends/run-novastudio-agent";
export type { AgentBackendRunPayload as BackgroundAgentRunPayload } from "@/lib/ai/agent-backends/types";
