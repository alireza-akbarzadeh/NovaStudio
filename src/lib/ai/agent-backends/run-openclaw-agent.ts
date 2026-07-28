import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  collectPendingWrites,
  syncProjectToDirectory,
} from "./project-sync";
import {
  resolveOpenClawBinary,
  spawnCommand,
} from "./spawn-command";
import type { AgentBackendRunPayload } from "./types";

async function runOpenClawViaGateway(
  payload: AgentBackendRunPayload,
  gatewayUrl: string,
  agentId?: string,
): Promise<{ text: string }> {
  const token = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();
  const base = gatewayUrl.replace(/\/$/, "");
  const url = `${base}/v1/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      agent: agentId ?? "coding",
      message: payload.prompt,
      mode: payload.mode,
      project: payload.workspace.projectName,
    }),
    signal: AbortSignal.timeout(8 * 60 * 1000),
  });

  if (!response.ok) {
    throw new Error(
      `OpenClaw Gateway returned ${response.status}. Check OPENCLAW_GATEWAY_URL and token.`,
    );
  }

  const body = (await response.json()) as {
    text?: string;
    message?: string;
    content?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text =
    body.text ??
    body.message ??
    body.content ??
    body.choices?.[0]?.message?.content ??
    "OpenClaw agent completed.";

  return { text };
}

export async function runOpenClawAgent(payload: AgentBackendRunPayload) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  const convex = new ConvexHttpClient(convexUrl);
  const runId = payload.runId as Id<"projectAiAgentRuns">;
  const jobToken = payload.jobToken;

  const started = await convex.mutation(api.projectAiAgentRunWorker.markRunning, {
    runId,
    jobToken,
  });
  if ("cancelled" in started && started.cancelled) {
    return { ok: false as const, cancelled: true as const };
  }

  const gatewayUrl =
    payload.backendConfig?.openclawGatewayUrl?.trim() ||
    process.env.OPENCLAW_GATEWAY_URL?.trim();
  const agentId =
    payload.backendConfig?.openclawAgentId?.trim() ||
    process.env.OPENCLAW_AGENT_ID?.trim();

  const workDir = await mkdtemp(join(tmpdir(), "novastudio-openclaw-"));

  try {
    const original = await syncProjectToDirectory(
      convex,
      runId,
      jobToken,
      workDir,
    );

    let assistantText: string;

    if (gatewayUrl) {
      try {
        const gatewayResult = await runOpenClawViaGateway(
          payload,
          gatewayUrl,
          agentId,
        );
        assistantText = gatewayResult.text;
      } catch {
        assistantText = await runOpenClawCli(payload, workDir, agentId);
      }
    } else {
      assistantText = await runOpenClawCli(payload, workDir, agentId);
    }

    const pendingWrites =
      payload.mode === "task"
        ? await collectPendingWrites(workDir, original)
        : [];

    await convex.mutation(api.projectAiAgentRunWorker.complete, {
      runId,
      jobToken,
      assistantText,
      pendingWrites: pendingWrites.length > 0 ? pendingWrites : undefined,
    });

    return { ok: true as const, text: assistantText };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OpenClaw agent run failed";
    await convex.mutation(api.projectAiAgentRunWorker.fail, {
      runId,
      jobToken,
      error: message,
    });
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function runOpenClawCli(
  payload: AgentBackendRunPayload,
  workDir: string,
  agentId?: string,
) {
  const binary = resolveOpenClawBinary();
  const args = [
    "agent",
    "--message",
    payload.prompt,
    "--local",
  ];
  if (agentId) {
    args.push("--agent", agentId);
  }

  const result = await spawnCommand(binary, args, {
    cwd: workDir,
    env: {
      ...process.env,
      OPENCLAW_GATEWAY_URL: process.env.OPENCLAW_GATEWAY_URL,
      OPENCLAW_GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN,
    },
    timeoutMs: 9 * 60 * 1000,
  });

  if (result.exitCode !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim();
    const hint =
      detail.includes("ENOENT") || detail.includes("not found")
        ? " Install OpenClaw on the worker or set OPENCLAW_GATEWAY_URL in Customize → Agent backends."
        : "";
    throw new Error(
      `OpenClaw CLI exited with code ${result.exitCode}${detail ? `: ${detail.slice(0, 400)}` : ""}${hint}`,
    );
  }

  return result.stdout.trim() || "OpenClaw agent completed.";
}
