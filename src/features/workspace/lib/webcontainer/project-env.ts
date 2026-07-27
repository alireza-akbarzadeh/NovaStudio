import { loadFileContentDraft } from "@/features/workspace/lib/file-content-drafts";
import {
  listEnvFilePaths,
  mergeEnvEntries,
  parseEnvBulk,
} from "@/features/workspace/lib/parse-env-file";

export type ProjectEnvFileSource = {
  path: string;
  content?: string;
  updatedAt?: number;
};

const DEV_ENV_LOAD_ORDER = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
] as const;

function orderedEnvPaths(paths: string[]): string[] {
  const set = new Set(paths);
  const ordered: string[] = [];
  for (const path of DEV_ENV_LOAD_ORDER) {
    if (set.has(path)) ordered.push(path);
  }
  for (const path of [...set].sort()) {
    if (!ordered.includes(path)) ordered.push(path);
  }
  return ordered;
}

function fileContent(
  projectId: string,
  file: ProjectEnvFileSource | undefined,
): string {
  if (!file) return "";
  const draft = loadFileContentDraft(projectId, file.path);
  if (draft && draft.updatedAt >= (file.updatedAt ?? 0)) {
    return draft.content;
  }
  return file.content ?? "";
}

/**
 * Merge project `.env*` files into a flat map (later files override).
 * Includes HOST/HOSTNAME for WebContainer preview binding.
 */
export function resolveProjectEnv(
  projectId: string,
  files: ProjectEnvFileSource[],
  mode: "development" | "production" = "development",
): Record<string, string> {
  const envPaths = orderedEnvPaths(
    listEnvFilePaths(files.map((file) => file.path)),
  );

  let entries: Array<{ key: string; value: string }> = [];
  for (const path of envPaths) {
    const file = files.find((row) => row.path === path);
    const content = fileContent(projectId, file);
    if (!content.trim()) continue;
    entries = mergeEnvEntries(entries, parseEnvBulk(content, path));
  }

  const env: Record<string, string> = {
    NODE_ENV: mode,
    HOST: "0.0.0.0",
    HOSTNAME: "0.0.0.0",
  };

  for (const entry of entries) {
    env[entry.key] = entry.value;
  }

  return env;
}

/** Stable signature for preview restart when env files change. */
export function computeEnvSignature(
  projectId: string,
  files: ProjectEnvFileSource[],
): string {
  const envPaths = orderedEnvPaths(
    listEnvFilePaths(files.map((file) => file.path)),
  );
  if (envPaths.length === 0) return "";

  return envPaths
    .map((path) => {
      const file = files.find((row) => row.path === path);
      return `${path}=${fileContent(projectId, file)}`;
    })
    .join("\n");
}

export function envVarCount(
  projectId: string,
  files: ProjectEnvFileSource[],
): number {
  const env = resolveProjectEnv(projectId, files);
  return Object.keys(env).filter(
    (key) => !["NODE_ENV", "HOST", "HOSTNAME"].includes(key),
  ).length;
}
