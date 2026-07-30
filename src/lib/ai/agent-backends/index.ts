import { runCursorCliAgent } from "./run-cursor-cli-agent";
import { runNovaStudioAgent } from "./run-novastudio-agent";
import { runOpenClawAgent } from "./run-openclaw-agent";
import type { AgentBackendRunPayload } from "./types";

export async function runAgentBackend(payload: AgentBackendRunPayload) {
  switch (payload.backend) {
    case "cursor-cli":
      return runCursorCliAgent(payload);
    case "cursor-cloud":
      return runCursorCliAgent(payload, { cloud: true });
    case "openclaw":
      return runOpenClawAgent(payload);
    case "novastudio":
    default:
      return runNovaStudioAgent(payload);
  }
}

export * from "./types";
export { runNovaStudioAgent } from "./run-novastudio-agent";
export { runCursorCliAgent } from "./run-cursor-cli-agent";
export { runOpenClawAgent } from "./run-openclaw-agent";
