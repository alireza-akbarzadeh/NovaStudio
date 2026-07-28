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
  resolveCursorCliBinary,
  spawnCommand,
} from "./spawn-command";
import type { AgentBackendRunPayload } from "./types";

function buildCursorPrompt(payload: AgentBackendRunPayload, cloud: boolean) {
  const modeHint =
    payload.mode === "plan"
      ? "Plan only — do not modify files unless explicitly asked."
      : "Implement changes in the workspace files.";
  const cloudHint = cloud
    ? "Prefer Cursor Cloud Agent execution when the task is long-running."
    : "";
  return [
    `You are working in a NovaStudio cloud project${payload.workspace.projectName ? `: ${payload.workspace.projectName}` : ""}.`,
    modeHint,
    cloudHint,
    "",
    payload.prompt,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function runCursorCliAgent(
  payload: AgentBackendRunPayload,
  options: { cloud?: boolean } = {},
) {
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

  const workDir = await mkdtemp(join(tmpdir(), "novastudio-cursor-"));

  try {
    const original = await syncProjectToDirectory(
      convex,
      runId,
      jobToken,
      workDir,
    );

    const binary = resolveCursorCliBinary();
    const prompt = buildCursorPrompt(payload, options.cloud === true);
    const args = [
      "-p",
      prompt,
      "--output-format",
      "text",
      "--mode",
      payload.mode === "plan" ? "plan" : "agent",
    ];

    const result = await spawnCommand(binary, args, {
      cwd: workDir,
      env: {
        ...process.env,
        CURSOR_API_KEY: process.env.CURSOR_API_KEY,
        CURSOR_AUTH_TOKEN: process.env.CURSOR_AUTH_TOKEN,
      },
      timeoutMs: 9 * 60 * 1000,
    });

    if (result.exitCode !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim();
      const hint =
        detail.includes("ENOENT") || detail.includes("not found")
          ? " Install Cursor CLI on the worker (`curl https://cursor.com/install -fsS | bash`) and set CURSOR_API_KEY."
          : "";
      throw new Error(
        `Cursor CLI exited with code ${result.exitCode}${detail ? `: ${detail.slice(0, 400)}` : ""}${hint}`,
      );
    }

    const assistantText = result.stdout.trim() || "Cursor agent completed.";
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
      error instanceof Error ? error.message : "Cursor CLI agent run failed";
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
