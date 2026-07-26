/**
 * Decide whether preview should use WebContainer (real Vite/Next) or esbuild.
 */

import {
  findProjectEntryPath,
  normalizeProjectPath,
} from "@/features/workspace/lib/preview-utils";

export type PreviewHostMode = "webcontainer" | "esbuild" | "none";

type PackageJsonShape = {
  scripts?: Record<string, unknown>;
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
};

/** Deps that need a real Node dev server, not the esbuild fallback. */
const FRAMEWORK_DEP_KEYS = [
  "next",
  "vite",
  "@vitejs/plugin-react",
  "@tanstack/react-start",
  "@tanstack/react-router",
  "nuxt",
  "astro",
  "@remix-run/dev",
  "react-scripts",
] as const;

/** Script bodies that look like HTTP preview / dev servers. */
const HTTP_SCRIPT_RE =
  /\b(vite|next|nuxt|remix|astro|webpack-dev-server|parcel|serve|http-server|react-scripts|ng\s+serve|turbo\s+dev)\b/i;

/** Scripts that are clearly non-HTTP (CLI / watchers). */
const NON_HTTP_SCRIPT_RE =
  /^(node|tsx|ts-node|nodemon)\b/i;

export function parsePackageJson(
  content: string | null | undefined,
): PackageJsonShape | null {
  if (!content?.trim()) return null;
  try {
    const parsed = JSON.parse(content) as PackageJsonShape;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function depMap(pkg: PackageJsonShape): Record<string, unknown> {
  return {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };
}

export function packageHasFrameworkDeps(
  pkg: PackageJsonShape | null,
): boolean {
  if (!pkg) return false;
  const deps = depMap(pkg);
  return FRAMEWORK_DEP_KEYS.some((key) => key in deps);
}

export function isHttpDevScriptBody(scriptBody: string): boolean {
  const trimmed = scriptBody.trim();
  if (!trimmed) return false;
  if (HTTP_SCRIPT_RE.test(trimmed)) return true;
  // Explicit non-HTTP node runners
  if (NON_HTTP_SCRIPT_RE.test(trimmed)) return false;
  return false;
}

function isNextPagePath(path: string) {
  return /(^|\/)app\/page\.(t|j)sx$/i.test(normalizeProjectPath(path));
}

/**
 * True when this project must use WebContainer for a faithful preview
 * (Next, Vite, TanStack, etc.).
 */
export function projectNeedsWebContainerHost(
  packageJsonContent: string | null | undefined,
  paths?: Iterable<string>,
): boolean {
  const pkg = parsePackageJson(packageJsonContent);
  if (packageHasFrameworkDeps(pkg)) return true;

  if (pkg?.scripts) {
    for (const value of Object.values(pkg.scripts)) {
      if (typeof value === "string" && isHttpDevScriptBody(value)) {
        return true;
      }
    }
  }

  if (paths) {
    const entry = findProjectEntryPath(paths);
    if (entry && isNextPagePath(entry)) return true;
  }

  return false;
}

/**
 * Pick the preview backend for the current project.
 * - `webcontainer` — real `npm run dev` (Vite / Next / …)
 * - `esbuild` — static HTML / simple client bundles
 * - `none` — no preview (e.g. Node CLI packages)
 */
export function detectPreviewHost(options: {
  packageJson?: string | null;
  paths: Iterable<string>;
}): PreviewHostMode {
  const { packageJson, paths } = options;

  if (projectNeedsWebContainerHost(packageJson, paths)) {
    return "webcontainer";
  }

  const entry = findProjectEntryPath(paths);
  if (!entry) return "none";

  if (entry === "index.html") return "esbuild";

  // JS/TS entry without a framework — only esbuild if it isn't a Node CLI pkg.
  if (/\.(tsx?|jsx?)$/i.test(entry)) {
    const pkg = parsePackageJson(packageJson);
    if (pkg?.scripts) {
      const scriptBodies = Object.values(pkg.scripts).filter(
        (v): v is string => typeof v === "string",
      );
      if (
        scriptBodies.length > 0 &&
        scriptBodies.every((body) => !isHttpDevScriptBody(body))
      ) {
        return "none";
      }
    }
    return "esbuild";
  }

  return "none";
}
