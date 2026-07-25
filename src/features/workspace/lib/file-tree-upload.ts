import { suggestUniqueName } from "@/features/workspace/lib/unique-name";

export const MAX_UPLOAD_FILE_BYTES = 512 * 1024;
export const MAX_UPLOAD_FILES = 500;

const IGNORED_PATH_PREFIXES = [
  ".git/",
  "node_modules/",
  ".next/",
  "dist/",
  "build/",
  ".cache/",
  "coverage/",
];

const IGNORED_PATHS = new Set([
  ".DS_Store",
  "Thumbs.db",
  ".env.local",
  ".env",
]);

const TEXT_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "json",
  "md",
  "mdx",
  "css",
  "scss",
  "sass",
  "less",
  "html",
  "htm",
  "svg",
  "txt",
  "yml",
  "yaml",
  "toml",
  "xml",
  "csv",
  "tsv",
  "env",
  "sh",
  "bash",
  "zsh",
  "sql",
  "graphql",
  "gql",
  "vue",
  "svelte",
  "astro",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "swift",
  "c",
  "h",
  "cpp",
  "hpp",
  "cs",
  "php",
  "lua",
  "r",
  "dart",
  "nim",
  "zig",
  "tf",
  "hcl",
  "proto",
  "lock",
  "gitignore",
  "dockerignore",
  "editorconfig",
  "prettierrc",
  "eslintrc",
  "npmrc",
  "map",
]);

const TEXT_BASENAMES = new Set([
  "dockerfile",
  "makefile",
  "license",
  "licence",
  "readme",
  "changelog",
  "authors",
  "contributing",
  "gemfile",
  "rakefile",
  "procfile",
  "vercel.json",
  "netlify.toml",
  "package.json",
  "tsconfig.json",
  "jsconfig.json",
]);

export type UploadSkipReason =
  | "ignored"
  | "too_large"
  | "binary"
  | "limit"
  | "invalid";

export type UploadSkip = {
  name: string;
  reason: UploadSkipReason;
};

export type UploadWrite = {
  path: string;
  content: string;
};

export type PrepareUploadsResult = {
  writes: UploadWrite[];
  skipped: UploadSkip[];
};

export function shouldIgnoreUploadPath(path: string): boolean {
  const normalized = path.replace(/^\/+/, "").replace(/\/+/g, "/");
  const base = normalized.split("/").pop() ?? normalized;

  if (IGNORED_PATHS.has(normalized) || IGNORED_PATHS.has(base)) {
    return true;
  }

  return IGNORED_PATH_PREFIXES.some(
    (prefix) =>
      normalized === prefix.slice(0, -1) ||
      normalized.startsWith(prefix) ||
      normalized.includes(`/${prefix}`),
  );
}

function normalizeRelativePath(path: string): string | null {
  const normalized = path
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
  if (!normalized || normalized.includes("..")) {
    return null;
  }
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0 || segments.some((s) => !s || s === ".")) {
    return null;
  }
  return segments.join("/");
}

function joinPath(parentPath: string | undefined, relativePath: string): string {
  return parentPath ? `${parentPath}/${relativePath}` : relativePath;
}

function dirname(path: string): string | undefined {
  const index = path.lastIndexOf("/");
  return index === -1 ? undefined : path.slice(0, index);
}

function basename(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? path : path.slice(index + 1);
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return "";
  return name.slice(dot + 1).toLowerCase();
}

function isLikelyTextFile(file: File, relativePath: string): boolean {
  const name = basename(relativePath).toLowerCase();
  const ext = extensionOf(name);

  if (TEXT_BASENAMES.has(name) || TEXT_EXTENSIONS.has(ext)) {
    return true;
  }

  const type = file.type.toLowerCase();
  if (!type) {
    // Unknown MIME with no known text extension — allow and check null bytes later
    return true;
  }
  if (
    type.startsWith("text/") ||
    type === "application/json" ||
    type === "application/javascript" ||
    type === "application/typescript" ||
    type === "application/xml" ||
    type === "application/x-yaml" ||
    type === "application/yaml" ||
    type === "image/svg+xml"
  ) {
    return true;
  }

  return false;
}

