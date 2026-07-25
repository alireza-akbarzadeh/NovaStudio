/**
 * `npm` / `pnpm` / `yarn` / `bun` handling.
 * Uses WebContainer when available; otherwise explains the simulated fallback.
 */

import { getPackageScripts } from "@/features/workspace/lib/terminal/package-scripts";
import type { PackageManager } from "@/features/workspace/lib/terminal/package-scripts";
import type {
  ShellContext,
  ShellHandlers,
  ShellResult,
} from "@/features/workspace/lib/terminal/types";

function simulatedFallback(
  binary: PackageManager,
  args: string[],
  context: ShellContext,
): ShellResult {
  const cwd = context.cwd;
  const scripts = getPackageScripts(context.files, cwd);
  const scriptList = scripts.map((name) => `  ${name}`);
  const cmdline = [binary, ...args].join(" ");

  if (scripts.length > 0 && args.length === 0) {
    return {
      output: [
        `${binary}: scripts from package.json (Tab / → to autocomplete):`,
        ...scriptList,
        "",
        "WebContainer is not ready — install/run is unavailable until the runtime boots.",
      ].join("\n"),
      exitCode: 0,
      cwd,
    };
  }

  return {
    output: [
      `${binary}: WebContainer is not ready — cannot execute "${cmdline}"`,
      "Wait for the Node runtime status in the terminal banner, then retry.",
    ].join("\n"),
    exitCode: 1,
    cwd,
  };
}

export async function handlePackageManagerCommand(
  binary: PackageManager,
  args: string[],
  context: ShellContext,
  handlers: ShellHandlers = {},
): Promise<ShellResult> {
  if (handlers.runInWebContainer) {
    // Handler streams to the terminal; return empty output to avoid double-print.
    return handlers.runInWebContainer(binary, args, context.cwd);
  }

  return simulatedFallback(binary, args, context);
}
