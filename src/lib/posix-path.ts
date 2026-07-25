/**
 * POSIX-style path helpers for the virtual project filesystem.
 *
 * Project files are stored with relative, forward-slash paths and no leading
 * slash (`src/app/page.tsx`). Absolute paths (`/src/app`) only exist while a
 * user navigates the terminal.
 */

/** Split a path into segments, dropping empties and resolving `.` / `..`. */
export function collapseSegments(path: string): string[] {
  const segments: string[] = [];

  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      segments.pop();
      continue;
    }
    segments.push(part);
  }

  return segments;
}

/** Normalize separators and strip leading/duplicate slashes, keeping `..`. */
export function toPosixPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
}

/** Collapse `.` / `..` segments into a clean project-relative path. */
export function normalizeRelativePath(path: string): string {
  return collapseSegments(toPosixPath(path)).join("/");
}

/** Resolve `path` against `cwd` into an absolute path such as `/src/app`. */
export function resolveAbsolutePath(path: string, cwd: string): string {
  const base = path.startsWith("/") ? path : `${cwd}/${path}`;
  const segments = collapseSegments(base);
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

/** Convert an absolute path to the project-relative form used by file records. */
export function toProjectPath(absolutePath: string): string {
  return absolutePath === "/" ? "" : absolutePath.replace(/^\/+/, "");
}

/** Parent directory of a path, or `""` at the root. */
export function dirnamePath(path: string): string {
  const normalized = toPosixPath(path);
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}

/** Join segments into a normalized project-relative path. */
export function joinPath(...parts: string[]): string {
  return normalizeRelativePath(parts.filter(Boolean).join("/"));
}
