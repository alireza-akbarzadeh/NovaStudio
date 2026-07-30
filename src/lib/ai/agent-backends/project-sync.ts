import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type PendingWrite = { path: string; content: string };

async function ensureDirForFile(filePath: string) {
  await mkdir(dirname(filePath), { recursive: true });
}

export async function syncProjectToDirectory(
  convex: ConvexHttpClient,
  runId: Id<"projectAiAgentRuns">,
  jobToken: string,
  rootDir: string,
): Promise<Map<string, string>> {
  const original = new Map<string, string>();
  const { paths } = await convex.mutation(api.projectAiAgentRunWorker.listFiles, {
    runId,
    jobToken,
  });

  for (const path of paths) {
    const result = await convex.mutation(api.projectAiAgentRunWorker.readFile, {
      runId,
      jobToken,
      path,
    });
    if ("error" in result) continue;
    const content = result.content ?? "";
    original.set(path, content);
    const absolute = join(rootDir, path);
    await ensureDirForFile(absolute);
    await writeFile(absolute, content, "utf8");
  }

  return original;
}

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolute)));
    } else if (entry.isFile()) {
      files.push(absolute);
    } else if (entry.isSymbolicLink()) {
      const linked = await stat(absolute).catch(() => null);
      if (linked?.isFile()) files.push(absolute);
    }
  }

  return files;
}

export async function collectPendingWrites(
  rootDir: string,
  original: Map<string, string>,
): Promise<PendingWrite[]> {
  const pending: PendingWrite[] = [];
  const files = await walkFiles(rootDir);

  for (const absolute of files) {
    const path = relative(rootDir, absolute).replace(/\\/g, "/");
    const content = await readFile(absolute, "utf8");
    const previous = original.get(path);
    if (previous === undefined || previous !== content) {
      pending.push({ path, content });
    }
  }

  return pending;
}
