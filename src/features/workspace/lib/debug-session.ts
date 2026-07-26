/**
 * Instrument Node sources with `debugger;` at breakpoint lines and run
 * them inside WebContainer.
 */

import { getWebContainer } from "@/features/workspace/lib/webcontainer/boot";
import { spawnAndStream } from "@/features/workspace/lib/webcontainer/spawn";
import { useDebugStore } from "@/features/workspace/store/debug-store";

const DEBUG_DIR = ".novastudio-debug";

/** JS/TS Node scripts (not JSX/TSX React modules). */
export function isDebuggableScriptPath(path: string): boolean {
  return /\.(js|mjs|cjs|ts)$/i.test(path);
}

/**
 * Prepend `debugger;` on each breakpoint line (same line, preserves line numbers).
 */
export function instrumentWithDebugger(
  source: string,
  lines: number[],
): string {
  if (lines.length === 0) return source;
  const parts = source.split("\n");
  const set = new Set(lines);
  return parts
    .map((line, index) => {
      const lineNo = index + 1;
      if (!set.has(lineNo)) return line;
      if (/\bdebugger\b/.test(line)) return line;
      const indent = line.match(/^\s*/)?.[0] ?? "";
      const rest = line.slice(indent.length);
      return `${indent}debugger; ${rest}`;
    })
    .join("\n");
}

function debugOutputPath(sourcePath: string): string {
  const base = sourcePath.replace(/^.*\//, "").replace(/[^\w.-]+/g, "_");
  return `${DEBUG_DIR}/${base}`;
}

function buildNodeArgs(instrumentedPath: string): {
  binary: string;
  args: string[];
  commandLine: string;
} {
  const isTs = /\.ts$/i.test(instrumentedPath);
  if (isTs) {
    const args = ["--experimental-strip-types", instrumentedPath];
    return {
      binary: "node",
      args,
      commandLine: `node ${args.join(" ")}`,
    };
  }
  return {
    binary: "node",
    args: [instrumentedPath],
    commandLine: `node ${instrumentedPath}`,
  };
}

let abortController: AbortController | null = null;

export function stopDebugSession(): void {
  abortController?.abort();
  abortController = null;
}

/**
 * Write an instrumented copy into WC and run it with Node.
 * Open Chrome DevTools on this tab so `debugger` statements pause.
 */
export async function startDebugSession(options: {
  path: string;
  source: string;
  breakpoints: number[];
}): Promise<void> {
  const store = useDebugStore.getState();
  if (store.status === "running") {
    stopDebugSession();
  }

  const wc = getWebContainer();
  if (!wc) {
    store.failSession("WebContainer is not ready");
    return;
  }

  const instrumented = instrumentWithDebugger(
    options.source,
    options.breakpoints,
  );
  const outPath = debugOutputPath(options.path);
  const { binary, args, commandLine } = buildNodeArgs(outPath);

  store.beginSession(options.path, commandLine);
  store.appendOutput(
    "Open browser DevTools (F12) before continuing so `debugger` pauses.\n",
  );
  store.appendOutput(`$ ${commandLine}\n`);

  abortController = new AbortController();
  const signal = abortController.signal;

  try {
    await wc.fs.mkdir(DEBUG_DIR, { recursive: true });
    await wc.fs.writeFile(outPath, instrumented);

    const exitCode = await spawnAndStream(wc, binary, args, {
      signal,
      onChunk: (chunk) => {
        useDebugStore.getState().appendOutput(chunk);
      },
    });

    if (signal.aborted) {
      useDebugStore.getState().appendOutput("\n[stopped]\n");
      useDebugStore.getState().endSession(exitCode);
      return;
    }

    useDebugStore.getState().appendOutput(`\n[exit ${exitCode}]\n`);
    useDebugStore.getState().endSession(exitCode);
  } catch (err) {
    if (signal.aborted) {
      useDebugStore.getState().endSession(1);
      return;
    }
    useDebugStore.getState().failSession(
      err instanceof Error ? err.message : "Debug session failed",
    );
  } finally {
    abortController = null;
  }
}
