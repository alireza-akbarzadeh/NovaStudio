/**
 * Detect package manager from lockfiles and build install commands.
 */

import type { PackageManager } from "@/features/workspace/lib/terminal/package-scripts";

export type LockfilePaths = {
  hasNpm: boolean;
  hasPnpm: boolean;
  hasYarn: boolean;
  hasBun: boolean;
};

export function detectLockfiles(
  paths: Iterable<string>,
): LockfilePaths {
  let hasNpm = false;
  let hasPnpm = false;
  let hasYarn = false;
  let hasBun = false;

  for (const raw of paths) {
    const path = raw.replace(/^\/+/, "");
    if (path === "package-lock.json" || path.endsWith("/package-lock.json")) {
      hasNpm = true;
    } else if (
      path === "pnpm-lock.yaml" ||
      path.endsWith("/pnpm-lock.yaml")
    ) {
      hasPnpm = true;
    } else if (path === "yarn.lock" || path.endsWith("/yarn.lock")) {
      hasYarn = true;
    } else if (
      path === "bun.lock" ||
      path === "bun.lockb" ||
      path.endsWith("/bun.lock") ||
      path.endsWith("/bun.lockb")
    ) {
      hasBun = true;
    }
  }

  return { hasNpm, hasPnpm, hasYarn, hasBun };
}

/** Prefer the lockfile's package manager; default to npm. */
export function detectPackageManager(
  paths: Iterable<string>,
): PackageManager {
  const locks = detectLockfiles(paths);
  if (locks.hasPnpm) return "pnpm";
  if (locks.hasYarn) return "yarn";
  if (locks.hasBun) return "bun";
  if (locks.hasNpm) return "npm";
  return "npm";
}

/** Args for a fresh install (`npm install`, `pnpm install`, …). */
export function installArgs(pm: PackageManager): string[] {
  switch (pm) {
    case "yarn":
      return ["install"];
    case "bun":
      return ["install"];
    case "pnpm":
      return ["install"];
    case "npm":
    default:
      return ["install"];
  }
}

export function installCommandLine(pm: PackageManager): string {
  return `${pm} ${installArgs(pm).join(" ")}`;
}

/** Paths we may want to sync back to Convex after install/add/remove. */
export const SYNCABLE_MANIFEST_PATHS = [
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
] as const;

/** True when the package-manager args mutate deps / lockfiles. */
export function isInstallLikeCommand(args: string[]): boolean {
  const head = args[0];
  if (!head) return false;
  return [
    "install",
    "i",
    "add",
    "remove",
    "uninstall",
    "un",
    "update",
    "upgrade",
    "ci",
  ].includes(head);
}
