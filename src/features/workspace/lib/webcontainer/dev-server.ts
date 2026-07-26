/**
 * Detect and spawn a project preview / dev server inside WebContainer.
 */

import type { WebContainer, WebContainerProcess } from "@webcontainer/api";

import {
  isHttpDevScriptBody,
  packageHasFrameworkDeps,
  parsePackageJson,
} from "@/features/workspace/lib/preview-host";
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
 * Skips non-HTTP scripts (e.g. plain `node src/index.ts`) so Node CLI
 * templates do not hang on "Starting…".
 */
export function detectDevScript(packageJsonContent: string): string | null {
  const parsed = parsePackageJson(packageJsonContent);
  if (!parsed?.scripts) return null;

  for (const name of PREFERRED_DEV_SCRIPTS) {
    const body = parsed.scripts[name];
    if (typeof body !== "string" || !body.trim()) continue;
    if (isHttpDevScriptBody(body)) return name;
  }

  // Framework deps with a preferred script name even if body is opaque
  // (e.g. custom wrapper) — still try `dev` / `start`.
  if (packageHasFrameworkDeps(parsed)) {
    for (const name of PREFERRED_DEV_SCRIPTS) {
      const body = parsed.scripts[name];
      if (typeof body === "string" && body.trim()) return name;
    }
  }

  return null;
}

/** Extra CLI flags so Vite/Next bind on 0.0.0.0 inside WebContainer. */
function resolveHostFlags(
  script: string,
  packageJsonContent?: string | null,
): string[] {
  const pkg = parsePackageJson(packageJsonContent ?? null);
  const body =
    typeof pkg?.scripts?.[script] === "string"
      ? (pkg.scripts[script] as string)
      : "";
  const deps = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
  };

  const isNext = "next" in deps || /\bnext\b/.test(body);
  const isVite = "vite" in deps || /\bvite\b/.test(body);

  if (isNext) {
    if (/\b--hostname\b/.test(body)) return [];
    return ["--hostname", "0.0.0.0"];
  }

  if (isVite) {
    if (/\b--host\b/.test(body)) return [];
    return ["--host", "0.0.0.0"];
  }

  return [];
}

/** Build `npm run dev` (or pm equivalent) args, with WC host flags when needed. */
export function buildDevServerCommand(
  pm: PackageManager,
  script: string,
  packageJsonContent?: string | null,
): DevServerCommand {
  const hostFlags = resolveHostFlags(script, packageJsonContent);

  let args: string[];
  if (pm === "yarn" && (script === "dev" || script === "start")) {
    args = [script, ...hostFlags];
  } else if (hostFlags.length > 0) {
    args = ["run", script, "--", ...hostFlags];
  } else {
    args = ["run", script];
  }

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
    env: {
      HOST: "0.0.0.0",
      // Next.js respects this in some versions alongside --hostname.
      HOSTNAME: "0.0.0.0",
    },
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
