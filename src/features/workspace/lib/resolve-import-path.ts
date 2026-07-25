/** Resolve import / module specifiers against a project file index. */

import { dirnamePath, joinPath, toPosixPath } from "@/lib/posix-path";

const SOURCE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs", ".json", ".css", ".scss"];

const INDEX_FILES = [
  "index.tsx",
  "index.ts",
  "index.jsx",
  "index.js",
];

export type ProjectFileEntry = {
  path: string;
  content?: string;
};

/** Map common aliases (`@/` → `src/`) used in React / Next templates. */
export function expandPathAlias(specifier: string): string | null {
  if (specifier.startsWith("@/")) {
    return `src/${specifier.slice(2)}`;
  }
  if (specifier.startsWith("~/")) {
    return specifier.slice(2);
  }
  return null;
}

function candidatesForBase(
  base: string,
  fileSet: Set<string>,
): string | null {
  const normalized = toPosixPath(base);
  if (fileSet.has(normalized)) return normalized;

  for (const ext of SOURCE_EXTENSIONS) {
    const withExt = normalized.endsWith(ext) ? normalized : `${normalized}${ext}`;
    if (fileSet.has(withExt)) return withExt;
  }

  for (const index of INDEX_FILES) {
    const asIndex = joinPath(normalized, index);
    if (fileSet.has(asIndex)) return asIndex;
  }

  return null;
}

/**
 * Resolve a module specifier from `fromPath` against known project files.
 * Returns the project-relative path, or null if not found in the workspace.
 */
export function resolveImportPath(
  fromPath: string,
  specifier: string,
  filePaths: Iterable<string>,
): string | null {
  const trimmed = specifier.trim();
  if (!trimmed || trimmed.startsWith("http:") || trimmed.startsWith("https:")) {
    return null;
  }

  // Skip bare package imports (react, next/link, lodash, …).
  const isRelative = trimmed.startsWith("./") || trimmed.startsWith("../");
  const aliased = expandPathAlias(trimmed);
  if (!isRelative && !aliased) {
    return null;
  }

  const fileSet = new Set([...filePaths].map((path) => toPosixPath(path)));

  const base = aliased ? aliased : joinPath(dirnamePath(fromPath), trimmed);

  return candidatesForBase(base, fileSet);
}

export function buildFileContentMap(
  files: ProjectFileEntry[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of files) {
    if (!file.path) continue;
    map.set(toPosixPath(file.path), file.content ?? "");
  }
  return map;
}
