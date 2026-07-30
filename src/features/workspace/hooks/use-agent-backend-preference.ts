"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";

import { api } from "@/convex/_generated/api";
import {
  DEFAULT_AGENT_BACKEND,
  isAgentBackend,
  type AgentBackend,
} from "@/lib/ai/agent-backends";

export function useAgentBackendPreference() {
  const prefs = useQuery(api.userPreferences.get, {});
  const upsert = useMutation(api.userPreferences.upsertAgentBackend);

  const backend: AgentBackend =
    prefs?.agentBackend && isAgentBackend(prefs.agentBackend)
      ? prefs.agentBackend
      : DEFAULT_AGENT_BACKEND;

  const setBackend = useCallback(
    (next: AgentBackend) =>
      upsert({
        agentBackend: next,
        agentBackendConfig: prefs?.agentBackendConfig,
      }),
    [prefs?.agentBackendConfig, upsert],
  );

  return {
    backend,
    backendConfig: prefs?.agentBackendConfig,
    ready: prefs !== undefined,
    setBackend,
    upsert,
  };
}
