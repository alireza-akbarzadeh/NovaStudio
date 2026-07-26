/**
 * Detect and spawn a project preview / dev server inside WebContainer.
 */

import type { WebContainer, WebContainerProcess } from "@webcontainer/api";

import type { PackageManager } from "@/features/workspace/lib/terminal/package-scripts";
import { PREVIEW_RUNTIME_BRIDGE_SCRIPT } from "@/features/workspace/lib/preview-runtime-bridge";

/** Preferred script names, in order. */
export const PREFERRED_DEV_SCRIPTS = [
  "dev",
  "start",
  "preview",
  "serve",
] as const;

export type DevServerCommand = {
  binary: PackageManager;
  args: string[];
  script: string;
  commandLine: string;
};

/**
 * Pick the best npm script for a live preview from package.json text.
 * Returns null when there is no suitable script.
 */
export function detectDevScript(packageJsonContent: string): string | null {
  try {
    const parsed = JSON.parse(packageJsonContent) as {
      scripts?: Record<string, unknown>;
    };
    const scripts = parsed.scripts;
    if (!scripts || typeof scripts !== "object") return null;

    for (const name of PREFERRED_DEV_SCRIPTS) {
      if (typeof scripts[name] === "string" && scripts[name]) {
        return name;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Build `npm run dev` (or pm equivalent) args. */
export function buildDevServerCommand(
  pm: PackageManager,
  script: string,
): DevServerCommand {
  const args =
    pm === "yarn" && (script === "dev" || script === "start")
      ? [script]
      : ["run", script];

  return {
    binary: pm,
    args,
    script,
    commandLine: `${pm} ${args.join(" ")}`,
  };
}

/** Inject NovaStudio console / error bridge into every WC-served HTML page. */
export async function injectPreviewBridge(wc: WebContainer): Promise<void> {
  await wc.setPreviewScript(PREVIEW_RUNTIME_BRIDGE_SCRIPT);
}

/**
 * Spawn the long-lived preview process (does not wait for exit).
 * Caller should listen for `server-ready` and call `kill()` on teardown.
 */
export async function spawnDevServer(
  wc: WebContainer,
  command: DevServerCommand,
  options?: {
    onChunk?: (chunk: string) => void;
  },
): Promise<WebContainerProcess> {
  const process = await wc.spawn(command.binary, command.args, {
    terminal: { cols: 120, rows: 30 },
  });

  if (options?.onChunk) {
    const reader = process.output.getReader();
    const onChunk = options.onChunk;
    void (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) onChunk(value);
        }
      } catch {
        // Process killed / torn down.
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // already released
        }
      }
    })();
  }

  return process;
}

/** Strip common ANSI sequences for console display. */
export function stripAnsi(text: string): string {
  return text
    // eslint-disable-next-line no-control-regex -- intentional ANSI strip
    .replace(/\u001b\[[0-9;?]*[a-zA-Z]/g, "")
    .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "")
    .replace(/\r/g, "");
}

/** Heuristic log level from a server output line. */
export function inferServerLogLevel(
  line: string,
): "log" | "info" | "warn" | "error" {
  const lower = line.toLowerCase();
  if (
    /\berror\b/.test(lower) ||
    /\bfailed\b/.test(lower) ||
    /✗|✖|×/.test(line)
  ) {
    return "error";
  }
  if (/\bwarn(ing)?\b/.test(lower) || /⚠/.test(line)) {
    return "warn";
  }
  if (/\b(ready|listening|local:|network:)\b/.test(lower)) {
    return "info";
  }
  return "log";
}
