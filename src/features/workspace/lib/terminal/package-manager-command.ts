/**
 * `npm` / `pnpm` / `yarn` / `bun` handling.
 * Execution is simulated — this only resolves and validates script names.
 */

import { getPackageScripts } from "@/features/workspace/lib/terminal/package-scripts";
import type { PackageManager } from "@/features/workspace/lib/terminal/package-scripts";
import type {
  ShellContext,
  ShellResult,
} from "@/features/workspace/lib/terminal/types";

/** `npm run <script>`, plus the `yarn <script>` shorthand. */
function parseScriptName(
  binary: PackageManager,
  args: string[],
): string | undefined {
  if (args[0] === "run") return args[1];
  if (binary === "yarn" && args[0]) return args[0];
  return undefined;
}

export function handlePackageManagerCommand(
  binary: PackageManager,
  args: string[],
  context: ShellContext,
): ShellResult {
  const cwd = context.cwd;
  const scripts = getPackageScripts(context.files, cwd);

  if (scripts.length === 0) {
    return {
      output: `${binary}: no package.json scripts found in this project`,
      exitCode: 1,
      cwd,
    };
  }

  const scriptName = parseScriptName(binary, args);
  const scriptList = scripts.map((name) => `  ${name}`);

  if (!scriptName) {
    return {
      output: [
        `${binary}: scripts from package.json (Tab / → to autocomplete):`,
        ...scriptList,
        "",
        "Execution is simulated — Node is not available in this terminal yet.",
      ].join("\n"),
      exitCode: 0,
      cwd,
    };
  }

  if (!scripts.includes(scriptName)) {
    return {
      output: [
        `${binary}: missing script: ${scriptName}`,
        "",
        "Available scripts:",
        ...scriptList,
      ].join("\n"),
      exitCode: 1,
      cwd,
    };
  }

  return {
    output: [
      `${binary}: would run script "${scriptName}"`,
      "",
      "Script execution is not available yet (simulated shell).",
      "Autocomplete stays in sync with package.json as you edit it.",
    ].join("\n"),
    exitCode: 0,
    cwd,
  };
}
