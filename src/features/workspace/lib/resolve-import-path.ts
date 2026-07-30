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

/** Max Monaco definition helper models kept in memory per editor session. */
const DEFINITION_FILE_CAP = 48;

/** Max same-directory siblings included for local symbol navigation. */
const SAME_DIR_CAP = 12;

/** Max files pulled in from each resolved import target directory. */
const IMPORT_DIR_CAP = 6;

const ROOT_CONFIG_FILES = ["package.json", "tsconfig.json", "jsconfig.json"];

const IMPORT_SPECIFIER_RE =
  /(?:import|export)\s+(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]/g;

function addSameDirectoryFiles(
  selected: Set<string>,
  paths: string[],
  dir: string,
  byPath: Map<string, ProjectFileEntry>,
  cap: number,
) {
  let count = 0;
  for (const path of paths) {
    if (selected.size >= DEFINITION_FILE_CAP) return;
    if (dirnamePath(path) !== dir) continue;
    if (!byPath.has(path)) continue;
    selected.add(path);
    count++;
    if (count >= cap) return;
  }
}

/** Bounded subset of project files for Monaco go-to-definition (memory). */
export function selectDefinitionFiles(
  currentPath: string,
  files: ProjectFileEntry[],
): ProjectFileEntry[] {
  if (files.length <= DEFINITION_FILE_CAP) {
    return files;
  }

  const paths = files.map((file) => file.path);
  const byPath = new Map(files.map((file) => [file.path, file]));
  const selected = new Set<string>();

  const tryAdd = (path: string) => {
    if (selected.size >= DEFINITION_FILE_CAP || !byPath.has(path)) return;
    selected.add(path);
  };

  tryAdd(currentPath);

  const currentDir = dirnamePath(currentPath);
  if (currentDir) {
    addSameDirectoryFiles(selected, paths, currentDir, byPath, SAME_DIR_CAP);
  }

  const current = byPath.get(currentPath);
  if (current?.content) {
    for (const match of current.content.matchAll(IMPORT_SPECIFIER_RE)) {
      const resolved = resolveImportPath(currentPath, match[1], paths);
      if (!resolved) continue;
      tryAdd(resolved);
      const resolvedDir = dirnamePath(resolved);
      if (resolvedDir) {
        addSameDirectoryFiles(
          selected,
          paths,
          resolvedDir,
          byPath,
          IMPORT_DIR_CAP,
        );
      }
    }
  }

  for (const config of ROOT_CONFIG_FILES) {
    tryAdd(config);
  }

  return Array.from(selected, (path) => ({
    path,
    content: byPath.get(path)?.content ?? "",
  }));
}

