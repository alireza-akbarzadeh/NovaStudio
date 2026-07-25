/** `ls` / `cat` / `cd` against the in-memory project file list. */

import { resolveAbsolutePath, toProjectPath } from "@/lib/posix-path";
import type { ShellFile } from "@/features/workspace/lib/terminal/types";

type FileKind = ShellFile["kind"];

export type ReadFileResult =
  | { ok: true; content: string }
  | { ok: false; message: string };

/**
 * Direct children of `directory`, mapping each name to its kind.
 * Nested paths contribute their first segment as a folder.
 */
function directChildren(
  files: ShellFile[],
  directory: string,
): Map<string, FileKind> {
  const entries = new Map<string, FileKind>();

  for (const file of files) {
    const path = file.path;
    if (directory && !path.startsWith(`${directory}/`) && path !== directory) {
      continue;
    }

    const remainder = directory ? path.slice(directory.length + 1) : path;
    const segment = remainder.split("/")[0];
    if (!segment) continue;

    entries.set(segment, remainder.includes("/") ? "folder" : file.kind);
  }

  return entries;
}

/** Folders first, then files, each alphabetical — mirrors `ls` grouping. */
function formatEntries(entries: Map<string, FileKind>): string {
  return [...entries.entries()]
    .sort(([aName, aKind], [bName, bKind]) => {
      if (aKind !== bKind) {
        return aKind === "folder" ? -1 : 1;
      }
      return aName.localeCompare(bName);
    })
    .map(([name, kind]) => (kind === "folder" ? `${name}/` : name))
    .join("\n");
}

export function listDirectory(
  files: ShellFile[],
  cwd: string,
  targetPath: string,
): string {
  const absolute = resolveAbsolutePath(targetPath, cwd);
  const entries = directChildren(files, toProjectPath(absolute));

  if (entries.size === 0) {
    return absolute === "/"
      ? "(empty project)"
      : `ls: ${targetPath}: No such directory`;
  }

  return formatEntries(entries);
}

export function readFile(
  files: ShellFile[],
  cwd: string,
  targetPath: string,
): ReadFileResult {
  const path = toProjectPath(resolveAbsolutePath(targetPath, cwd));
  const file = files.find((entry) => entry.kind === "file" && entry.path === path);

  if (!file) {
    return { ok: false, message: `cat: ${targetPath}: No such file` };
  }

  return { ok: true, content: file.content ?? "" };
}

/**
 * Folders are implied by file paths rather than stored, so a directory exists
 * when any file path starts with it.
 */
export function directoryExists(
  files: ShellFile[],
  absolutePath: string,
): boolean {
  if (absolutePath === "/") return true;

  const prefix = toProjectPath(absolutePath);
  return files.some((file) => file.path.startsWith(prefix));
}