function looksBinaryContent(content: string): boolean {
  return content.includes("\0");
}

function uniqueDestPath(
  desiredPath: string,
  existingPaths: Set<string>,
  reservedPaths: Set<string>,
): string {
  const parent = dirname(desiredPath);
  const name = basename(desiredPath);
  const siblingNames = new Set<string>();

  for (const path of existingPaths) {
    if (dirname(path) === parent) {
      siblingNames.add(basename(path));
    }
  }
  for (const path of reservedPaths) {
    if (dirname(path) === parent) {
      siblingNames.add(basename(path));
    }
  }

  const uniqueName = suggestUniqueName(siblingNames, name);
  return parent ? `${parent}/${uniqueName}` : uniqueName;
}

export async function prepareFileUploads(
  files: File[],
  options: {
    targetParentPath?: string;
    existingPaths: Iterable<string>;
  },
): Promise<PrepareUploadsResult> {
  const existingPaths = new Set(options.existingPaths);
  const reservedPaths = new Set<string>();
  const writes: UploadWrite[] = [];
  const skipped: UploadSkip[] = [];

  const capped = files.slice(0, MAX_UPLOAD_FILES);
  for (const file of files.slice(MAX_UPLOAD_FILES)) {
    skipped.push({ name: file.name, reason: "limit" });
  }

  for (const file of capped) {
    const rawRelative = file.webkitRelativePath || file.name;
    const relativePath = normalizeRelativePath(rawRelative);
    if (!relativePath) {
      skipped.push({ name: file.name, reason: "invalid" });
      continue;
    }

    const checkPath = joinPath(options.targetParentPath, relativePath);
    if (shouldIgnoreUploadPath(checkPath) || shouldIgnoreUploadPath(relativePath)) {
      skipped.push({ name: relativePath, reason: "ignored" });
      continue;
    }

    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      skipped.push({ name: relativePath, reason: "too_large" });
      continue;
    }

    if (!isLikelyTextFile(file, relativePath)) {
      skipped.push({ name: relativePath, reason: "binary" });
      continue;
    }

    let content: string;
    try {
      content = await file.text();
    } catch {
      skipped.push({ name: relativePath, reason: "invalid" });
      continue;
    }

    if (looksBinaryContent(content)) {
      skipped.push({ name: relativePath, reason: "binary" });
      continue;
    }

    const desiredPath = joinPath(options.targetParentPath, relativePath);
    const path = uniqueDestPath(desiredPath, existingPaths, reservedPaths);
    reservedPaths.add(path);
    writes.push({ path, content });
  }

  return { writes, skipped };
}

export function summarizeUploadResult(
  writeCount: number,
  skipped: UploadSkip[],
): string {
  if (writeCount === 0 && skipped.length === 0) {
    return "No files to upload";
  }

  if (skipped.length === 0) {
    return writeCount === 1
      ? "Uploaded 1 file"
      : `Uploaded ${writeCount} files`;
  }

  const reasonCounts = skipped.reduce(
    (acc, item) => {
      acc[item.reason] = (acc[item.reason] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<UploadSkipReason, number>>,
  );

  const reasonLabel =
    reasonCounts.too_large && Object.keys(reasonCounts).length === 1
      ? "too large"
      : reasonCounts.binary && Object.keys(reasonCounts).length === 1
        ? "binary"
        : reasonCounts.ignored && Object.keys(reasonCounts).length === 1
          ? "ignored"
          : reasonCounts.limit && Object.keys(reasonCounts).length === 1
            ? "over limit"
            : "skipped";

  if (writeCount === 0) {
    return `Skipped ${skipped.length} file${skipped.length === 1 ? "" : "s"} (${reasonLabel})`;
  }

  return `Uploaded ${writeCount}, skipped ${skipped.length} (${reasonLabel})`;
}

export function isFileDataTransfer(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types).includes("Files");
}
