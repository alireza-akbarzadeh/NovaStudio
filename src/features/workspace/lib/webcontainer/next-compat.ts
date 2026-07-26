/**
 * Next.js ↔ WebContainer compatibility helpers.
 *
 * Next 15.5+ / 16 crash in WebContainers with workStore / AsyncLocalStorage
 * errors; Turbopack’s turbo.createProject is unsupported on WASM bindings.
 *
 * @see https://github.com/stackblitz/webcontainer-core/issues/1978
 * @see https://github.com/stackblitz/webcontainer-core/issues/2065
 */

import { parsePackageJson } from "@/features/workspace/lib/preview-host";

/** Last Next.js release known to render inside WebContainers. */
export const WEBCONTAINER_NEXT_VERSION = "15.3.9";

/** True when this Next version range is likely to crash the WC preview. */
export function isNextVersionRiskyInWebContainer(version: string): boolean {
  const v = version.trim().toLowerCase().replace(/^[^\d]*/, "");
  const raw = version.trim().toLowerCase();
  if (!raw || raw === "latest" || raw === "canary") return true;
  if (raw === "15" || raw.startsWith("15.")) {
    const match = /^15\.(\d+)/.exec(raw);
    if (!match) return true;
    return Number(match[1]) >= 5;
  }
  const major = Number(/^(\d+)/.exec(v)?.[1]);
  return Number.isFinite(major) && major >= 16;
}

/** Read `next` dependency version from package.json text (best-effort). */
export function getNextVersionFromPackageJson(
  content: string | null | undefined,
): string | null {
  const pkg = parsePackageJson(content);
  if (!pkg) return null;
  const deps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };
  const next = deps.next;
  return typeof next === "string" && next.trim() ? next.trim() : null;
}

/** Strip leading ^/~/= from a semver range for risk checks. */
export function normalizeNextVersionRange(version: string): string {
  return version.trim().replace(/^[\^~>=<\s]+/, "");
}

export function packageJsonHasRiskyNext(
  content: string | null | undefined,
): boolean {
  const version = getNextVersionFromPackageJson(content);
  if (!version) return false;
  return isNextVersionRiskyInWebContainer(normalizeNextVersionRange(version));
}

/** Detect the known WebContainer Next runtime failures from log / overlay text. */
export function isWebContainerNextRuntimeError(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("expected workstore to be initialized") ||
    lower.includes("expected workunitasyncstorage") ||
    lower.includes("turbo.createproject is not supported") ||
    lower.includes("turbo.createproject` is not supported")
  );
}

export function webContainerNextCompatFixCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun" = "npm",
): string {
  const version = WEBCONTAINER_NEXT_VERSION;
  switch (packageManager) {
    case "pnpm":
      return `pnpm add next@${version} eslint-config-next@${version}`;
    case "yarn":
      return `yarn add next@${version} eslint-config-next@${version}`;
    case "bun":
      return `bun add next@${version} eslint-config-next@${version}`;
    case "npm":
    default:
      return `npm install next@${version} eslint-config-next@${version}`;
  }
}

/** Human-readable overlay copy when the WC Next runtime bug is hit. */
export function formatWebContainerNextCompatMessage(options?: {
  installedVersion?: string | null;
  packageManager?: "npm" | "pnpm" | "yarn" | "bun";
}): string {
  const fix = webContainerNextCompatFixCommand(
    options?.packageManager ?? "npm",
  );
  const installed = options?.installedVersion
    ? ` (this project has next@${options.installedVersion})`
    : "";

  return [
    `Next.js preview is broken in the in-browser runtime${installed}.`,
    "",
    "Next.js 15.5+ and 16 rely on APIs WebContainer cannot run yet",
    "(workStore / AsyncLocalStorage). This is not a bug in your app code.",
    "",
    "Fix — pin a compatible version in the terminal, then restart preview:",
    "",
    `  ${fix}`,
    "  rm -rf .next",
  ].join("\n");
}

/**
 * If the raw error is the known WC Next crash, replace it with product copy.
 * Otherwise return null (caller keeps the original message).
 */
export function rewriteWebContainerNextError(
  message: string,
  options?: {
    packageJson?: string | null;
    packageManager?: "npm" | "pnpm" | "yarn" | "bun";
  },
): string | null {
  if (!isWebContainerNextRuntimeError(message)) return null;
  return formatWebContainerNextCompatMessage({
    installedVersion: getNextVersionFromPackageJson(options?.packageJson),
    packageManager: options?.packageManager,
  });
}
